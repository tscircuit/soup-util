import test from "ava"
import { getReadableNameForElement } from "../lib/readable-name-functions/get-readable-name-for-element"
import type { AnySoupElement } from "@tscircuit/soup"

test("getReadableNameForElement for pcb_port, pcb_smtpad, and pcb_trace", (t) => {
  const soup: AnySoupElement[] = [
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "R1",
      ftype: "simple_resistor",
      resistance: 100,
    },
    {
      type: "source_port",
      source_port_id: "sp1",
      source_component_id: "sc1",
      name: "left",
      port_hints: ["1", "left"],
    },
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      width: 10,
      height: 5,
      rotation: 0,
      center: { x: 5, y: 5 },
      layer: "top",
    },
    {
      type: "pcb_port",
      pcb_port_id: "pp1",
      pcb_component_id: "pc1",
      source_port_id: "sp1",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "ps1",
      pcb_port_id: "pp1",
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      layer: "top",
      shape: "rect",
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "pt1",
      route: [
        {
          x: 0,
          y: 0,
          width: 1,
          layer: "top",
          route_type: "wire",
          start_pcb_port_id: "pp1",
        },
        {
          x: 1,
          y: 0,
          width: 1,
          layer: "top",
          route_type: "wire",
          end_pcb_port_id: "pp2",
        },
      ],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pp2",
      pcb_component_id: "pc2",
      source_port_id: "sp2",
      x: 0,
      y: 0,
      layers: ["top"],
    },
    {
      type: "source_component",
      source_component_id: "sc2",
      name: "C1",
      ftype: "simple_capacitor",
      capacitance: 10,
    },
    {
      type: "source_port",
      source_port_id: "sp2",
      source_component_id: "sc2",
      name: "positive",
      port_hints: ["1", "positive"],
    },
    {
      type: "pcb_component",
      pcb_component_id: "pc2",
      source_component_id: "sc2",
      width: 10,
      height: 5,
      rotation: 0,
      center: { x: 0, y: 0 },
      layer: "top",
    },
  ]

  // Test pcb_port
  t.is(
    getReadableNameForElement(soup, "pp1"),
    "pcb_port[.R1 > .1]",
    "PCB port readable name",
  )

  // Test pcb_smtpad
  t.is(
    getReadableNameForElement(soup, "ps1"),
    "pcb_port[.R1 > .1]",
    "PCB SMT pad readable name",
  )

  // Test pcb_trace
  t.is(
    getReadableNameForElement(soup, "pt1"),
    "trace[.R1 > port.left, .C1 > port.positive]",
    "PCB trace readable name",
  )
})
