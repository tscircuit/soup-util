# @tscircuit/circuit-json-util

> Previously released as `@tscircuit/soup-util`

This is a small utility library for working with [circuit json](https://github.com/tscircuit/circuit-json)

It reduces the amount of code to retrieve or join elements from circuit json, it also neatly handles all the typing.

## Standard Usage

```ts
import { su } from "@tscircuit/circuit-json-util"

const circuitJson = [
  /* [ { type: "source_component", ... }, ... ] */
]

const pcb_component = su(circuitJson).pcb_component.get("1234")

const source_component = su(circuitJson).source_component.getUsing({
  pcb_component_id: "123",
})

const schematic_component = su(circuitJson).schematic_component.getWhere({
  width: 1,
})

const source_traces = su(circuitJson).source_trace.list({
  source_component_id: "123",
})
```

## Optimized Indexed Version

For large circuit json, the library provides an optimized version with indexing for faster lookups:

```ts
import { suIndexed } from "@tscircuit/circuit-json-util"

const circuitJson = [
  /* large soup with many elements */
]

// Configure the indexes you want to use
const indexedSu = suIndexed(circuitJson, {
  indexConfig: {
    byId: true, // Index by element ID for fast .get() operations
    byType: true, // Index by element type for fast .list() operations
    byRelation: true, // Index relation fields (fields ending with _id)
    bySubcircuit: true, // Index by subcircuit_id for fast subcircuit filtering
    byCustomField: ["name", "ftype"], // Index specific fields you query often
  },
})

// Use the same API as the standard version, but with much better performance
const pcb_component = indexedSu.pcb_component.get("1234") // O(1) lookup

// Fast filtering by subcircuit
const subcircuitElements = indexedSu.source_component.list({
  subcircuit_id: "main",
})
```

The indexed version maintains the same API as the standard version but provides significant performance improvements, especially for large circuit json arrays.
