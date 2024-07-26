import type { AnySoupElement } from "@tscircuit/soup"
import { getElementId } from "./get-element-id"

export const getElementById = (
  soup: AnySoupElement[],
  id: string,
): AnySoupElement | null => {
  return soup.find((elm) => getElementId(elm) === id) ?? null
}
