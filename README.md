# @tscircuit/soup-util

This is a small utility library for working with [tscircuit soup](https://docs.tscircuit.com/api-reference/advanced/soup)

```ts
import su from "@tscircuit/soup-util"

const soup = [
  /* [ { type: "source_component", ... }, ... ] */
]

const pcb_component = su(soup).pcb_component.get("1234")
```
