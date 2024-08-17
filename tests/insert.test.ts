import type { AnySoupElement } from "@tscircuit/soup"
import { su } from "../index"
import test from "ava"

test("insert", (t) => {
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

  const pp = su(soup).pcb_port.insert({
    layers: ["top"],
    pcb_component_id: "",
    source_port_id: "source_port_0",
    x: 0,
    y: 0,
  })

  t.is(pp?.pcb_port_id, "pcb_port_0")

  const pcb_port = su(soup)
    .toArray()
    .find((elm) => elm.type === "pcb_port")!

  t.truthy(pcb_port)
})
