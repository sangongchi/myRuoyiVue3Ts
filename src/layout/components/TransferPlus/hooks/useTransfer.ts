import { tree2LeafArray, removeTreeLeaf, array2Tree, tree2Array, type TreeNode } from '@/utils/treeUtil';
import { usePanel, type Direction, type FieldAlias } from './usePanel';

export interface UseTransferOptions {
  propsAlias: FieldAlias;
  isLeftTree: boolean;
  isRightTree: boolean;
  targetOrder: 'original' | 'push' | 'unshift';
  limit: number;
  filterMethod: ((query: string, item: any) => boolean) | null;
  sourceData: () => TreeNode[];
  modelValue: () => TreeNode[];
  emitChange: (current: TreeNode[], direction: Direction, movedKeys: (string | number)[]) => void;
  emitModelValue: () => void;
}

/**
 * 穿梭框核心逻辑：左右面板 + 数据搬运。
 * 通过 usePanel 复用单面板逻辑，通过 moveTo 统一四种（树/列表 × 左/右）搬运场景。
 */
export function useTransfer(options: UseTransferOptions) {
  const { propsAlias, isLeftTree, isRightTree, targetOrder, limit, filterMethod, sourceData, modelValue, emitChange, emitModelValue } = options;

  // 占位引用，面板创建后即可使用
  const oppositeRefs = {
    leftTreeRef: () => left.treeRef.value,
    rightTreeRef: () => right.treeRef.value,
    leftFilterData: () => left.state.filterData,
    rightFilterData: () => right.state.filterData
  };

  const left = usePanel({
    direction: 'left',
    isTree: isLeftTree,
    limit,
    filterMethod,
    propsAlias,
    oppositeFilterData: oppositeRefs.rightFilterData,
    oppositeTreeRef: oppositeRefs.rightTreeRef
  });

  const right = usePanel({
    direction: 'right',
    isTree: isRightTree,
    limit,
    filterMethod,
    propsAlias,
    oppositeFilterData: oppositeRefs.leftFilterData,
    oppositeTreeRef: oppositeRefs.leftTreeRef
  });

  if (isLeftTree && limit) left.applyLimitDisabled();

  /** 同步左侧候选数据 = 源数据 - 已选 */
  const syncLeftData = () => {
    console.log('转换左侧数据', sourceData());
    const selectedKeys = modelValue().map((n: any) => n[propsAlias.key]);
    console.log('左侧selectedKeys', selectedKeys);
    if (isLeftTree) {
      const flat = tree2Array(sourceData()).filter((item: any) => !selectedKeys.includes(item[propsAlias.key]));
      left.state.data = array2Tree(flat) as any;
    } else {
      left.state.data = sourceData().filter((item: any) => !selectedKeys.includes(item[propsAlias.key]));
    }
    left.state.query = '';
    right.state.query = '';
    left.filter();
    right.filter();
  };

  /** 同步右侧已选数据（来自 v-model）
   *  - 右侧列表：直接用平铺的已选叶子
   *  - 右侧树：把每个已选叶子作为顶层节点展示（不构造嵌套子树），
   *    与 usePanel.filter() 中右树的 removeTopPId 行为保持一致
   */
  const syncRightData = () => {
    const sourceFlat = isLeftTree ? tree2LeafArray(sourceData()) : sourceData();
    const temp = modelValue()
      .map((node: any) => sourceFlat?.find((item: any) => item[propsAlias.key] === node[propsAlias.key]))
      .filter(Boolean) as TreeNode[];
    if (isRightTree) {
      // 每个已选叶子作为顶层节点（清空 parentId，移除残留 children）
      right.state.data = temp.map((item: any) => ({ ...item, parentId: null, children: undefined })) as any;
    } else {
      right.state.data = temp;
    }
    right.filter();
  };

  /** 按 targetOrder 把 moved 插入到目标列表 */
  const insertToList = (toState: any, moved: any[], source: any[]) => {
    if (targetOrder === 'push') {
      moved.forEach((item) => toState.data.push(item));
    } else if (targetOrder === 'unshift') {
      moved.forEach((item) => toState.data.unshift(item));
    } else {
      // original：按源数据顺序合并
      const keys = [...toState.data, ...moved].map((item) => item[propsAlias.key]);
      toState.data = source.filter((item: any) => keys.includes(item[propsAlias.key]));
    }
  };

  /**
   * 将叶子列表平铺写入右侧树面板：每个叶子作为顶层节点，parentId 清空。
   * 区别于 addTreeLeaf：不构造嵌套子树。
   */
  const mergeFlatIntoRightTree = (current: any[], movedKeys: (string | number)[]) => {
    const sourceFlat = isLeftTree ? tree2LeafArray(sourceData()) : sourceData();
    const movedItems = sourceFlat.filter((item: any) => movedKeys.includes(item[propsAlias.key]));
    const existed = new Set((current as any[]).map((item: any) => item[propsAlias.key]));
    const added = movedItems.filter((item: any) => !existed.has(item[propsAlias.key]));
    return [...current, ...added].map((item: any) => ({ ...item, parentId: null, children: undefined }));
  };

  /**
   * 统一搬运：把 from 面板中勾选的项移动到 to 面板。
   * 四种组合（树/列表 × 左/右）在此一处处理。
   */
  const moveTo = (from: Direction, to: Direction) => {
    const fromPanel = from === 'left' ? left : right;
    const toPanel = to === 'left' ? left : right;
    const fromTree = from === 'left' ? isLeftTree : isRightTree;
    const toTree = to === 'left' ? isLeftTree : isRightTree;
    const checks = fromPanel.state.checks;
    if (!checks.length) return;

    // 树→树：右侧树用平铺注入，左侧树按 removeTreeLeaf 维护
    if (fromTree && toTree) {
      toPanel.state.data = mergeFlatIntoRightTree(toPanel.state.data as any[], checks) as any;
      fromPanel.state.data = removeTreeLeaf(fromPanel.state.data, checks) as any;
      fromPanel.treeRef.value?.setCheckedKeys([], false);
    }
    // 树→列表：从源树取叶子，按 targetOrder 插入右侧列表
    else if (fromTree && !toTree) {
      const moved = tree2LeafArray(fromPanel.state.data).filter((item: any) => checks.includes(item[propsAlias.key]));
      insertToList(toPanel.state, moved, sourceData());
      // 左树→右列表：保持左树不动（与原实现一致）
      if (!(from === 'left' && isLeftTree && !isRightTree)) {
        fromPanel.state.data = fromPanel.state.data.filter((item: any) => !checks.includes(item[propsAlias.key]));
      }
    }
    // 列表→树：把勾选项作为叶子平铺注入右侧树
    else if (!fromTree && toTree) {
      toPanel.state.data = mergeFlatIntoRightTree(toPanel.state.data as any[], checks) as any;
      fromPanel.state.data = fromPanel.state.data.filter((item: any) => !checks.includes(item[propsAlias.key]));
    }
    // 列表→列表
    else {
      const moved = fromPanel.state.data.filter((item: any) => checks.includes(item[propsAlias.key]));
      insertToList(toPanel.state, moved, sourceData());
      fromPanel.state.data = fromPanel.state.data.filter((item: any) => !checks.includes(item[propsAlias.key]));
      emitChange(
        fromPanel.state.data.map((item: any) => item[propsAlias.label]),
        from,
        moved.map((item: any) => item[propsAlias.key])
      );
    }

    fromPanel.resetChecks();
    // 移动后重新同步左侧数据：剔除已穿梭到右侧的项，避免左侧仍可重复勾选
    if (from === 'left' && to === 'right') {
      syncLeftData();
    }
    left.filter();
    right.filter();
    emitModelValue();
  };

  const addFromLeft = () => moveTo('left', 'right');
  const addFromRight = () => moveTo('right', 'left');

  /** 清空指定面板搜索关键词 */
  const clearQuery = (which: Direction) => {
    if (which === 'left') left.clearQuery();
    else right.clearQuery();
  };

  return {
    left,
    right,
    syncLeftData,
    syncRightData,
    addFromLeft,
    addFromRight,
    clearQuery
  };
}
