import type { AnySoupElement } from "@tscircuit/soup"
import su from "../index"
import test from "ava"

test("get", (t) => {
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

  const se = su(soup).source_component.get("simple_resistor_0")
  t.is(se?.name, "R1")
})
