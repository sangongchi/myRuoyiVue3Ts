<template>
  <div class="fabric-overlay-container">
    <canvas id="fabricCanvas"></canvas>
  </div>
</template>

<script lang="ts" setup>
  import { Canvas, Rect, FabricText, Group, Point } from "fabric"
  import { ref, nextTick } from "vue"
  import NP from "number-precision"

  let overlay: any | null = null
  const isDragging = ref<boolean>(false)
  let lastPos = { x: 0, y: 0 }
  async function initFabric() {
    await nextTick()
    overlay = new Canvas("fabricCanvas", {
      backgroundColor: "#f0f0f0",
      width: window.innerWidth,
      height: window.innerHeight,
      preserveObjectStacking: true, //  元素对象被选中时保持在当前z轴，不会跳到最顶层,默认false
      // selection: true,
      // perPixelTargetFind: true,
    })
    var rect = new Rect({
      left: 200,
      top: 100,
      fill: "red",
      width: 200,
      height: 200,
      // angle: 45,
      // opacity: 0.5,
      stroke: "black",
      strokeWidth: 2,
      // hasControls: true, // 确保控制点可见
      // hasRotatingPoint: true, // 启用旋转控制点
      // selectable: true, // 确保可选
    })
    overlay.add(rect)
    drawShapInfo(rect)
    overlay.on("mouse:wheel", function (opt: any) {
      var delta = opt.e.deltaY
      var zoom = overlay.getZoom()
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      overlay.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    overlay.on("mouse:down", function (opt: any) {
      if (opt.e.altKey) {
        // 按Alt键触发拖拽
        isDragging.value = true
        lastPos = { x: opt.e.clientX, y: opt.e.clientY }
        overlay.defaultCursor = "grabbing"
      }
    })
    overlay.on("mouse:move", function (opt: any) {
      if (isDragging.value) {
        const deltaX = opt.e.clientX - lastPos.x
        const deltaY = opt.e.clientY - lastPos.y

        overlay.relativePan(new Point(deltaX, deltaY))
        lastPos = { x: opt.e.clientX, y: opt.e.clientY }
      }
    })
    overlay.on("mouse:up", function () {
      isDragging.value = false
      overlay.selection = false
    })
  }
  initFabric()

  // 绘制当前
  function drawShapInfo(target: any) {
    // 创建一个圆形对象
    const rect = new Rect({
      width: 200,
      height: 100,
      fill: "#eef",
      opacity: 0.5,
    })

    // 创建一个文本对象
    const text = new FabricText("hello \n world", {
      fontSize: NP.round(NP.times(target.scaleX, 12), 0),
    })

    // 创建一个包含圆形和文本的组合对象
    const group = new Group([rect, text], {
      left: target.left + target.width / 2 + 10,
      top: target.top + target.height / 2 + 10,
      hasControls: false,
      selectable: false,
      hasBorders: false,
    })
    overlay.add(group)
    console.log(overlay)
  }
</script>
<style lang="scss" scoped>
  .fabric-overlay-container {
    overflow: hidden;
  }
</style>
