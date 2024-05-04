import type { AnySoupElement } from "@tscircuit/builder"
import su from "../index"
import test from "ava"

test("getUsing", (t) => {
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

  const sc = su(soup).source_component.getUsing({
    source_port_id: "source_port_0",
  })
  t.is(sc?.name, "R1")
})
