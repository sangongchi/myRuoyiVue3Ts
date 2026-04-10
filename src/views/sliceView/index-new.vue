<template>
  <div class="slice-view-container">
    <div class="add-mask">
      <el-button @click="startMask">新增标注</el-button>
      <el-button @click="cancelMask">禁用标注</el-button>
      <el-button @click="toRuler">测量标尺</el-button>
    </div>

    <div id="openseadragonContainer" style="width: 100vw; height: 100vh"></div>
    <div class="scalebar-container">
      <div class="name">
        <div>p:{{ p }}</div>
        physicalPxWidth:{{ physicalPxWidth }} oneμmPx:{{ oneμmPx }} zoom:{{ orginImg.zoom }} isCanMask:{{
          isCanMask
        }}
        isAddFabric：{{ isAddFabric }}
      </div>
    </div>
    <RatioBar v-model="orginImg.zoom" @zoomChange="zoomChange" @toOriginSize="toOriginSize" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, nextTick, reactive } from 'vue'
import OpenSeadragon from 'openseadragon'
import RatioBar from './ratio-bar.vue'
import { initOSDFabricJS } from 'openseadragon-fabric'
import * as fabric from 'fabric'
// import { fabric } from "@adamjarling/openseadragon-fabricjs-overlay"
import { throttle } from 'radash'

import NP from 'number-precision'
import sliceData from './data.json'

const SINGLE_RULE_LEN = 30 // 单个刻度的多少px
const isAddFabric = ref<boolean>(false)

const viewer = ref<any>(null)
let fabricOverlay: any = null
const isCanMask = ref<boolean>(false) // 是否禁用看图的一些操作
const unit = ref<'nm' | 'μm' | 'mm'>('μm') // 默认单位
const curEditShape = ref<any>(null) // 当前编辑的图形
// 1mm = 1000μm  毫米=微米
// 1μm = 1000nm  微米=纳米

let orginImg = reactive({
  width: 0, // 图片像素宽度
  mppX: 0, // 图片像素宽度对应的物理像素宽度
  height: 0, // 图片像素高度
  mppY: 0, // 图片像素高度对应的物理像素高度
  zoom: 1 // 当前缩放倍数
})
const containerInfo = reactive({
  width: 1,
  height: 1
})
const oneμmPx = ref<number>(0) // 得到1μm 等于多少px
const fabricStyle = reactive({
  strokeColor: 'red',
  strokeWeight: 5,
  fillColor: 'transparent',
  shap: 'react'
})
let fabricTextInfo: any = null

// 计算1px 等于多少μm 或者mm
const physicalPxWidth = computed(() => {
  const μmRes = NP.round(NP.times(NP.divide(orginImg.width, containerInfo.width, orginImg.zoom), orginImg.mppX), 6)
  oneμmPx.value = NP.divide(1, μmRes)
  // 判断如果当前每个刻度尺中间的微米值大于两百这转换为毫米mm
  // if (NP.times(μmRes, SINGLE_RULE_LEN) > 50) {
  //   unit.value = "mm"
  //   return NP.divide(μmRes, 1000)
  // }
  // unit.value = "μm"
  return μmRes
})

// 计算物理像素宽度
const p = computed(() => {
  console.log('orginImg', orginImg)
  return NP.round(NP.divide(orginImg.width, containerInfo.width, orginImg.zoom), 0)
})

onMounted(async () => {
  await nextTick()
  const openseadragonCon = document.getElementById('openseadragonContainer')
  containerInfo.width = openseadragonCon?.offsetWidth || 0
  containerInfo.height = openseadragonCon?.offsetHeight || 0
  orginImg.width = Number(sliceData.size.width)
  orginImg.mppX = Number(sliceData.size.mppX)
  orginImg.height = Number(sliceData.size.height)
  orginImg.mppY = Number(sliceData.size.mppY)
  const { width, mppX, height, mppY } = sliceData.size
  console.log('width', width, 'mppX', mppX, 'height', height, 'mppY', mppY)
  init()
})

// 初始化 fabric 插件 、绘图层
function initFabric() {
  initOSDFabricJS()
  fabricOverlay = viewer.value.fabricOverlay({
    fabricCanvasOptions: {
      selection: true // 启用对象选择
    }
  })
}

function init() {
  try {
    viewer.value = OpenSeadragon({
      id: 'openseadragonContainer',
      constrainDuringPan: true, //限制拖动时的边界
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      showRotationControl: false,
      visibilityRatio: 0.2, // 至少 20% 显示在可视区域内
      tileSources: {
        //配置资源
        Image: {
          xmlns: 'http://schemas.microsoft.com/deepzoom/2008', // 指令集
          Url: sliceData.url,
          Format: sliceData.format,
          Overlap: sliceData.overlap, // 相邻图片是否重叠像素值
          TileSize: sliceData.tileSize, // 切片的边长
          Size: {
            Width: sliceData.size.width, // 原始图片宽度
            Height: sliceData.size.height // 原始图片高度
          }
        }
      },

      // 是否显示导航窗口
      showNavigator: true,
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
      zoomOutButton: 'zoom-out'
    })
    initFabric()

    // 监听缩放事件
    viewer.value.addHandler('zoom', () => {
      // 更新scale
      const zoom = viewer.value.viewport.getZoom()
      orginImg.zoom = NP.round(zoom, 3)
      const activeObj = fabricOverlay.fabricCanvas().getActiveObject()
      console.log('activeObj', activeObj)
      udpateSizeInfo({ target: activeObj })
    })

    // 监听移动的移动
    viewer.value.addHandler('pan', function () {
      // 更新scale
      viewer.value.viewport.getCenter()
    })

    viewer.value.addHandler('open', function () {
      const targetImg = viewer.value.world.getItemAt(0)
      if (targetImg) {
        orginImg.zoom = viewer.value.viewport.getZoom()
      }
      console.log('targetImg', targetImg.getContentSize())
    })
  } catch (e) {
    console.warn('错误捕获', e)
  }
}

// 修改缩放比例
function zoomChange(val: number) {
  viewer.value.viewport.zoomTo(val)
}
// 1px 等于1微米的情况进行比例的缩放
function toOriginSize() {
  const targetZoom = NP.round(NP.times(NP.divide(orginImg.width, containerInfo.width), orginImg.mppX), 2)
  zoomChange(targetZoom)
}
const drawRect = (
  width: number,
  height: number,
  top: number,
  left: number,
  extrParms = { hasControls: true, lockRotation: true, selectable: true } // selectable: true, hasControls: true, hasRotatingPoint: true, lockRotation: false
) => {
  const rect = new fabric.Rect({
    width,
    height,
    top,
    left,
    stroke: fabricStyle.strokeColor,
    fill: fabricStyle.fillColor,
    strokeWidth: fabricStyle.strokeWeight,
    objectCaching: true, // optional but helps during drawing
    ...extrParms
  })
  rect.on('selected', function (react) {
    console.log('选中当前元素', react)
    curEditShape.value = react
    maskControl(true)
    udpateSizeInfo(react)
  })
  rect.on('deselected', function () {
    console.log('取消选中当前元素', rect)
  })

  rect.on('scaling', function () {
    console.log('元素缩放', rect)
  })
  rect.on('modified', react => {
    udpateSizeInfo(react)
    // 添加尺寸信息文本
  })
  fabricOverlay.fabricCanvas().add(rect)
  return rect
}
// Toggle fabric canvas draw
const maskControl = (flag: boolean) => {
  isCanMask.value = flag
  viewer.value.setMouseNavEnabled(!flag)
  fabricOverlay.fabricCanvas().selection = flag

  // fabricOverlay.fabricCanvas().isDrawingMode = flag // 设置是否绘图
}

// 新增标注
function startMask() {
  let rect: any, isDrawing: boolean, origX: number, origY: number
  isAddFabric.value = true
  maskControl(true)
  // 鼠标按下
  fabricOverlay.fabricCanvas().on('mouse:down', function (event: any) {
    // 判断是不是绘制的图层元素，如果是的话走入编辑外框图层
    console.log('down 操作', event.target, isRealValue(event.target))
    if (isRealValue(event.target)) {
      curEditShape.value = event.target
      console.log('当前元素是绘制的图层元素')
      maskControl(true)
      return
    }
    isDrawing = true
    let pointer = fabricOverlay.fabricCanvas().getPointer(event.e)
    origX = pointer.x
    origY = pointer.y
    rect = null
    rect = drawRect(pointer.x - origX, pointer.y - origY, origY, origX)

    let activeGroup = fabricOverlay.fabricCanvas().getActiveObjects()
    console.log('activeGroup: ', activeGroup)
    if (activeGroup.length > 0) {
      fabricOverlay.fabricCanvas().discardActiveObject()
      fabricOverlay.fabricCanvas().setActiveObject(activeGroup[activeGroup.length - 1])
    }
  })
  // 鼠标移动
  fabricOverlay.fabricCanvas().on(
    'mouse:move',
    throttle({ interval: 50 }, (event: any) => {
      // 判断非画图过程，悬浮在当前元素的过程中则，禁止背景移动
      if (!isAddFabric.value) {
        if (isRealValue(event.target)) {
          maskControl(true)
        } else {
          maskControl(false)
        }
        return
      }
      if (!rect || (!isDrawing && !curEditShape.value)) return
      let pointer = fabricOverlay.fabricCanvas().getPointer(event.e)

      const width = pointer.x - origX
      const height = pointer.y - origY
      rect.set({
        left: Math.min(origX, pointer.x),
        top: Math.min(origY, pointer.y),
        width: Math.abs(width),
        height: Math.abs(height)
      })
      fabricOverlay.fabricCanvas().renderAll()
    })
  )
  function isRealValue(obj: any) {
    return obj && obj !== 'null' && obj !== 'undefined'
  }
  //鼠标抬起
  fabricOverlay.fabricCanvas().on('mouse:up', function (event: any) {
    console.log('鼠标up')
    isAddFabric.value = false
    curEditShape.value = null
    maskControl(false)
    isDrawing = false
    fabricOverlay.fabricCanvas().off('mouse:down')
    fabricOverlay.fabricCanvas().renderAll()

    const activeGroup = fabricOverlay.fabricCanvas().getActiveObject()
    if (!activeGroup || activeGroup.width < 5 || activeGroup.height < 5) {
      console.warn('标注的宽度或者高度小于2px，删除该标注')
      fabricOverlay.fabricCanvas().remove(activeGroup)
    }
  })
}
function cancelMask() {
  isAddFabric.value = false
  curEditShape.value = null
  fabricOverlay.fabricCanvas().discardActiveObject()
  curEditShape.value = null

  fabricOverlay.fabricCanvas().remove(fabricTextInfo)

  maskControl(false)
  fabricOverlay.fabricCanvas().off('mouse:down')
  fabricOverlay.fabricCanvas().off('mouse:move')
  fabricOverlay.fabricCanvas().off('mouse:up')
}

// 测量标尺
function toRuler() {
  let isDrawing: boolean = false
  isAddFabric.value = true
  maskControl(true)
  let line: any = null
  let text: any = null
  let startX = 0
  let startY = 0

  fabricOverlay.fabricCanvas().on('mouse:down', (event: any) => {
    if (event.target) return

    const pointer = fabricOverlay.fabricCanvas().getPointer(event.e)
    isDrawing = true
    startX = pointer.x
    startY = pointer.y
    line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: '#3498db',
      strokeWidth: 20 / orginImg.zoom,
      selectable: false
    })

    text = new fabric.FabricText('标尺', {
      fontSize: 20 * p.value,
      fill: '#000',
      originX: 'center', // 中心旋转
      originY: 'center', // 中心旋转
      selectable: false
    })
    fabricOverlay.fabricCanvas().add(line, text)
  })

  fabricOverlay.fabricCanvas().on('mouse:move', (event: any) => {
    if (!isDrawing || !line) return
    const pointer = fabricOverlay.fabricCanvas().getPointer(event.e)
    const deltaX = pointer.x
    const deltaY = pointer.y

    line.set({ x2: deltaX, y2: deltaY })
    const angle = (Math.atan2(pointer.y - startY, pointer.x - startX) * 180) / Math.PI
    // 计算线条长度
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (length > 0) {
      text.set({
        text: NP.round(Math.sqrt((deltaX - startX) ** 2 + (deltaY - startY) ** 2), 0) + 'μm',
        left: (deltaX - startX) / 2 + startX,
        top: (deltaY - startY) / 2 + startY,
        angle: angle
      })
    } else {
      // 长度为0时，放在起点上方30像素处（垂直向上）
      text.set({
        left: 0,
        top: -30,
        angle: 0
      })
    }
    fabricOverlay.fabricCanvas().requestRenderAll()
  })

  fabricOverlay.fabricCanvas().on('mouse:up', () => {
    isAddFabric.value = false
    if (!isDrawing || !line) return
    isDrawing = false
    fabricOverlay.fabricCanvas().remove(line, text)
    line = null
    text = null
    maskControl(false)
  })
}

function udpateSizeInfo(react: any) {
  if (!react || !react.target) return
  const target = react.target
  console.log('元素变化', target)
  // 更新当前元素的宽度和高度
  // target.set({
  //   width: NP.round(target.width * target.scaleX, 2),
  //   height: NP.round(target.height * target.scaleY, 2),
  //   scaleX: 1,
  //   scaleY: 1,
  // })
  if (fabricTextInfo) {
    fabricOverlay.fabricCanvas().remove(fabricTextInfo)
  }
  const rect = new fabric.Rect({
    width: NP.times(160, p.value),
    height: NP.times(50, p.value),
    fill: '#eef',
    opacity: 0.7
  })
  const text = new fabric.FabricText(`长：${NP.round(target.width, 2)}μm \n宽：${NP.round(target.height, 2)}μm`, {
    // originX: "right",
    // originY: "bottom",
    fontSize: NP.times(18, p.value),
    fill: '#000'
  })
  // 创建一个包含圆形和文本的组合对象
  fabricTextInfo = new fabric.Group([rect, text], {
    left: target.left + target.width / 2,
    top: target.top + target.height,
    hasControls: false,
    selectable: false,
    hasBorders: false
  })
  fabricOverlay.fabricCanvas().add(fabricTextInfo)
  fabricOverlay.fabricCanvas().renderAll()
}
</script>
<style lang="scss" scoped>
.scalebar-container {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 5px;

  .name {
    color: blue;
  }
}

.add-mask {
  position: absolute;
  top: 20px;
  z-index: 99;
}
</style>
