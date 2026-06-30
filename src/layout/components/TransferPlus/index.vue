<template>
  <div class="transfer">
    <!-- 左面板 -->
    <Panel
      ref="leftPanelComp"
      :panel="left.state"
      :is-tree="isLeftTree"
      :props-alias="propsAlias"
      :extra-disabled="left.getExtraDisabled()"
      :title="titles[0]"
      :checked-label="left.checkedLabel.value"
      :has-footer="hasLeftFooter"
      :has-no-match="leftHasNoMatch"
      :filterable="filterable"
      :placeholder="placeholder"
      :panel-width="panelWidth"
      :panel-body-height="panelBodyHeight"
      :check-all="checkAll"
      @check="left.onCheckChange"
      @check-all="left.checkAllChange"
      @filter="left.filter"
      @query-change="(v: string) => (left.state.query = v)"
      @checks-change="(v) => (left.state.checks = v)"
    >
      <template #footer><slot name="left-footer" /></template>
    </Panel>

    <!-- 中间按钮 -->
    <div class="transfer__buttons">
      <el-button class="transfer__button" :disabled="!left.state.checks.length" :icon="ArrowRight" type="primary" @click="addFromLeft" />
      <el-button class="transfer__button" :disabled="!right.state.checks.length" :icon="ArrowLeft" @click="addFromRight" />
    </div>

    <!-- 右面板 -->
    <Panel
      ref="rightPanelComp"
      :panel="right.state"
      :is-tree="isRightTree"
      :props-alias="propsAlias"
      :extra-disabled="right.getExtraDisabled()"
      :title="titles[1]"
      :checked-label="right.checkedLabel.value"
      :has-footer="hasRightFooter"
      :has-no-match="rightHasNoMatch"
      :filterable="filterable"
      :placeholder="placeholder"
      :panel-width="panelWidth"
      :panel-body-height="panelBodyHeight"
      :check-all="checkAll"
      @check="right.onCheckChange"
      @check-all="right.checkAllChange"
      @filter="right.filter"
      @query-change="(v: string) => (right.state.query = v)"
      @checks-change="(v) => (right.state.checks = v)"
    >
      <template #footer><slot name="right-footer" /></template>
    </Panel>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, useSlots, onMounted } from 'vue';
import type { PropType } from 'vue';
import { ArrowRight, ArrowLeft } from '@element-plus/icons-vue';
import { tree2LeafArray, type TreeNode } from '@/utils/treeUtil';
import Panel from './components/Panel.vue';
import { useTransfer } from './hooks/useTransfer';
import type { FieldAlias } from './hooks/usePanel';

/* ===================== Props 定义 ===================== */
/** 数据字段别名 */
export interface TransferFieldAlias {
  label: string;
  key: string;
  disabled: string | ((data: any, node?: any) => boolean);
  children?: string;
}

/** 右侧列表排序策略 */
export type TargetOrder = 'original' | 'push' | 'unshift';

const props = defineProps({
  /** 选中项（右侧数据）绑定值，支持 v-model */
  modelValue: { type: Array as PropType<TreeNode[]>, default: () => [] },
  /** 数据源（左侧候选数据，列表或树） */
  data: { type: Array as PropType<any[]>, default: () => [] },
  /** 是否可搜索 */
  filterable: { type: Boolean, default: true },
  /** 搜索框占位符 */
  filterPlaceholder: { type: String, default: '' },
  /** 自定义搜索方法 */
  filterMethod: { type: Function as PropType<((query: string, item: any) => boolean) | null>, default: null },
  /** 右侧列表排序策略 */
  targetOrder: {
    type: String as PropType<TargetOrder>,
    default: 'original',
    validator: (val: TargetOrder) => ['original', 'push', 'unshift'].includes(val)
  },
  /** 自定义列表标题 [左, 右] */
  titles: { type: Array as PropType<string[]>, default: () => ['List 1', 'List 2'] },
  /** 数据源字段别名 */
  propsAlias: {
    type: Object as PropType<Partial<TransferFieldAlias>>,
    default: () => ({ label: 'label', key: 'key', disabled: 'disabled', children: 'children' })
  },
  /** 初始状态下左侧已勾选 key 数组 */
  leftDefaultChecked: { type: Array as PropType<(string | number)[]>, default: () => [] },
  /** 初始状态下右侧已勾选 key 数组 */
  rightDefaultChecked: { type: Array as PropType<(string | number)[]>, default: () => [] },
  /** 面板宽度 */
  panelWidth: { type: [String, Number], default: 200 },
  /** 面板列表区高度 */
  panelBodyHeight: { type: [String, Number], default: 278 },
  /** 是否显示全选 */
  checkAll: { type: Boolean, default: true },
  /** 左侧是否为树 */
  isLeftTree: { type: Boolean, default: false },
  /** 右侧是否为树 */
  isRightTree: { type: Boolean, default: false },
  /** 最多可选择的叶子节点数量（仅树形左侧生效） */
  limit: { type: Number, default: 1000 }
});

const emit = defineEmits(['change', 'left-check-change', 'right-check-change', 'update:modelValue']);
const slots = useSlots();

/* ===================== 字段别名合并 ===================== */
const propsAlias = computed<FieldAlias>(() => ({
  label: 'label',
  key: 'key',
  disabled: 'disabled',
  children: 'children',
  ...props.propsAlias
}));

/* ===================== 样式 computed ===================== */
const placeholder = computed(() => props.filterPlaceholder || '请输入关键词搜索');
const panelWidth = computed(() => (typeof props.panelWidth === 'number' ? `${props.panelWidth}px` : props.panelWidth));
const panelBodyHeight = computed(() => (typeof props.panelBodyHeight === 'number' ? `${props.panelBodyHeight}px` : props.panelBodyHeight));
const hasLeftFooter = computed(() => !!slots['left-footer']);
const hasRightFooter = computed(() => !!slots['right-footer']);
const leftHasNoMatch = computed(() => !!left.state.query && !left.state.filterData.length);
const rightHasNoMatch = computed(() => !!right.state.query && !right.state.filterData.length);

/* ===================== 穿梭核心逻辑 ===================== */
const sourceData = computed(() => props.data);

const emitModelValue = () => {
  emit('update:modelValue', props.isRightTree ? tree2LeafArray(right.state.data) : right.state.data);
};

const emitChange = (current: any[], direction: 'left' | 'right', movedKeys: (string | number)[]) => {
  emit('change', current, direction, movedKeys);
};

const { left, right, syncLeftData, syncRightData, addFromLeft, addFromRight, clearQuery } = useTransfer({
  propsAlias: propsAlias.value,
  isLeftTree: props.isLeftTree,
  isRightTree: props.isRightTree,
  targetOrder: props.targetOrder,
  limit: props.limit,
  filterMethod: props.filterMethod,
  sourceData: () => sourceData.value,
  modelValue: () => props.modelValue,
  emitChange,
  emitModelValue
});

/* ===================== Panel 组件实例引用 ===================== */
const leftPanelComp = ref<InstanceType<typeof Panel>>();
const rightPanelComp = ref<InstanceType<typeof Panel>>();

/** 将 Panel 内部的 TransferTree 实例绑定到 usePanel 的 treeRef */
const bindTreeRefs = () => {
  const leftTree = (leftPanelComp.value as any)?.getTreeComp?.();
  const rightTree = (rightPanelComp.value as any)?.getTreeComp?.();
  if (leftTree) left.bindTreeComp(leftTree);
  if (rightTree) right.bindTreeComp(rightTree);
};

onMounted(bindTreeRefs);

/* ===================== Watcher ===================== */
// 数据源变化 → 重建左右面板数据
watch(
  () => sourceData.value,
  () => syncLeftData(),
  { deep: true, immediate: true }
);

// v-model 变化 → 同步右侧已选
watch(
  () => props.modelValue,
  () => syncRightData(),
  { immediate: true }
);

// 默认勾选
watch(
  () => props.leftDefaultChecked,
  (v) => (left.state.checks = v),
  { immediate: true, deep: true }
);
watch(
  () => props.rightDefaultChecked,
  (v) => (right.state.checks = v),
  { immediate: true, deep: true }
);

// 勾选事件透传
watch(
  () => left.state.checks,
  (v) => emit('left-check-change', v)
);
watch(
  () => right.state.checks,
  (v) => emit('right-check-change', v)
);

defineExpose({ clearQuery });
</script>

<style lang="scss" scoped>
.transfer {
  text-align: center;
  .transfer__buttons {
    display: inline-block;
    vertical-align: middle;
    padding: 0 30px;
    .transfer__button {
      display: block;
      margin: 0;
      padding: 0 4px;
      min-width: 32px;
      box-sizing: border-box;
    }

    .transfer__button:not(:last-child) {
      margin-bottom: 20px;
    }
  }
}
</style>
