import type { AnyCircuitElement } from "circuit-json"
import { getDebugLayoutObject } from "./utils/get-layout-debug-object"
import { isTruthy } from "./utils/is-truthy"

export const findBoundsAndCenter = (
  elements: AnyCircuitElement[],
): { center: { x: number; y: number }; width: number; height: number } => {
  const debugObjects = elements
    .filter((elm) => elm.type.startsWith("pcb_"))
    .concat(
      elements
        .filter((elm) => elm.type === "pcb_trace")
        .flatMap((elm) => elm.route),
    )
    .map((elm) => getDebugLayoutObject(elm))
    .filter(isTruthy)

  if (debugObjects.length === 0)
    return { center: { x: 0, y: 0 }, width: 0, height: 0 }

  let minX = debugObjects[0].x - debugObjects[0].width / 2
  let maxX = debugObjects[0].x + debugObjects[0].width / 2
  let minY = debugObjects[0].y - debugObjects[0].height / 2
  let maxY = debugObjects[0].y + debugObjects[0].height / 2

  for (const obj of debugObjects.slice(1)) {
    minX = Math.min(minX, obj.x - obj.width / 2)
    maxX = Math.max(maxX, obj.x + obj.width / 2)
    minY = Math.min(minY, obj.y - obj.height / 2)
    maxY = Math.max(maxY, obj.y + obj.height / 2)
  }

  const width = maxX - minX
  const height = maxY - minY
  const center = { x: minX + width / 2, y: minY + height / 2 }

  return { center, width, height }
}
