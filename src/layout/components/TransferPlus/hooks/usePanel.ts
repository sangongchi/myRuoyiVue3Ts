import { ref, reactive, computed, nextTick } from 'vue';
import { cloneDeep } from 'lodash-es';
import { tree2Array, array2Tree, tree2LeafArray, removeTopPId, type TreeNode } from '@/utils/treeUtil';

/** 面板方向 */
export type Direction = 'left' | 'right';

/** 字段别名（与 index.vue 中定义一致） */
export interface FieldAlias {
  label: string;
  key: string;
  disabled: string | ((data: any, node?: any) => boolean);
  children: string;
}

/** 面板运行时状态 */
export interface PanelState<T = TreeNode> {
  id: string;
  isIndeterminate: boolean;
  checkAll: boolean;
  checks: (string | number)[];
  query: string;
  data: T[];
  filterData: T[];
}

export interface UsePanelOptions {
  direction: Direction;
  isTree: boolean;
  limit: number;
  filterMethod: ((query: string, item: any) => boolean) | null;
  propsAlias: FieldAlias;
  /** 对侧面板 filterData（用于 limit 判断） */
  oppositeFilterData: () => any[];
  /** 对侧 tree ref 取值函数（用于 limit 判断） */
  oppositeTreeRef: () => any;
  /** 外部注入的 tree 组件实例 ref（由 Panel 暴露） */
  treeCompRef?: () => any;
}

/**
 * 单个面板的逻辑封装：状态、搜索过滤、全选/半选、勾选处理。
 * 左右面板共用同一份逻辑。
 */
export function usePanel(options: UsePanelOptions) {
  const { direction, isTree, limit, filterMethod, propsAlias, oppositeFilterData, oppositeTreeRef, treeCompRef } = options;

  const treeRef = ref();

  /** 将外部 Panel 暴露的 tree 组件实例同步到 treeRef */
  const bindTreeComp = (comp: any) => {
    treeRef.value = comp;
  };

  const state = reactive<PanelState>({
    id: `${direction}Panel${Date.now()}`,
    isIndeterminate: false,
    checkAll: false,
    checks: [],
    query: '',
    data: [],
    filterData: []
  });

  /** 所有叶子节点（树形模式用） */
  const leafArrayAll = computed(() => tree2LeafArray(state.data));

  /** 头部勾选计数标签：已勾选/可勾选总数 */
  const checkedLabel = computed(() => {
    const total = isTree ? tree2LeafArray(state.data).length : state.data.length;
    return `${state.checks.length}/${total}`;
  });

  /** limit 机制专用的"额外 disabled"判断器
   *  修复：原实现直接覆盖 propsAlias.disabled 函数，而 propsAlias 是左右两个 panel 共享的对象，
   *  左侧 applyLimitDisabled 注入的闭包会污染右侧 panel 的 disabled 判定，
   *  导致右侧项目被误标 disabled → checkableData 为空 → 全选失效。
   *  改为 panel 内部独立 ref 持有额外判断，与 propsAlias 解耦。
   */
  const extraDisabled = ref<((data: any, node?: any) => boolean) | null>(null);

  /** 解析 disabled：支持字符串字段名或函数
   *  注意：node 可能为 undefined（从 checkableData/refreshCheckAll 等数据流调用时没有 el-tree Node 实例）
   *  函数实现需要做 node 容错
   */
  const resolveDisabled = (item: any, node?: any): boolean => {
    const d = propsAlias.disabled;
    let base: boolean;
    if (typeof d === 'function') base = d(item, node);
    else base = !!item[d as string];
    if (base) return true;
    if (extraDisabled.value) return extraDisabled.value(item, node);
    return false;
  };

  /** 从数据本身判断 disabled（无 node 依赖，供全选/统计使用） */
  const isItemDisabled = (item: any): boolean => {
    const d = propsAlias.disabled;
    let base: boolean;
    if (typeof d === 'function') {
      try {
        base = d(item, undefined);
      } catch {
        base = !!item.disabled;
      }
    } else {
      base = !!item[d as string];
    }
    if (base) return true;
    if (extraDisabled.value) {
      try {
        return extraDisabled.value(item, undefined);
      } catch {
        return false;
      }
    }
    return false;
  };

  /** 可勾选项（排除 disabled） */
  const checkableData = computed(() => {
    const list = isTree ? tree2LeafArray(state.filterData) : state.filterData;
    return list.filter((item: any) => !isItemDisabled(item));
  });

  /** limit 限制：树形左侧启用，超过数量后未选中项禁用
   *  node 来自 el-tree 的 props.disabled(data, node) 回调：
   *  - data: 当前节点的原始数据对象
   *  - node: el-tree 内部 Node 对象，node.key 对应 node-key 设置的值
   *
   *  逻辑：
   *  1. 允许勾选父节点（el-tree 会自动勾选/取消所有子节点）
   *  2. 统计当前已勾选叶子数 + 对侧已选叶子数，达到 limit 后禁用未勾选的叶子
   *  3. 父节点在达到 limit 后也禁用，避免勾选父节点导致超出 limit
   *
   *  注意：不能直接修改 propsAlias.disabled，因为 propsAlias 是左右两个 panel 共享的
   *  同一对象，会污染对侧 panel 的 disabled 判定。改为填充 panel 内部的 extraDisabled ref，
   *  由 resolveDisabled / isItemDisabled 串联调用。
   */
  const applyLimitDisabled = () => {
    if (!isTree || !limit) return;
    extraDisabled.value = (data: any, node: any) => {
      // 当前面板已勾选的叶子 key
      const selectedKeys = treeRef.value?.getCheckedKeys(true) || [];
      // 对侧已选叶子数：树形取叶子数，列表取 filterData 长度
      const oppositeCount = getOppositeSelectedCount();
      const reached = oppositeCount + selectedKeys.length >= limit;

      // 已勾选的节点允许取消（node 可能为 undefined，做容错）
      if (node && node.checked) return false;

      // 达到 limit 后禁用所有未勾选节点（含父节点，避免勾选父节点超出 limit）
      return reached;
    };
  };

  /** 获取对侧已选叶子数量 */
  const getOppositeSelectedCount = (): number => {
    const oppositeTree = oppositeTreeRef();
    if (oppositeTree) {
      // 对侧是树形：取已勾选叶子数
      return oppositeTree.getCheckedKeys?.(true)?.length || 0;
    }
    // 对侧是列表：filterData 即为已选数据
    return oppositeFilterData().length;
  };

  /** 计算全选 / 半选状态 */
  const refreshCheckAll = () => {
    const items = checkableData.value;
    if (!items.length) {
      state.checkAll = false;
      state.isIndeterminate = state.checks?.length ? true : false;
      return;
    }
    const checkedCount = items.filter((item: any) => state.checks.includes(item[propsAlias.key])).length;
    state.checkAll = checkedCount === items.length;
    state.isIndeterminate = checkedCount > 0 && checkedCount < items.length;
  };

  /** 搜索过滤：树形拍平→过滤→重建树；列表直接 filter */
  const filter = () => {
    if (isTree) {
      const flat = tree2Array(state.data);
      const matched = flat.filter((item) => matchQuery(item));
      // 非命中叶子标记 disabled，避免误选
      const temp = cloneDeep(matched).map((item: any) => {
        if (state.query && !leafArrayAll.value.some((el: any) => el[propsAlias.key] === item[propsAlias.key])) {
          item[propsAlias.disabled as string] = true;
        }
        return item;
      });
      state.filterData = array2Tree(direction === 'left' ? temp : removeTopPId(temp)) as any;
      nextTick(() => {
        refreshCheckAll();
        treeRef.value?.setCheckedKeys(state.checks, false);
      });
    } else {
      state.filterData = state.data.filter((item) => matchQuery(item));
    }
  };

  const matchQuery = (item: any) => {
    if (typeof filterMethod === 'function') return filterMethod(state.query, item);
    return item[propsAlias.label]?.toLowerCase().includes(state.query.toLowerCase());
  };

  /** 勾选项变化（来自 checkbox-group 或 tree check 事件） */
  const onCheckChange = () => {
    if (isTree) state.checks = treeRef.value?.getCheckedKeys(true) || [];
    refreshCheckAll();
  };

  /** 全选 / 取消全选
   *  超出 limit 时自动只保留前 limit 个
   */
  const checkAllChange = (value: any) => {
    const checked = Boolean(value);
    const items = checkableData.value;
    console.log('items', items, 'checks', state.checks);
    if (!items.length) {
      // 无可勾选项：尝试把 indeterminate 状态下已选中的清空
      if (state.checks?.length) {
        if (isTree) treeRef.value?.setCheckedKeys([], false);
        state.checks = [];
        state.isIndeterminate = false;
      }
      state.checkAll = false;
      return;
    }
    let keys = checked ? items.map((item: any) => item[propsAlias.key]) : [];
    // 超出 limit：只保留前 limit 个
    if (checked && limit && keys.length > limit) {
      keys = keys.slice(0, limit);
    }
    if (isTree) treeRef.value?.setCheckedKeys(keys, false);
    state.checks = keys;
    refreshCheckAll();
  };

  /** 清空搜索关键词 */
  const clearQuery = () => {
    state.query = '';
    filter();
  };

  /** 重置勾选 */
  const resetChecks = () => {
    state.checks = [];
    state.checkAll = false;
    state.isIndeterminate = false;
    if (isTree) treeRef.value?.setCheckedKeys([], false);
  };

  return {
    state,
    treeRef,
    bindTreeComp,
    checkedLabel,
    filter,
    onCheckChange,
    checkAllChange,
    refreshCheckAll,
    clearQuery,
    resetChecks,
    applyLimitDisabled,
    resolveDisabled,
    /** 读取 panel 内部 extraDisabled 判断器（给 el-tree 渲染节点 UI 使用） */
    getExtraDisabled: () => extraDisabled.value
  };
}
