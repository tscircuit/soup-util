import type { AnyCircuitElement } from "circuit-json"
import { cju, cjuIndexed } from "../index"
import { test, expect } from "bun:test"

test("suIndexed produces same output as su", () => {
  const soup: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "simple_resistor_0",
      name: "R1",
      supplier_part_numbers: {},
      ftype: "simple_resistor",
      resistance: 10_000,
      subcircuit_id: "main",
    },
    {
      type: "source_port",
      name: "left",
      source_port_id: "source_port_0",
      source_component_id: "simple_resistor_0",
      subcircuit_id: "main",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "simple_resistor_0",
      x: 10,
      y: 20,
      width: 5,
      height: 2,
      subcircuit_id: "main",
    },
  ]

  const regularSu = cju(soup)
  const indexedSu = cjuIndexed(soup, {
    indexConfig: {
      byId: true,
      byType: true,
      byRelation: true,
      bySubcircuit: true,
      byCustomField: ["name", "ftype"],
    },
  })

  // Test get operation
  const regularGet = regularSu.source_component.get("simple_resistor_0")
  const indexedGet = indexedSu.source_component.get("simple_resistor_0")
  expect(indexedGet).toEqual(regularGet)

  // Test getUsing operation
  const regularGetUsing = regularSu.source_component.getUsing({
    pcb_component_id: "pcb_component_0",
  })
  const indexedGetUsing = indexedSu.source_component.getUsing({
    pcb_component_id: "pcb_component_0",
  })
  expect(indexedGetUsing).toEqual(regularGetUsing)

  // Test getWhere operation
  const regularGetWhere = regularSu.source_component.getWhere({ name: "R1" })
  const indexedGetWhere = indexedSu.source_component.getWhere({ name: "R1" })
  expect(indexedGetWhere).toEqual(regularGetWhere)

  // Test list operation
  const regularList = regularSu.source_port.list()
  const indexedList = indexedSu.source_port.list()
  expect(indexedList).toEqual(regularList)

  // Test list with filter
  const regularListWhere = regularSu.source_component.list({
    subcircuit_id: "main",
  })
  const indexedListWhere = indexedSu.source_component.list({
    subcircuit_id: "main",
  })
  expect(indexedListWhere).toEqual(regularListWhere)

  // Test insert operation
  const regularInsert = regularSu.source_port.insert({
    name: "right",
    source_component_id: "simple_resistor_0",
    subcircuit_id: "main",
  })
  const indexedInsert = indexedSu.source_port.insert({
    name: "right",
    source_component_id: "simple_resistor_0",
    subcircuit_id: "main",
  })
  expect(indexedInsert.name).toEqual(regularInsert.name)
  expect(indexedInsert.source_component_id).toEqual(
    regularInsert.source_component_id,
  )

  // Test update operation
  const regularUpdate = regularSu.source_component.update("simple_resistor_0", {
    resistance: 20_000,
  })
  const indexedUpdate = indexedSu.source_component.update("simple_resistor_0", {
    resistance: 20_000,
  })
  expect(indexedUpdate).toEqual(regularUpdate)

  // Test with subcircuit relationship
  const regularBySubcircuit = regularSu.source_component.getWhere({
    subcircuit_id: "main",
  })
  const indexedBySubcircuit = indexedSu.source_component.getWhere({
    subcircuit_id: "main",
  })
  expect(indexedBySubcircuit).toEqual(regularBySubcircuit)

  // Test toArray returns the same soup
  expect(indexedSu.toArray()).toEqual(regularSu.toArray())
})
