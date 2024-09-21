import type { AnyCircuitElement } from "circuit-json"
import { getElementId } from "./get-element-id"

export const getElementById = (
  soup: AnyCircuitElement[],
  id: string,
): AnyCircuitElement | null => {
  return soup.find((elm) => getElementId(elm) === id) ?? null
}
