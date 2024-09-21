import type { AnyCircuitElement } from "circuit-json"
import { su } from "../su"

export function getReadableNameForPcbTrace(
  soup: AnyCircuitElement[],
  pcb_trace_id: string,
) {
  // Find the pcb_trace object
  const pcbTrace = su(soup).pcb_trace.get(pcb_trace_id)

  if (!pcbTrace) {
    return `trace[${pcb_trace_id}]`
  }

  // Get the connected ports
  const connectedPcbPortIds: string[] = pcbTrace.route
    .flatMap((point: any) => [point.start_pcb_port_id, point.end_pcb_port_id])
    .filter(Boolean)

  if (connectedPcbPortIds.length === 0) {
    return `trace[${pcb_trace_id}]`
  }

  // Function to get component name and port hint
  function getComponentAndPortInfo(pcb_port_id: string) {
    const pcbPort = su(soup).pcb_port.get(pcb_port_id)
    if (!pcbPort) return null

    const pcbComponent = su(soup).pcb_component.get(pcbPort.pcb_component_id)
    if (!pcbComponent) return null
    const sourceComponent = su(soup).source_component.get(
      pcbComponent.source_component_id,
    )
    if (!sourceComponent) return null

    const sourcePort = su(soup).source_port.get(pcbPort.source_port_id)
    const portHint = sourcePort?.port_hints ? sourcePort.port_hints[1] : ""

    return {
      componentName: sourceComponent.name,
      portHint: portHint,
    }
  }

  // Generate the readable selector
  const selectorParts = connectedPcbPortIds.map((portId) => {
    const info = getComponentAndPortInfo(portId)
    if (info) {
      return `.${info.componentName} > port.${info.portHint}`
    }
    return `port[${portId}]`
  })

  return `trace[${selectorParts.join(", ")}]`
}
