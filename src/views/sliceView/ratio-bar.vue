<template>
  <div class="ratio-bar-wrapper">
    <div class="ratio-bar">
      <el-slider
        vertical
        v-model="zoomLevel"
        :min="SLIDE_MIN"
        :max="SLIDE_MAX"
        @input="updateZoom"
        :show-tooltip="false"
      />
    </div>
    <span class="ratio-tooltip" :style="{ top: `${100 - zoomLevel}%` }">{{ zoom }}X</span>
    <el-button
      class="ratio-btn"
      style="top: -26px; left: 32px"
      size="small"
      type="primary"
      @click="scaleToOriginSize"
      >1:1</el-button
    >
    <el-button
      class="ratio-btn"
      @click="updateZoom(100)"
      style="top: -8px"
      size="small"
      type="primary"
      >40X</el-button
    >
    <el-button
      class="ratio-btn"
      @click="updateZoom(80)"
      style="top: 32px"
      size="small"
      type="primary"
      >20X</el-button
    >
    <el-button
      class="ratio-btn"
      @click="updateZoom(60)"
      style="top: 69px"
      size="small"
      type="primary"
      >10X</el-button
    >
    <el-button
      class="ratio-btn"
      @click="updateZoom(40)"
      style="top: 108px"
      size="small"
      type="primary"
      >4X</el-button
    >
    <el-button
      class="ratio-btn"
      @click="updateZoom(20)"
      style="top: 144px"
      size="small"
      type="primary"
      >2X</el-button
    >
    <el-button
      class="ratio-btn"
      @click="updateZoom(0)"
      style="top: 182px"
      size="small"
      type="primary"
      >Fit</el-button
    >
  </div>
</template>
<script lang="ts" setup>
  import { ref, computed, watchEffect } from "vue"
  import NP from "number-precision"

  const props = withDefaults(
    defineProps<{
      modelValue: number
    }>(),
    {
      modelValue: 0,
    }
  )
  const emit = defineEmits(["update:modelValue", "zoomChange", "toOriginSize"])

  const zoom = computed({
    get: () => props.modelValue,
    set: (val) => {
      emit("update:modelValue", val)
    },
  })
  const SLIDE_MAX = 100
  const SLIDE_MIN = 0
  const zoomLevel = ref<number>(0) // el-slider 的值

  // 根据ratiobar的值算出scale
  function getZoomScaleByZoomLevel(val: number) {
    if (val === 0) return 1
    if (val <= 20) {
      return ((val - 0) / 20) * (2 - 1) + 1
    } else if (val <= 40) {
      return ((val - 20) / 20) * (4 - 2) + 2
    } else if (val <= 60) {
      return ((val - 40) / 20) * (10 - 4) + 4
    } else if (val <= 80) {
      return ((val - 60) / 20) * (20 - 10) + 10
    } else if (val <= 100) {
      return ((val - 80) / 20) * (40 - 20) + 20
    }
    return 40
  }

  // 根据scale反算出ratio-bar的值
  function getZoomLevelByScale(scale: number) {
    if (scale <= 1) return 0
    if (scale <= 2) {
      return ((scale - 1) / (2 - 1)) * 20 + 0
    }
    if (scale <= 4) {
      return ((scale - 2) / (4 - 2)) * 20 + 20
    }
    if (scale <= 10) {
      return ((scale - 4) / (10 - 4)) * 20 + 40
    }
    if (scale <= 20) {
      return ((scale - 10) / (20 - 10)) * 20 + 60
    }
    if (scale <= 40) {
      return ((scale - 20) / (40 - 20)) * 20 + 80
    }
    return 100
  }

  // 更新缩放比例
  function updateZoom(val: number) {
    zoomLevel.value = val
    const zoomVal = NP.round(getZoomScaleByZoomLevel(val), 2)
    emit("zoomChange", zoomVal)
  }

  function scaleToOriginSize() {
    emit("toOriginSize")
  }

  watchEffect(() => {
    zoomLevel.value = getZoomLevelByScale(props.modelValue)
  })
</script>
<style lang="scss" scoped>
  .ratio-bar-wrapper {
    position: absolute;
    z-index: 999999999;
    bottom: 120px;
    left: 30px;
    width: 100px;
    height: 190px;
    .ratio-bar {
      display: flex;
      height: 200px;
      align-items: center;
      .el-slider {
        margin-top: -5px;
        margin-left: 12px;
        width: 100%;
        height: 98%;
      }
    }
    .ratio-tooltip {
      position: absolute;
      left: -20px;
      font-weight: bold;
      font-size: 10px;
      z-index: 99999999;
      text-align: right;
      color: blue;
    }
    .ratio-btn {
      position: absolute;
      left: 30px;
      width: 24px;
      font-size: 10px;
      font-weight: bold;
      height: 14px;
    }
  }
</style>
