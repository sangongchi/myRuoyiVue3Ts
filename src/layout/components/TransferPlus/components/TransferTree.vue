<template>
  <!-- {{ data }} -->
  <el-tree
    ref="treeRef"
    :data="data"
    :props="mergedProps"
    default-expand-all
    show-checkbox
    :node-key="propsAlias.key"
    empty-text=""
    @check="onCheck"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FieldAlias } from '../hooks/usePanel';

interface Props {
  /** 已过滤后的树数据 */
  data: any[];
  /** 字段别名 */
  propsAlias: FieldAlias;
  /**
   * 额外的 disabled 判定（如 limit 机制触发的禁用），与 propsAlias.disabled 串联。
   * 函数签名 (item, node?) => boolean
   */
  extraDisabled?: ((item: any, node?: any) => boolean) | null;
}

const props = withDefaults(defineProps<Props>(), { extraDisabled: null });
const emit = defineEmits(['check']);

const treeRef = ref();

const onCheck = () => emit('check');

/** el-tree 真正使用的 props：在 propsAlias.disabled 之上叠加 extraDisabled */
const mergedProps = computed<FieldAlias>(() => {
  const base = props.propsAlias;
  const extra = props.extraDisabled;
  if (!extra) return base;
  const origin = base.disabled;
  return {
    ...base,
    disabled: (data: any, node?: any) => {
      let baseDisabled = false;
      if (typeof origin === 'function') {
        try {
          baseDisabled = origin(data, node);
        } catch {
          baseDisabled = !!data?.disabled;
        }
      } else if (typeof origin === 'string') {
        baseDisabled = !!data?.[origin];
      }
      if (baseDisabled) return true;
      try {
        return extra(data, node);
      } catch {
        return false;
      }
    }
  };
});

/** 暴露给父组件：获取勾选的叶子 key */
const getCheckedKeys = (leafOnly: boolean = true) => treeRef.value?.getCheckedKeys(leafOnly) || [];

/** 暴露给父组件：设置勾选 key */
const setCheckedKeys = (keys: (string | number)[], leafOnly: boolean = false) => {
  treeRef.value?.setCheckedKeys(keys, leafOnly);
};

defineExpose({ getCheckedKeys, setCheckedKeys, treeRef });
</script>
