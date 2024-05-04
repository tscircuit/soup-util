# @tscircuit/soup-util

This is a small utility library for working with [tscircuit soup](https://docs.tscircuit.com/api-reference/advanced/soup)

It reduces the amount of code to retrieve or join elements from the soup, it also
neatly handles all the typing.

```ts
import su from "@tscircuit/soup-util"

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
