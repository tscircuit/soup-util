import type { AnyCircuitElement } from "circuit-json"
import { su } from "../index"
import { test, expect } from "bun:test"

test("get", () => {
  const soup: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "simple_resistor_0",
      name: "R1",
      supplier_part_numbers: {},
      ftype: "simple_resistor",
      resistance: 10_000,
    },
    {
      type: "source_port",
      name: "left",
      source_port_id: "source_port_0",
      source_component_id: "simple_resistor_0",
    },
  ]

  const se = su(soup).source_component.get("simple_resistor_0")
  expect(se?.name).toBe("R1")
})
