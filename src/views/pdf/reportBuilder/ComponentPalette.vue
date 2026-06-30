<template>
  <div class="palette">
    <div class="palette-header">组件库</div>
    <div class="palette-grid">
      <div
        v-for="item in PALETTE"
        :key="item.type"
        class="palette-item"
        draggable="true"
        @dragstart="onDragStart($event, item.type)"
        @dragend="onDragEnd"
      >
        <div v-html="item.icon"></div>
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CompType } from '../types'
import { PALETTE } from '../utils'
import { useReportBuilderStore } from '../store'

const store = useReportBuilderStore()

function onDragStart(evt: DragEvent, type: CompType) {
  store.setDragging(true)
  evt.dataTransfer!.effectAllowed = 'copy'
  evt.dataTransfer!.setData('text/plain', type)
}

function onDragEnd() {
  store.setDragging(false)
}
</script>

<style scoped>
.palette {
  width: 230px;
  background: var(--bg-sec);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.palette-header {
  padding: 14px 16px;
  font-weight: 600;
  font-size: 12px;
  color: var(--txt-sec);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}
.palette-grid {
  padding: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  overflow-y: auto;
  flex: 1;
}
.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border-radius: var(--r-md);
  background: var(--bg-pri);
  border: 1px solid var(--border);
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}
.palette-item:hover {
  border-color: var(--accent);
  background: var(--accent-lt);
  transform: translateY(-1px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.palette-item:active {
  cursor: grabbing;
  transform: scale(0.97);
}
.palette-item svg {
  width: 22px;
  height: 22px;
  color: var(--accent);
}
.palette-item span {
  font-size: 11px;
  font-weight: 500;
  color: var(--txt-sec);
}
</style>
