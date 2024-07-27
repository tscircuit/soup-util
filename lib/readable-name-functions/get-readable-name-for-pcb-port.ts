import type { AnySoupElement } from "@tscircuit/soup"
import { su } from "../su"

export const getReadableNameForPcbPort = (
  soup: AnySoupElement[],
  pcb_port_id: string,
): string => {
  const pcbPort = su(soup).pcb_port.get(pcb_port_id)
  if (!pcbPort) {
    return `pcb_port[#${pcb_port_id}]`
  }

  // Get the component information
  const pcbComponent = su(soup).pcb_component.get(pcbPort?.pcb_component_id)

  if (!pcbComponent) {
    return `pcb_port[#${pcb_port_id}]`
  }

  // Get the source component information
  const sourceComponent = su(soup).source_component.get(
    pcbComponent.source_component_id,
  )

  if (!sourceComponent) {
    return `pcb_port[#${pcb_port_id}]`
  }

  // Get the source port information
  const sourcePort = su(soup).source_port.get(pcbPort.source_port_id)

  if (!sourcePort) {
    return `pcb_port[#${pcb_port_id}]`
  }

  // Determine the pad number or hint
  let padIdentifier: string
  if (sourcePort?.port_hints && sourcePort.port_hints.length > 0) {
    padIdentifier = sourcePort.port_hints[0]!
  } else if (sourcePort.port_hints && sourcePort.port_hints.length > 0) {
    padIdentifier = sourcePort.port_hints[0]!
  } else {
    padIdentifier = pcb_port_id
  }

  return `pcb_port[.${sourceComponent.name} > .${padIdentifier}]`
}
