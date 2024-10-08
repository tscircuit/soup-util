import * as parsel from "parsel-js"
import { convertAbbrToType } from "./convert-abbreviation-to-soup-element-type"
import type { AnyCircuitElement } from "circuit-json"

const filterByType = (
  elements: AnyCircuitElement[],
  type: string
): AnyCircuitElement[] => {
  type = convertAbbrToType(type)
  return elements.filter(
    (elm) => ("ftype" in elm && elm.ftype === type) || elm.type === type
  )
}

/**
 * Filter elements to match the selector, e.g. to access the left port of a
 * resistor you can do ".R1 > port.left"
 */
export const applySelector = (
  elements: AnyCircuitElement[],
  selectorRaw: string
): AnyCircuitElement[] => {
  const selectorAST = parsel.parse(selectorRaw)
  return applySelectorAST(elements, selectorAST!)
}

const doesElmMatchClassName = (elm: AnyCircuitElement, className: string) =>
  ("name" in elm && elm.name === className) ||
  ("port_hints" in elm && elm.port_hints?.includes(className))

export const applySelectorAST = (
  elements: AnyCircuitElement[],
  selectorAST: parsel.AST
): AnyCircuitElement[] => {
  switch (selectorAST.type) {
    case "complex": {
      switch (selectorAST.combinator) {
        case " ": // TODO technically should do a deep search
        case ">": {
          const { left, right } = selectorAST
          if (left.type === "class" || left.type === "type") {
            // TODO should also check if content matches any element tags
            let matchElms: AnyCircuitElement[]
            if (left.type === "class") {
              matchElms = elements.filter((elm) =>
                doesElmMatchClassName(elm, left.name)
              )
            } else if (left.type === "type") {
              matchElms = filterByType(elements, left.name)
            } else {
              matchElms = []
            }

            const childrenOfMatchingElms = matchElms.flatMap((matchElm) =>
              elements.filter(
                (elm: any) =>
                  elm[`${matchElm.type}_id`] ===
                    (matchElm as any)[`${matchElm.type}_id`] && elm !== matchElm
              )
            )
            return applySelectorAST(childrenOfMatchingElms, right)
          } else {
            throw new Error(`unsupported selector type "${left.type}" `)
          }
        }
        default: {
          throw new Error(
            `Couldn't apply selector AST for complex combinator "${selectorAST.combinator}"`
          )
        }
      }
      return []
    }
    case "compound": {
      const conditionsToMatch = selectorAST.list.map((part) => {
        switch (part.type) {
          case "class": {
            return (elm: any) => doesElmMatchClassName(elm, part.name)
          }
          case "type": {
            const name = convertAbbrToType(part.name)
            return (elm: any) => elm.type === name
          }
        }
      })

      return elements.filter((elm) =>
        conditionsToMatch.every((condFn) => condFn?.(elm))
      )
    }
    case "type": {
      return filterByType(elements, selectorAST.name) as AnyCircuitElement[]
    }
    case "class": {
      return elements.filter((elm) =>
        doesElmMatchClassName(elm, selectorAST.name)
      )
    }
    default: {
      throw new Error(
        `Couldn't apply selector AST for type: "${
          selectorAST.type
        }" ${JSON.stringify(selectorAST, null, " ")}`
      )
    }
  }
}
