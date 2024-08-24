import type { AnySoupElement } from "@tscircuit/soup"
import { su } from "../index"
import test from "ava"

test("insert with validation", (t) => {
  const soup: AnySoupElement[] = [
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

  t.throws(() => {
    su(soup, { validateInserts: true }).pcb_port.insert({
      // @ts-expect-error - this is the error, "top" should be in an array
      layers: "top",
      pcb_component_id: "",
      source_port_id: "source_port_0",
      x: 0,
      y: 0,
    })
  })
})
