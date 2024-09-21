import test from "ava"
import { getBoundsOfPcbElements } from "../lib/get-bounds-of-pcb-elements"
import type { AnyCircuitElement } from "circuit-json"

test("getBoundsOfPcbElements", (t) => {
  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_component",
      pcb_component_id: "comp1",
      source_component_id: "source_comp1",
      center: { x: 0, y: 0 },
      width: 10,
      height: 5,
      rotation: 0,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      x: 15,
      y: 15,
      width: 2,
      height: 2,
      layer: "top",
      shape: "rect",
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "trace1",
      route: [
        { x: -5, y: -5, width: 1, layer: "top", route_type: "wire" },
        { x: 20, y: 20, width: 1, layer: "top", route_type: "wire" },
      ],
    },
  ]

  const bounds = getBoundsOfPcbElements(elements)

  t.deepEqual(bounds, { minX: -5, minY: -5, maxX: 20, maxY: 20 })
})
