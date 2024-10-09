import { expect, test } from "bun:test"
import { findBoundsAndCenter } from "lib/find-bounds-and-center"

test("should return default values for empty input", () => {
  const result = findBoundsAndCenter([])
  expect(result).toEqual({ center: { x: 0, y: 0 }, width: 0, height: 0 })
})

test("should calculate bounds and center for a single element", () => {
  const elements = [
    { type: "pcb_component", x: 10, y: 20, width: 5, height: 5 },
  ]
  const result = findBoundsAndCenter(elements)
  expect(result).toEqual({
    center: { x: 10, y: 20 },
    width: 5,
    height: 5,
  })
})

test("should calculate bounds and center for multiple elements", () => {
  const elements = [
    { type: "pcb_component", x: 0, y: 0, width: 10, height: 10 },
    { type: "pcb_component", x: 20, y: 20, width: 10, height: 10 },
  ]
  const result = findBoundsAndCenter(elements)
  expect(result).toEqual({
    center: { x: 10, y: 10 },
    width: 30,
    height: 30,
  })
})

test("should handle pcb_trace elements correctly", () => {
  const elements = [
    {
      type: "pcb_trace",
      route: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
    },
    { type: "pcb_component", x: 20, y: 20, width: 10, height: 10 },
  ]
  const result = findBoundsAndCenter(elements)
  expect(result).toEqual({
    center: { x: 12.475, y: 12.475 },
    width: 25.05,
    height: 25.05,
  })
})
