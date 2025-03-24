import type { AnyCircuitElement } from "circuit-json"

export const getPrimaryId = (element: AnyCircuitElement): string => {
  // @ts-ignore
  return element[`${element.type}_id`]
}
