# @tscircuit/soup-util

This is a small utility library for working with [tscircuit soup](https://docs.tscircuit.com/api-reference/advanced/soup)

It reduces the amount of code to retrieve or join elements from the soup, it also
neatly handles all the typing.

## Standard Usage

```ts
import { su } from "@tscircuit/soup-util"

const soup = [
  /* [ { type: "source_component", ... }, ... ] */
]

const pcb_component = su(soup).pcb_component.get("1234")

const source_component = su(soup).source_component.getUsing({
  pcb_component_id: "123",
})

const schematic_component = su(soup).schematic_component.getWhere({ width: 1 })

const source_traces = su(soup).source_trace.list({ source_component_id: "123" })
```

## Optimized Indexed Version

For large soups, the library provides an optimized version with indexing for faster lookups:

```ts
import { suIndexed } from "@tscircuit/soup-util"

const soup = [
  /* large soup with many elements */
]

// Configure the indexes you want to use
const indexedSoup = suIndexed(soup, {
  indexConfig: {
    byId: true,            // Index by element ID for fast .get() operations
    byType: true,          // Index by element type for fast .list() operations 
    byRelation: true,      // Index relation fields (fields ending with _id)
    bySubcircuit: true,    // Index by subcircuit_id for fast subcircuit filtering
    byCustomField: ["name", "ftype"]  // Index specific fields you query often
  }
})

// Use the same API as the standard version, but with much better performance
const pcb_component = indexedSoup.pcb_component.get("1234")  // O(1) lookup

// Fast filtering by subcircuit
const subcircuitElements = indexedSoup.source_component.list({ subcircuit_id: "main" })
```

The indexed version maintains the same API as the standard version but provides significant performance improvements, especially for large circuit soups.
