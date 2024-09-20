import type { AnyCircuitElement } from "@tscircuit/soup"

export const getBoundsOfPcbElements = (
  elements: AnyCircuitElement[],
): { minX: number; minY: number; maxX: number; maxY: number } => {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const elm of elements) {
    if (!elm.type.startsWith("pcb_")) continue
    if ("x" in elm && "y" in elm) {
      minX = Math.min(minX, elm.x)
      minY = Math.min(minY, elm.y)
      maxX = Math.max(maxX, elm.x)
      maxY = Math.max(maxY, elm.y)

      if ("width" in elm) {
        maxX = Math.max(maxX, elm.x + elm.width)
      }
      if ("height" in elm) {
        maxY = Math.max(maxY, elm.y + elm.height)
      }
      if ("radius" in elm) {
        minX = Math.min(minX, elm.x - elm.radius)
        minY = Math.min(minY, elm.y - elm.radius)
        maxX = Math.max(maxX, elm.x + elm.radius)
        maxY = Math.max(maxY, elm.y + elm.radius)
      }
    } else if (elm.type === "pcb_trace") {
      for (const point of elm.route) {
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
      }
    }
  }

  return { minX, minY, maxX, maxY }
}
