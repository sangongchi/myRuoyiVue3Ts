<template>
  <div class="transfer-panel" :style="{ width: panelWidth }">
    <!-- 头部：标题 + 全选 + 计数 -->
    <div class="transfer-panel__header">
      <template v-if="checkAll">
        <el-checkbox :model-value="panel.checkAll" :indeterminate="panel.isIndeterminate" @change="onCheckAll" />
        <span>{{ checkedLabel }}</span>
      </template>
      <div v-else>{{ title }}</div>
    </div>

    <!-- body：搜索框 + 内容区 -->
    <div class="transfer-panel__body" :style="{ height: panelBodyHeight }">
      <el-input
        v-if="filterable"
        class="transfer-panel__filter"
        :model-value="panel.query"
        :placeholder="placeholder"
        :prefix-icon="Search"
        clearable
        @clear="emit('filter')"
        @update:model-value="(v: string) => emit('query-change', v)"
        @input="emit('filter')"
      />

      <div :class="['transfer-panel__list', { 'is-filterable': filterable }]">
        <!-- 树形内容区 -->
        <TransferTree
          v-if="isTree"
          ref="treeComp"
          :data="panel.filterData"
          :props-alias="propsAlias"
          :extra-disabled="extraDisabled"
          @check="emit('check')"
        />
        <!-- 列表内容区 -->
        <TransferList
          v-else
          :data="panel.filterData"
          :checks="panel.checks"
          :panel-id="panel.id"
          :props-alias="propsAlias"
          @update:checks="(v) => emit('checks-change', v)"
          @check="emit('check')"
        />

        <p v-show="hasNoMatch || !panel.filterData.length" class="transfer-panel__empty">
          {{ hasNoMatch ? '无匹配数据' : '暂无数据' }}
        </p>
      </div>
    </div>

    <!-- footer 插槽 -->
    <div v-if="hasFooter" class="transfer-panel__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import TransferTree from './TransferTree.vue';
import TransferList from './TransferList.vue';
import type { PanelState, FieldAlias } from '../hooks/usePanel';

interface Props {
  panel: PanelState;
  isTree: boolean;
  propsAlias: FieldAlias;
  title: string;
  checkedLabel: string;
  hasFooter: boolean;
  hasNoMatch: boolean;
  filterable: boolean;
  placeholder: string;
  panelWidth: string | number;
  panelBodyHeight: string | number;
  checkAll: boolean;
  /** 额外的 disabled 判断（如 limit 机制），会与 propsAlias.disabled 串联 */
  extraDisabled?: ((item: any, node?: any) => boolean) | null;
}

withDefaults(defineProps<Props>(), { extraDisabled: null });
const emit = defineEmits(['check', 'check-all', 'filter', 'query-change', 'checks-change']);

const treeComp = ref<InstanceType<typeof TransferTree>>();

const onCheckAll = (value: any) => emit('check-all', Boolean(value));

/** 暴露 tree 组件实例，供父组件调用 getCheckedKeys / setCheckedKeys */
defineExpose({
  getTreeComp: () => treeComp.value
});
</script>

<style lang="scss" scoped>
$height: 26px;
$margin: 12px;
.transfer-panel {
  display: inline-block;
  position: relative;
  vertical-align: middle;
  max-height: 100%;
  overflow: hidden;
  text-align: left;
  box-sizing: border-box;
  background: var(--el-bg-color-overlay);
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.transfer-panel__header {
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
  background: #f5f7fa;
  margin: 0;
  padding-left: $margin;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  box-sizing: border-box;
  color: var(--el-color-black);
  border-bottom: 1px solid #ebeef5;
}

.transfer-panel__header span {
  position: absolute;
  right: $margin;
  top: 50%;
  transform: translate3d(0, -50%, 0);
  color: #909399;
  font-size: 12px;
  font-weight: 400;
}

.transfer-panel__body {
  overflow: hidden;
}

.transfer-panel__filter {
  text-align: center;
  margin: $margin;
  height: $height;
  box-sizing: border-box;
  width: calc(100% - 2 * $margin);
}

.transfer-panel__list {
  position: relative;
  margin: 0;
  padding: 6px 0;
  list-style: none;
  height: 278px;
  overflow: auto;
  box-sizing: border-box;
}

.transfer-panel__list.is-filterable {
  height: calc(100% - $height - $margin * 2);
}

.transfer-panel__list .el-checkbox-group {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  box-sizing: border-box;
}

.transfer-panel__item {
  position: relative;
  margin-right: 0;
  padding-right: $margin;
  padding-left: $margin;
  height: $height;
  line-height: $height;
}

.transfer-panel__item:hover {
  background-color: var(--el-fill-color-light);
}

.transfer-panel__empty {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%);
  margin: 0;
  height: var(--el-transfer-item-height);
  line-height: var(--el-transfer-item-height);
  padding: 6px 15px 0;
  color: var(--el-text-color-secondary);
  text-align: center;
  white-space: nowrap;
  font-size: 13px;
}

.transfer-panel__footer {
  min-height: 32px;
  border-top: 1px solid #ebeef5;
}
</style>
