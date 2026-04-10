<template>
  <div class="slice-view-container">
    <div class="operate-con">
      <div class="mode-con">
        设置模式
        <el-radio-group v-model="state.doodleOptions.mode" @change="setMode">
          <el-radio :value="key" v-for="(val, key) in modeOptions" :key="val">{{ val }}</el-radio>
        </el-radio-group>
      </div>
      <el-color-picker v-model="state.doodleOptions.brushColor" @change="setBrushColor" />
      <el-button @click="clear">清空标注</el-button>
      <el-button @click="deleteCurShape">删除当前</el-button>
      <el-button @click="screenShot">截图</el-button>
    </div>

    <div id="openseadragonContainer" style="width: 100vw; height: 100vh"></div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, nextTick, reactive, markRaw } from 'vue'
import OpenSeadragon from 'openseadragon'
// import screenshot from "openseadragon-screenshot"
import { createDoodle } from '@wtsml/doodle'
import sliceData from './data.json'

const viewer = ref<any>(null)
const containerInfo = reactive({
  width: 1,
  height: 1
})
const modeOptions = {
  move: '移动',
  rect: '矩形',
  circle: '圆形',
  line: '线条',
  closed_path: ' 闭合路径',
  path: '路径',
  text: '文本'
}
const state = reactive({
  doodle: {} as any, // 用于存储涂鸦实例
  doodleOptions: {
    mode: 'move', // 当前模式
    brushColor: 'red' // 画笔颜色
  },
  curShape: null // 当前选中的形状
})
onMounted(async () => {
  await nextTick()
  const openseadragonCon = document.getElementById('openseadragonContainer')
  containerInfo.width = openseadragonCon?.offsetWidth || 0
  containerInfo.height = openseadragonCon?.offsetHeight || 0
  initSeadragon()
  initDoodle()
})

// 初始化画布
function initSeadragon() {
  try {
    viewer.value = OpenSeadragon({
      id: 'openseadragonContainer',
      constrainDuringPan: true, //限制拖动时的边界

      visibilityRatio: 0.2, // 至少 20% 显示在可视区域内
      tileSources: {
        //配置资源
        Image: {
          xmlns: 'http://schemas.microsoft.com/deepzoom/2008', // 指令集(命名空间)
          Url: sliceData.url, // 瓦片图加载路径
          Format: sliceData.format, // 瓦片图格式（文件后缀）
          Overlap: sliceData.overlap, // 瓦片图间重叠像素数
          TileSize: sliceData.tileSize, // 切片的边长
          //  实际图像（大图）尺寸
          Size: {
            Width: sliceData.size.width, // 原始图片宽度
            Height: sliceData.size.height // 原始图片高度
          }
        }
      },
      showNavigationControl: true, // 是否显示导航控件
      navigationControlAnchor: 'BOTTOM_LEFT', // 导航栏控件组件的位置，参数可选为 NONE, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, ABSOLUTE, 默认参数为 TOP_LEFT.
      autoHideControls: false, // 是否自动隐藏控件
      showZoomControl: true, // 是否显示缩放控件
      showHomeControl: false, //初始化图像大小控件的显示与隐藏
      showFullPageControl: true, // 全屏控件的显示与隐藏，参数为布尔类型，默认值为 true
      showRotationControl: false, // 左旋和右旋控件的显示与隐藏，参数为布尔类型，默认值为 false.
      showFlipControl: false, // 翻转控件的显示与隐藏，参数为布尔类型，默认值为 false.
      showSequenceControl: false, // 上一张和下一张组件的显示与隐藏，参数为布尔类型，默认值为 false, 当设置 sequenceMode 为 true 时 默认值为 true.

      showNavigator: true, // 是否显示导航窗口
      // 以下都是导航配置
      navigatorAutoFade: false,
      // navigatorPosition: "ABSOLUTE",
      navigatorTop: 0,
      navigatorHeight: '90px',
      navigatorWidth: '200px',
      navigatorBackground: '#fefefe',
      navigatorBorderColor: 'transparent',
      navigatorDisplayRegionColor: '#FF0000',

      panHorizontal: true, //是否允许水平拖动
      defaultZoomLevel: 1, // 初始化默认放大倍数，按home键也返回该层
      minZoomLevel: 0.5, // 最小缩放倍数
      maxZoomLevel: 40, // 最大允许放大倍数
      // 禁用所有鼠标相关事件
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: false,
        pinchToZoom: true,
        scrollToZoom: true
      },

      // 禁用所有触摸相关事件
      gestureSettingsTouch: {
        clickToZoom: false,
        dblClickToZoom: false,
        pinchToZoom: true
      },
      zoomInButton: 'zoom-in',
      zoomOutButton: 'zoom-out',
      crossOriginPolicy: 'Anonymous'
    })

    // 监听缩放事件
    viewer.value.addHandler('zoom', function () {
      // 更新scale
      const zoom = viewer.value.viewport.getZoom()
      console.log('当前缩放倍数:', zoom)
    })

    // 监听移动的移动
    viewer.value.addHandler('pan', function () {
      // 更新scale
      viewer.value.viewport.getCenter()
    })

    viewer.value.addHandler('open', function () {
      const targetImg = viewer.value.world.getItemAt(0)
      console.log('targetImg', targetImg.getContentSize())
    })
  } catch (e) {
    console.warn('错误捕获', e)
  }
}
// 创建涂鸦实例
function initDoodle() {
  const doodle = createDoodle({
    container: document.getElementById('openseadragonContainer') as HTMLElement,
    width: containerInfo.width,
    height: containerInfo.height,
    viewer: viewer.value,
    onAdd: (shape: any) => {
      console.log('add')
      doodle.addShape(shape)
      console.log('getScale', doodle.getScale())
      console.log('shapes', doodle.getShapes())
    },
    onRemove: (shape: any) => {
      console.log('move')
      doodle.removeShape(shape)
    },
    onUpdate: (shape: any) => {
      console.log('update')
      doodle.updateShape(shape)
      console.log('getScale', doodle.getScale())
    },
    onSelect: (shape: any) => {
      console.log('select')
      state.curShape = shape
    }
  })

  // 添加一些示例图形
  doodle.addShape({
    id: 'uLi2gbqSx6sX2a40GiYzr',
    type: 'rect',
    pos: [1428, 2067, 1384, 969],
    color: '#0000ff'
  })

  state.doodle = markRaw(doodle)
}

// 清空标注
const clear = () => {
  state.doodle.clear()
}
// 销毁
// const destroy = () => {
//   if (!state.doodle) return
//   state.doodle.destroy()
//   state.doodle = null
// }

function deleteCurShape() {
  if (!state.curShape) return
  state.doodle.removeShape(state.curShape)
  state.curShape = null
}

// 设置模式
const setMode = (mode: string) => {
  state.doodleOptions.mode = mode
  state.doodle.setMode(mode)
}
// 设置画笔颜色
const setBrushColor = (color: string) => {
  state.doodleOptions.brushColor = color
  state.doodle.setBrushColor(color)
}

function screenShot() {}

// 随机生成1000个点标注
const random10000Rects = async () => {
  // const rects = randomRects(state.viewer, 1000)
  // state.doodle.addShapes(rects)
}
</script>
<style lang="scss" scoped>
.slice-view-container {
  .operate-con {
    position: absolute;
    z-index: 1;
  }
}
</style>
