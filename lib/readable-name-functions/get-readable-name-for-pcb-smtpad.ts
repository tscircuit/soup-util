import type { AnySoupElement } from "@tscircuit/soup"
import { su } from "../su"
import { getReadableNameForPcbPort } from "./get-readable-name-for-pcb-port"

export function getReadableNameForPcbSmtpad(
  soup: AnySoupElement[],
  pcb_smtpad_id: string,
): string {
  // Find the pcb_smtpad object
  const pcbSmtpad = su(soup).pcb_smtpad.get(pcb_smtpad_id)

  if (!pcbSmtpad || !pcbSmtpad.pcb_port_id) {
    return `smtpad[${pcb_smtpad_id}]`
  }

  return getReadableNameForPcbPort(soup, pcbSmtpad.pcb_port_id)
}
