import type { AnySoupElement } from "@tscircuit/soup"
import { getReadableNameForPcbTrace } from "./get-readable-name-for-pcb-trace"
import { getReadableNameForPcbSmtpad } from "./get-readable-name-for-pcb-smtpad"
import { getReadableNameForPcbPort } from "./get-readable-name-for-pcb-port"
import { getElementById } from "lib/get-element-by-id"
import { getElementId } from "lib/get-element-id"

export const getReadableNameForElement = (
  soup: AnySoupElement[],
  elm: AnySoupElement | string,
): string => {
  if (typeof elm === "string") {
    const elmObj = getElementById(soup, elm)
    if (!elmObj) `unknown (could not find element with id ${elm})`
    return getReadableNameForElement(soup, elmObj as any)
  }
  switch (elm.type) {
    case "pcb_port":
      return getReadableNameForPcbPort(soup, elm.pcb_port_id)
    case "pcb_smtpad":
      return getReadableNameForPcbSmtpad(soup, elm.pcb_smtpad_id)
    case "pcb_trace":
      return getReadableNameForPcbTrace(soup, elm.pcb_trace_id)
    case "source_component":
      return `source_component[${elm.name}]`
    default:
      return `${elm.type}[#${getElementId(elm)}]`
  }
}
