import type { AnyCircuitElement } from "circuit-json"
import { su } from "../index"
import { test, expect } from "bun:test"

test("delete", () => {
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

  su(soup).source_port.delete("source_port_0")

  const sp = su(soup)
    .toArray()
    .find((e) => e.type === "source_port")

  expect(sp).toBeFalsy()
})
