<template>
  <el-checkbox-group :model-value="checks" :id="panelId" @change="onCheck">
    <el-checkbox
      class="transfer-panel__item"
      v-for="(item, index) in data"
      :key="item[propsAlias.key] || `${item[propsAlias.label]}${index}`"
      :value="item[propsAlias.key]"
      :disabled="resolveDisabled(item)"
    >
      {{ item[propsAlias.label] }}
    </el-checkbox>
  </el-checkbox-group>
</template>

<script setup lang="ts">
import type { FieldAlias } from '../hooks/usePanel';

interface Props {
  /** 已过滤后的列表数据 */
  data: any[];
  /** 勾选的 key 数组（v-model） */
  checks: (string | number)[];
  /** 面板 id */
  panelId: string;
  /** 字段别名 */
  propsAlias: FieldAlias;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:checks', 'check']);

const onCheck = (value: any) => {
  emit('update:checks', value);
  emit('check');
};

const resolveDisabled = (item: any): boolean => {
  const d = props.propsAlias.disabled;
  if (typeof d === 'function') return d(item);
  return !!item[d as string];
};
</script>
