import type { AnyCircuitElement } from "circuit-json"

export const getElementId = (elm: AnyCircuitElement): string => {
  const type = elm.type
  const id = (elm as any)[`${type}_id`]
  return id
}
