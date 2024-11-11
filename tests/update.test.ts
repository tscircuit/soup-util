import type { AnyCircuitElement } from "circuit-json"
import { su } from "../index"
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

  su(soup).source_port.update("source_port_0", {
    name: "right",
  })

  const port = su(soup).source_port.get("source_port_0")

  expect(port?.name).toBe("right")

  su(soup).source_component.update("simple_resistor_0", {
    supplier_part_numbers: {
      jlcpcb: ["1234567890"],
    },
  })

  const resistor = su(soup).source_component.get("simple_resistor_0")

  expect(resistor?.supplier_part_numbers).toEqual({
    jlcpcb: ["1234567890"],
  })
})
