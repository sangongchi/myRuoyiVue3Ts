<template>
  <div class="slice-view-container">
    <div class="add-mask">
      <el-button @click="startMask">新增标注</el-button>
      <el-button @click="controlOSD(true)">取消标注</el-button>
    </div>

    <div id="openseadragonContainer" style="width: 100vw; height: 100vh"></div>
    <div class="scalebar-container">
      <div class="name">
        oneμmPx:{{ oneμmPx }} physicalPxWidth:{{ physicalPxWidth }} physicalPxHeight:{{ physicalPxHeight }} zoom:{{
          orginImg.zoom
        }}
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
import { throttle } from 'radash'

import NP from 'number-precision'
import sliceData from './data.json'

const SINGLE_RULE_LEN = 30 // 单个刻度的多少px
const STEP = 5 // 刻度数量
const isAddFabric = ref<boolean>(false)

const viewer = ref<any>(null)
const fabricOverlay = ref<any>(null)
const unit = ref<'nm' | 'μm' | 'mm'>('μm') // 默认单位
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
const rule = reactive({
  signlePhysicalSize: 0.5,
  unit: 'mm'
})
const fabricStyle = reactive({
  strokeColor: 'red',
  strokeWeight: 5,
  fillColor: 'transparent',
  shap: 'react'
})

// 计算1px 等于多少μm 或者mm
const physicalPxWidth = computed(() => {
  const μmRes = NP.round(NP.times(NP.divide(orginImg.width, containerInfo.width, orginImg.zoom), orginImg.mppX), 6)
  oneμmPx.value = NP.divide(1, μmRes)
  // 判断如果当前每个刻度尺中间的微米值大于两百这转换为毫米mm
  if (NP.times(μmRes, SINGLE_RULE_LEN) > 50) {
    unit.value = 'mm'
    return NP.divide(μmRes, 1000)
  }
  unit.value = 'μm'
  return μmRes
})
const physicalPxHeight = computed(() => {
  return NP.round(NP.times(NP.divide(orginImg.height, containerInfo.height, orginImg.zoom), orginImg.mppY), 3)
})

// 根据 zoom 级别选择每个刻度表示多少实物的宽
function getRuleItemInfo() {
  if (orginImg.zoom <= 1) {
    rule.signlePhysicalSize = 0.5
    rule.unit = 'mm'
  } else if (orginImg.zoom <= 2) {
    rule.signlePhysicalSize = 0.25
    rule.unit = 'mm'
  } else if (orginImg.zoom <= 4) {
    rule.signlePhysicalSize = 120
    rule.unit = 'μm'
  } else if (orginImg.zoom <= 8) {
    rule.signlePhysicalSize = 80
    rule.unit = 'μm'
  } else if (orginImg.zoom <= 14) {
    rule.signlePhysicalSize = 40
    rule.unit = 'μm'
  } else if (orginImg.zoom <= 30) {
    rule.signlePhysicalSize = 20
    rule.unit = 'μm'
  } else if (orginImg.zoom > 30) {
    rule.signlePhysicalSize = 10
    rule.unit = 'μm'
  }
}

onMounted(async () => {
  console.log('sliceData', sliceData)
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
  fabricOverlay.value = viewer.value.fabricOverlay({
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
      navigatorPosition: 'ABSOLUTE',
      navigatorTop: 0,
      navigatorLeft: 0,
      navigatorHeight: '90px',
      navigatorWidth: '200px',
      navigatorBackground: '#fefefe',
      navigatorBorderColor: 'transparent',
      navigatorDisplayRegionColor: '#FF0000',

      panHorizontal: true, //是否允许水平拖动
      defaultZoomLevel: 2, // 初始化默认放大倍数，按home键也返回该层
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
      }
      // zoomInButton: "zoom-in",
      // zoomOutButton: "zoom-out",
    })
    initFabric()
    // 增加左下角比例尺
    initScalebarCtx1()
    initScalebarCtx2()

    // 监听缩放事件
    viewer.value.addHandler('zoom', function () {
      // 更新scale
      const zoom = viewer.value.viewport.getZoom()
      orginImg.zoom = NP.round(zoom, 3)
      updateScalebars()
      updateScalebars2()
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

// 初始化刻度
const ctx = ref<any>(null) // 刻度是固定的px，动态变化刻度对应标本宽度
const ctx2 = ref<any>(null) // 根据不同的zoom，动态变换刻度表示的标本宽度，从而推算出px
var rulerCanvas: any = null

function createCtx(bottom: number) {
  rulerCanvas = document.createElement('canvas')
  rulerCanvas.style.position = 'absolute'
  rulerCanvas.style.bottom = bottom + 'px'
  rulerCanvas.style.left = '10px'
  rulerCanvas.width = 300
  rulerCanvas.height = 50
  rulerCanvas.style.zIndex = '999'
  document.getElementById('openseadragonContainer')?.appendChild(rulerCanvas)
  return rulerCanvas.getContext('2d')
}
function initScalebarCtx1() {
  ctx.value = createCtx(4)
  updateScalebars()
}

function initScalebarCtx2() {
  ctx2.value = createCtx(65)
  updateScalebars2()
}

// 更新刻度(这部分逻辑)
function updateScalebars() {
  ctx.value.clearRect(0, 0, rulerCanvas.width || 0, rulerCanvas.height || 0)
  ctx.value.fillStyle = 'transparent'
  ctx.value.fillRect(0, 0, rulerCanvas.width || 0, rulerCanvas.height || 0)
  ctx.value.beginPath()
  ctx.value.lineWidth = 1
  ctx.value.strokeStyle = '#000'
  ctx.value.fillStyle = 'blue'
  for (let i = 1; i <= STEP + 1; i++) {
    ctx.value.moveTo(i * SINGLE_RULE_LEN, 20)
    ctx.value.lineTo(i * SINGLE_RULE_LEN, 30)
    const iTxt = NP.round(NP.times(NP.minus(i, 1), SINGLE_RULE_LEN, physicalPxWidth.value), 1)
    ctx.value.fillText(i > STEP ? `${iTxt}${unit.value}` : iTxt, i * SINGLE_RULE_LEN - 10, 40)
  }
  ctx.value.moveTo(SINGLE_RULE_LEN, 30)
  ctx.value.lineTo((STEP + 1) * SINGLE_RULE_LEN, 30)
  ctx.value.stroke()
}

function updateScalebars2() {
  getRuleItemInfo() //先返回对于应的刻度map
  const signlePx =
    rule.unit === 'mm'
      ? NP.times(rule.signlePhysicalSize, 1000, oneμmPx.value)
      : NP.times(rule.signlePhysicalSize, oneμmPx.value)
  ctx2.value.clearRect(0, 0, rulerCanvas.width || 0, rulerCanvas.height || 0)
  ctx2.value.fillStyle = 'transparent'
  ctx2.value.fillRect(0, 0, rulerCanvas.width || 0, rulerCanvas.height || 0)
  ctx2.value.beginPath()
  ctx2.value.lineWidth = 1
  ctx2.value.strokeStyle = '#000'
  ctx2.value.fillStyle = 'blue'
  for (let i = 1; i <= STEP + 1; i++) {
    ctx2.value.moveTo(i * signlePx, 20)
    ctx2.value.lineTo(i * signlePx, 30)
    const iTxt = NP.round(NP.times(NP.minus(i, 1), signlePx, physicalPxWidth.value), 1)
    ctx2.value.fillText(i > STEP ? `${iTxt}${unit.value}` : iTxt, i * signlePx - 10, 40)
  }
  ctx2.value.moveTo(signlePx, 30)
  ctx2.value.lineTo((STEP + 1) * signlePx, 30)
  ctx2.value.stroke()
}

const drawRect = (
  width: number,
  height: number,
  top: number,
  left: number,
  extrParms = { hasControls: true, lockRotation: false } // selectable: true, hasControls: true, hasRotatingPoint: true, lockRotation: false
) => {
  const rect = new fabric.Rect({
    width,
    height,
    top,
    left,
    stroke: fabricStyle.strokeColor,
    fill: fabricStyle.fillColor,
    strokeWidth: fabricStyle.strokeWeight,
    ...extrParms
  })
  fabricOverlay.value.fabricCanvas().add(rect)
  return rect
}
const drawCircle = (item: any) => {
  const circle = new fabric.Circle({
    kmdpAnnotationId: item.kmdpAnnotationId,
    radius: parseFloat(item.radius),
    top: parseFloat(item.top),
    left: parseFloat(item.left),
    stroke: fabricStyle.strokeColor,
    fill: fabricStyle.fillColor,
    strokeWidth: fabricStyle.strokeWeight,
    selectable: true
  })
  fabricOverlay.value.fabricCanvas().add(circle)
  return circle
}

const drawText = (item: any) => {
  const text = new fabric.IText(item.text, {
    kmdpAnnotationId: item.kmdpAnnotationId,
    left: parseFloat(item.left),
    top: parseFloat(item.top),
    width: parseFloat(item.width),
    fontSize: parseFloat(item.fontSize),
    fill: item.fill,
    selectable: true
  })
  fabricOverlay.value.fabricCanvas().add(text)
}

// 设置是否允许移动
const controlOSD = (flag: boolean) => {
  viewer.value.setMouseNavEnabled(flag)

  // // 新增模式下锁定框的平移
  // const list = fabricOverlay.value.fabricCanvas().getObjects()
  // for (const item of list) {
  //   item.set({
  //     lockMovementX: flag,
  //     lockMovementY: flag,
  //   })
  // }
}

// 新增标注
function startMask() {
  let rect: any, isDrawing: boolean, origX: number, origY: number
  isAddFabric.value = true
  controlOSD(false)
  // 鼠标按下
  fabricOverlay.value.fabricCanvas().on('mouse:down', function (o: any) {
    // 判断是不是绘制的图层元素，如果是的话走入编辑外框图层
    console.log('o', o.target)
    if (o.target) return
    isDrawing = true
    let pointer = fabricOverlay.value.fabricCanvas().getPointer(o.e)
    console.log('pointer', pointer)
    origX = pointer.x
    origY = pointer.y
    rect = drawRect(pointer.x - origX, pointer.y - origY, origY, origX)

    let activeGroup = fabricOverlay.value.fabricCanvas().getActiveObjects()
    console.log('activeGroup: ', activeGroup)
    if (activeGroup.length > 0) {
      fabricOverlay.value.fabricCanvas().discardActiveObject()
      fabricOverlay.value.fabricCanvas().setActiveObject(activeGroup[activeGroup.length - 1])
    }
  })
  // 鼠标移动
  fabricOverlay.value.fabricCanvas().on(
    'mouse:move',
    throttle({ interval: 50 }, (o: any) => {
      console.log('move=o-target', o)
      // 判断非画图过程，悬浮在当前元素的过程中则，禁止背景移动
      if (!isAddFabric.value) {
        if (!isDrawing) {
          controlOSD(o.target ? false : true)
        }
        return
      }
      let pointer = fabricOverlay.value.fabricCanvas().getPointer(o.e)
      if (origX > pointer.x) {
        rect.set({ left: Math.abs(pointer.x) })
      }
      if (origY > pointer.y) {
        rect.set({ top: Math.abs(pointer.y) })
      }
      rect.set({ width: Math.abs(origX - pointer.x), height: Math.abs(origY - pointer.y) })
      fabricOverlay.value.fabricCanvas().renderAll()
    })
  )

  //鼠标抬起
  fabricOverlay.value.fabricCanvas().on('mouse:up', function (o: any) {
    isAddFabric.value = false
    isDrawing = false
    fabricOverlay.value.fabricCanvas().setActiveObject(rect)
    controlOSD(true)
  })
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
