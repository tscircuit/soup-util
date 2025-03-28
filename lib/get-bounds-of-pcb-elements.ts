import type { AnyCircuitElement } from "circuit-json"

export const getBoundsOfPcbElements = (
  elements: AnyCircuitElement[],
): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const elm of elements) {
    if (!elm.type.startsWith("pcb_")) continue

    let centerX: number | undefined
    let centerY: number | undefined

    let width: number | undefined
    let height: number | undefined

    if ("x" in elm && "y" in elm) {
      centerX = elm.x
      centerY = elm.y
    }

    if ("outer_diameter" in elm) {
      width = elm.outer_diameter
      height = elm.outer_diameter
    }

    if ("width" in elm) {
      width = elm.width
    }

    if ("height" in elm) {
      height = elm.height
    }

    if ("center" in elm) {
      // @ts-ignore
      centerX = elm.center.x
      // @ts-ignore
      centerY = elm.center.y
    }

    if (centerX !== undefined && centerY !== undefined) {
      minX = Math.min(minX, centerX)
      minY = Math.min(minY, centerY)
      maxX = Math.max(maxX, centerX)
      maxY = Math.max(maxY, centerY)

      if (width !== undefined && height !== undefined) {
        minX = Math.min(minX, centerX - width / 2)
        minY = Math.min(minY, centerY - height / 2)
        maxX = Math.max(maxX, centerX + width / 2)
        maxY = Math.max(maxY, centerY + height / 2)
      }

      if ("radius" in elm) {
        minX = Math.min(minX, centerX - elm.radius)
        minY = Math.min(minY, centerY - elm.radius)
        maxX = Math.max(maxX, centerX + elm.radius)
        maxY = Math.max(maxY, centerY + elm.radius)
      }
    } else if (elm.type === "pcb_trace") {
      for (const point of elm.route) {
        // TODO add trace thickness support
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
      }
    }
  }

  return { minX, minY, maxX, maxY }
}
