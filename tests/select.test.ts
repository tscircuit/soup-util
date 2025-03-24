import type { AnyCircuitElement } from "circuit-json"
import { cju } from "../index"
import { test, expect } from "bun:test"

test("select", () => {
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
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_0",
      source_port_id: "source_port_0",
      layers: ["top"],
      pcb_component_id: "pcb_component_simple_resistor_0",
      x: 0,
      y: 0,
    },
  ]

  const pp = cju(soup).pcb_port.select(".R1 > .left")
  expect(pp?.pcb_port_id).toBe("pcb_port_0")
})
