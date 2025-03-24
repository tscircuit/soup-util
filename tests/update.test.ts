import type { AnyCircuitElement } from "circuit-json"
import { cju } from "../index"
import { test, expect } from "bun:test"

test("update", () => {
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

  cju(soup).source_port.update("source_port_0", {
    name: "right",
  })

  const port = cju(soup).source_port.get("source_port_0")

  expect(port?.name).toBe("right")

  cju(soup).source_component.update("simple_resistor_0", {
    supplier_part_numbers: {
      jlcpcb: ["1234567890"],
    },
  })

  const resistor = cju(soup).source_component.get("simple_resistor_0")

  expect(resistor?.supplier_part_numbers).toEqual({
    jlcpcb: ["1234567890"],
  })
})
