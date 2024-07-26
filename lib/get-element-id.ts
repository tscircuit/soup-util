import type { AnySoupElement } from "@tscircuit/soup"

export const getElementId = (elm: AnySoupElement): string => {
  const type = elm.type
  const id = (elm as any)[`${type}_id`]
  return id
}
