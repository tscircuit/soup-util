import type {
  AnyCircuitElement,
  AnyCircuitElementInput,
  SourceComponentBase,
  SourcePort,
} from "circuit-json"
import * as Soup from "circuit-json"
import type {
  CircuitJsonOps,
  CircuitJsonUtilObjects as CircuitJsonUtilObjects,
  CircuitJsonInputUtilObjects as CircuitJsonInputUtilObjects,
} from "./cju"

export type IndexedCircuitJsonUtilOptions = {
  validateInserts?: boolean
  indexConfig?: {
    // Enable specific indexes for faster lookups
    byId?: boolean
    byType?: boolean
    byRelation?: boolean
    bySubcircuit?: boolean
    byCustomField?: string[]
  }
}

export type GetIndexedCircuitJsonUtilFn = ((
  soup: AnyCircuitElement[],
  options?: IndexedCircuitJsonUtilOptions,
) => CircuitJsonUtilObjects) & {
  unparsed: (soup: AnyCircuitElementInput[]) => CircuitJsonInputUtilObjects
}

interface InternalStore {
  counts: Record<string, number>
  // Indexes for faster lookups
  indexes: {
    byId?: Map<string, AnyCircuitElement>
    byType?: Map<string, AnyCircuitElement[]>
    // Maps relation fields (like component_id) to elements
    byRelation?: Map<string, Map<string, AnyCircuitElement[]>>
    // Maps subcircuit_id to elements
    bySubcircuit?: Map<string, AnyCircuitElement[]>
    // Custom field indexes
    byCustomField?: Map<string, Map<string, AnyCircuitElement[]>>
  }
}

// Creates a unique key for the ID index
function createIdKey(element: AnyCircuitElement): string {
  const type = element.type
  return `${type}:${(element as any)[`${type}_id`]}`
}

export const cjuIndexed: GetIndexedCircuitJsonUtilFn = ((
  soup: AnyCircuitElement[],
  options: IndexedCircuitJsonUtilOptions = {},
) => {
  let internalStore: InternalStore = (soup as any)._internal_store_indexed

  if (!internalStore) {
    internalStore = {
      counts: {},
      indexes: {},
    } as InternalStore

    // Initialize counts
    for (const elm of soup) {
      const type = elm.type
      const idVal = (elm as any)[`${type}_id`]
      if (!idVal) continue
      const idNum = Number.parseInt(idVal.split("_").pop() || "")
      if (!Number.isNaN(idNum)) {
        internalStore.counts[type] = Math.max(
          internalStore.counts[type] ?? 0,
          idNum,
        )
      }
    }

    // Build indexes
    const indexConfig = options.indexConfig || {}
    const indexes = internalStore.indexes

    // Reset indexes before rebuilding
    if (indexConfig.byId) {
      indexes.byId = new Map()
    }

    if (indexConfig.byType) {
      indexes.byType = new Map()
    }

    if (indexConfig.byRelation) {
      indexes.byRelation = new Map()
    }

    if (indexConfig.bySubcircuit) {
      indexes.bySubcircuit = new Map()
    }

    if (indexConfig.byCustomField && indexConfig.byCustomField.length > 0) {
      indexes.byCustomField = new Map()
      for (const field of indexConfig.byCustomField) {
        indexes.byCustomField.set(field, new Map())
      }
    }

    // Build indexes
    for (const element of soup) {
      // Index by ID
      if (indexConfig.byId) {
        const idKey = createIdKey(element)
        indexes.byId!.set(idKey, element)
      }

      // Index by type
      if (indexConfig.byType) {
        const elementsOfType = indexes.byType!.get(element.type) || []
        elementsOfType.push(element)
        indexes.byType!.set(element.type, elementsOfType)
      }

      // Index by relation fields (fields ending with _id)
      if (indexConfig.byRelation) {
        const elementEntries = Object.entries(element)
        for (const [key, value] of elementEntries) {
          if (
            key.endsWith("_id") &&
            key !== `${element.type}_id` &&
            typeof value === "string"
          ) {
            const relationTypeMap = indexes.byRelation!.get(key) || new Map()
            const relatedElements = relationTypeMap.get(value as string) || []
            relatedElements.push(element)
            relationTypeMap.set(value as string, relatedElements)
            indexes.byRelation!.set(key, relationTypeMap)
          }
        }
      }

      // Index by subcircuit_id
      if (indexConfig.bySubcircuit && "subcircuit_id" in element) {
        const subcircuitId = (element as any).subcircuit_id
        if (subcircuitId && typeof subcircuitId === "string") {
          const subcircuitElements =
            indexes.bySubcircuit!.get(subcircuitId) || []
          subcircuitElements.push(element)
          indexes.bySubcircuit!.set(subcircuitId, subcircuitElements)
        }
      }

      // Index by custom fields
      if (indexConfig.byCustomField && indexes.byCustomField) {
        for (const field of indexConfig.byCustomField) {
          if (field in element) {
            const fieldValue = (element as any)[field]
            if (
              fieldValue !== undefined &&
              (typeof fieldValue === "string" || typeof fieldValue === "number")
            ) {
              const fieldValueStr = String(fieldValue)
              const fieldMap = indexes.byCustomField.get(field)!
              const elementsWithFieldValue = fieldMap.get(fieldValueStr) || []
              elementsWithFieldValue.push(element)
              fieldMap.set(fieldValueStr, elementsWithFieldValue)
            }
          }
        }
      }
    }
    // Store internal state
    ;(soup as any)._internal_store_indexed = internalStore
  }

  const suIndexed = new Proxy(
    {},
    {
      get: (proxy_target: any, component_type: string) => {
        if (component_type === "toArray") {
          return () => soup
        }

        return {
          get: (id: string) => {
            const indexConfig = options.indexConfig || {}

            // Use ID index if available
            if (indexConfig.byId && internalStore.indexes.byId) {
              return (
                (internalStore.indexes.byId.get(
                  `${component_type}:${id}`,
                ) as Extract<
                  AnyCircuitElement,
                  { type: typeof component_type }
                >) || null
              )
            }

            // Use type index if available
            if (indexConfig.byType && internalStore.indexes.byType) {
              const elementsOfType =
                internalStore.indexes.byType.get(component_type) || []
              return (
                (elementsOfType.find(
                  (e: any) => e[`${component_type}_id`] === id,
                ) as Extract<
                  AnyCircuitElement,
                  { type: typeof component_type }
                >) || null
              )
            }

            // Fallback to regular search
            return (
              (soup.find(
                (e: any) =>
                  e.type === component_type && e[`${component_type}_id`] === id,
              ) as Extract<
                AnyCircuitElement,
                { type: typeof component_type }
              >) || null
            )
          },

          getUsing: (using: any) => {
            const indexConfig = options.indexConfig || {}
            const keys = Object.keys(using)

            if (keys.length !== 1) {
              throw new Error(
                "getUsing requires exactly one key, e.g. { pcb_component_id }",
              )
            }

            const join_key = keys[0] as string
            const join_type = join_key.replace("_id", "")

            // Use relation index if available
            if (indexConfig.byRelation && internalStore.indexes.byRelation) {
              const relationMap = internalStore.indexes.byRelation.get(join_key)
              if (relationMap) {
                const relatedElements = relationMap.get(using[join_key]) || []
                const joiner = relatedElements.find((e) => e.type === join_type)

                if (!joiner) return null

                // Now find the element of component_type with matching ID
                const joinerId =
                  joiner[`${component_type}_id` as keyof typeof joiner]

                if (indexConfig.byId && internalStore.indexes.byId) {
                  return (
                    (internalStore.indexes.byId.get(
                      `${component_type}:${joinerId}`,
                    ) as Extract<
                      AnyCircuitElement,
                      { type: typeof component_type }
                    >) || null
                  )
                }

                if (indexConfig.byType && internalStore.indexes.byType) {
                  const elementsOfType =
                    internalStore.indexes.byType.get(component_type) || []
                  return (
                    (elementsOfType.find(
                      (e: any) => e[`${component_type}_id`] === joinerId,
                    ) as Extract<
                      AnyCircuitElement,
                      { type: typeof component_type }
                    >) || null
                  )
                }

                return (
                  (soup.find(
                    (e: any) =>
                      e.type === component_type &&
                      e[`${component_type}_id`] === joinerId,
                  ) as Extract<
                    AnyCircuitElement,
                    { type: typeof component_type }
                  >) || null
                )
              }
            }

            // Fallback to regular approach
            const joiner: any = soup.find(
              (e: any) =>
                e.type === join_type && e[join_key] === using[join_key],
            )

            if (!joiner) return null

            return (
              (soup.find(
                (e: any) =>
                  e.type === component_type &&
                  e[`${component_type}_id`] === joiner[`${component_type}_id`],
              ) as Extract<
                AnyCircuitElement,
                { type: typeof component_type }
              >) || null
            )
          },

          getWhere: (where: any) => {
            const indexConfig = options.indexConfig || {}
            const keys = Object.keys(where)

            // If we're looking by a single property and it's indexed as a custom field
            if (
              keys.length === 1 &&
              indexConfig.byCustomField &&
              internalStore.indexes.byCustomField
            ) {
              const field = keys[0]
              const fieldMap = internalStore.indexes.byCustomField.get(field!)

              if (fieldMap) {
                const fieldValue = String(where[field!])
                const elementsWithFieldValue = fieldMap.get(fieldValue) || []

                return (
                  (elementsWithFieldValue.find(
                    (e: any) => e.type === component_type,
                  ) as Extract<
                    AnyCircuitElement,
                    { type: typeof component_type }
                  >) || null
                )
              }
            }

            // If we're looking by subcircuit_id and it's indexed
            if (
              "subcircuit_id" in where &&
              indexConfig.bySubcircuit &&
              internalStore.indexes.bySubcircuit
            ) {
              const subcircuitId = where.subcircuit_id
              const subcircuitElements =
                internalStore.indexes.bySubcircuit.get(subcircuitId) || []

              return (
                (subcircuitElements.find(
                  (e: any) =>
                    e.type === component_type &&
                    keys.every((key) => e[key] === where[key]),
                ) as Extract<
                  AnyCircuitElement,
                  { type: typeof component_type }
                >) || null
              )
            }

            // Use type index if available to reduce search space
            if (indexConfig.byType && internalStore.indexes.byType) {
              const elementsOfType =
                internalStore.indexes.byType.get(component_type) || []

              return (
                (elementsOfType.find((e: any) =>
                  keys.every((key) => e[key] === where[key]),
                ) as Extract<
                  AnyCircuitElement,
                  { type: typeof component_type }
                >) || null
              )
            }

            // Fallback to regular approach
            return (
              (soup.find(
                (e: any) =>
                  e.type === component_type &&
                  keys.every((key) => e[key] === where[key]),
              ) as Extract<
                AnyCircuitElement,
                { type: typeof component_type }
              >) || null
            )
          },

          list: (where?: any) => {
            const indexConfig = options.indexConfig || {}
            const keys = !where ? [] : Object.keys(where)

            // If no filters, just return all elements of this type using the type index
            if (
              keys.length === 0 &&
              indexConfig.byType &&
              internalStore.indexes.byType
            ) {
              return (internalStore.indexes.byType.get(component_type) ||
                []) as Extract<
                AnyCircuitElement,
                { type: typeof component_type }
              >[]
            }

            // If filtering by subcircuit_id and it's the only filter
            if (
              keys.length === 1 &&
              keys[0] === "subcircuit_id" &&
              indexConfig.bySubcircuit &&
              internalStore.indexes.bySubcircuit
            ) {
              const subcircuitId = where.subcircuit_id
              const subcircuitElements =
                internalStore.indexes.bySubcircuit.get(subcircuitId) || []

              return subcircuitElements.filter(
                (e: any) => e.type === component_type,
              ) as Extract<AnyCircuitElement, { type: typeof component_type }>[]
            }

            // Start with all elements of this type to reduce search space
            let elementsToFilter: AnyCircuitElement[]

            if (indexConfig.byType && internalStore.indexes.byType) {
              elementsToFilter =
                internalStore.indexes.byType.get(component_type) || []
            } else {
              elementsToFilter = soup.filter((e) => e.type === component_type)
            }

            // Apply remaining filters
            if (keys.length > 0) {
              return elementsToFilter.filter((e: any) =>
                keys.every((key) => e[key] === where[key]),
              ) as Extract<AnyCircuitElement, { type: typeof component_type }>[]
            }

            return elementsToFilter as Extract<
              AnyCircuitElement,
              { type: typeof component_type }
            >[]
          },

          insert: (elm: any) => {
            internalStore.counts[component_type] ??= -1
            internalStore.counts[component_type]++
            const index = internalStore.counts[component_type]
            const newElm = {
              type: component_type,
              [`${component_type}_id`]: `${component_type}_${index}`,
              ...elm,
            }

            if (options.validateInserts) {
              const parser =
                (Soup as any)[component_type] ?? Soup.any_soup_element
              parser.parse(newElm)
            }

            soup.push(newElm)

            // Update indexes with the new element
            const indexConfig = options.indexConfig || {}

            // Update ID index
            if (indexConfig.byId && internalStore.indexes.byId) {
              const idKey = createIdKey(newElm)
              internalStore.indexes.byId.set(idKey, newElm)
            }

            // Update type index
            if (indexConfig.byType && internalStore.indexes.byType) {
              const elementsOfType =
                internalStore.indexes.byType.get(component_type) || []
              elementsOfType.push(newElm)
              internalStore.indexes.byType.set(component_type, elementsOfType)
            }

            // Update relation index
            if (indexConfig.byRelation && internalStore.indexes.byRelation) {
              const elementEntries = Object.entries(newElm)
              for (const [key, value] of elementEntries) {
                if (
                  key.endsWith("_id") &&
                  key !== `${newElm.type}_id` &&
                  typeof value === "string"
                ) {
                  const relationTypeMap =
                    internalStore.indexes.byRelation.get(key) || new Map()
                  const relatedElements =
                    relationTypeMap.get(value as string) || []
                  relatedElements.push(newElm)
                  relationTypeMap.set(value as string, relatedElements)
                  internalStore.indexes.byRelation.set(key, relationTypeMap)
                }
              }
            }

            // Update subcircuit index
            if (
              indexConfig.bySubcircuit &&
              internalStore.indexes.bySubcircuit &&
              "subcircuit_id" in newElm
            ) {
              const subcircuitId = (newElm as any).subcircuit_id
              if (subcircuitId && typeof subcircuitId === "string") {
                const subcircuitElements =
                  internalStore.indexes.bySubcircuit.get(subcircuitId) || []
                subcircuitElements.push(newElm)
                internalStore.indexes.bySubcircuit.set(
                  subcircuitId,
                  subcircuitElements,
                )
              }
            }

            // Update custom field indexes
            if (
              indexConfig.byCustomField &&
              internalStore.indexes.byCustomField
            ) {
              for (const field of indexConfig.byCustomField) {
                if (field in newElm) {
                  const fieldValue = (newElm as any)[field]
                  if (
                    fieldValue !== undefined &&
                    (typeof fieldValue === "string" ||
                      typeof fieldValue === "number")
                  ) {
                    const fieldValueStr = String(fieldValue)
                    const fieldMap =
                      internalStore.indexes.byCustomField.get(field)!
                    const elementsWithFieldValue =
                      fieldMap.get(fieldValueStr) || []
                    elementsWithFieldValue.push(newElm)
                    fieldMap.set(fieldValueStr, elementsWithFieldValue)
                  }
                }
              }
            }

            return newElm
          },

          delete: (id: string) => {
            const indexConfig = options.indexConfig || {}
            let elm: AnyCircuitElement | undefined

            // Find the element to delete
            if (indexConfig.byId && internalStore.indexes.byId) {
              elm = internalStore.indexes.byId.get(`${component_type}:${id}`)
            } else if (indexConfig.byType && internalStore.indexes.byType) {
              const elementsOfType =
                internalStore.indexes.byType.get(component_type) || []
              elm = elementsOfType.find(
                (e: any) => e[`${component_type}_id`] === id,
              )
            } else {
              elm = soup.find((e) => (e as any)[`${component_type}_id`] === id)
            }

            if (!elm) return

            // Remove from array
            const elmIndex = soup.indexOf(elm)
            if (elmIndex >= 0) {
              soup.splice(elmIndex, 1)
            }

            // Remove from indexes
            if (indexConfig.byId && internalStore.indexes.byId) {
              const idKey = createIdKey(elm)
              internalStore.indexes.byId.delete(idKey)
            }

            if (indexConfig.byType && internalStore.indexes.byType) {
              const elementsOfType =
                internalStore.indexes.byType.get(component_type) || []
              const filteredElements = elementsOfType.filter(
                (e: any) => e[`${component_type}_id`] !== id,
              )
              internalStore.indexes.byType.set(component_type, filteredElements)
            }

            if (indexConfig.byRelation && internalStore.indexes.byRelation) {
              // This is more complex - we need to find and remove from all relation maps
              // where this element appears
              for (const [
                relationKey,
                relationMap,
              ] of internalStore.indexes.byRelation.entries()) {
                for (const [relationValue, elements] of relationMap.entries()) {
                  const updatedElements = elements.filter((e) => e !== elm)

                  if (updatedElements.length === 0) {
                    relationMap.delete(relationValue)
                  } else {
                    relationMap.set(relationValue, updatedElements)
                  }
                }
              }
            }

            if (
              indexConfig.bySubcircuit &&
              internalStore.indexes.bySubcircuit &&
              "subcircuit_id" in elm
            ) {
              const subcircuitId = (elm as any).subcircuit_id
              if (subcircuitId) {
                const subcircuitElements =
                  internalStore.indexes.bySubcircuit.get(subcircuitId) || []
                const updatedElements = subcircuitElements.filter(
                  (e) => e !== elm,
                )

                if (updatedElements.length === 0) {
                  internalStore.indexes.bySubcircuit.delete(subcircuitId)
                } else {
                  internalStore.indexes.bySubcircuit.set(
                    subcircuitId,
                    updatedElements,
                  )
                }
              }
            }

            if (
              indexConfig.byCustomField &&
              internalStore.indexes.byCustomField
            ) {
              for (const fieldMap of internalStore.indexes.byCustomField.values()) {
                for (const [fieldValue, elements] of fieldMap.entries()) {
                  const updatedElements = elements.filter((e) => e !== elm)

                  if (updatedElements.length === 0) {
                    fieldMap.delete(fieldValue)
                  } else {
                    fieldMap.set(fieldValue, updatedElements)
                  }
                }
              }
            }
          },

          update: (id: string, newProps: any) => {
            const indexConfig = options.indexConfig || {}
            let elm: AnyCircuitElement | undefined | null

            // Find the element to update
            if (indexConfig.byId && internalStore.indexes.byId) {
              elm = internalStore.indexes.byId.get(`${component_type}:${id}`)
            } else if (indexConfig.byType && internalStore.indexes.byType) {
              const elementsOfType =
                internalStore.indexes.byType.get(component_type) || []
              elm = elementsOfType.find(
                (e: any) => e[`${component_type}_id`] === id,
              )
            } else {
              elm = soup.find(
                (e) =>
                  e.type === component_type &&
                  (e as any)[`${component_type}_id`] === id,
              )
            }

            if (!elm) return null

            // Need to remove from indexes before updating
            if (indexConfig.byRelation && internalStore.indexes.byRelation) {
              // Remove from relation indexes
              const elementEntries = Object.entries(elm)
              for (const [key, value] of elementEntries) {
                if (
                  key.endsWith("_id") &&
                  key !== `${elm.type}_id` &&
                  typeof value === "string"
                ) {
                  if (key in newProps && newProps[key] !== value) {
                    const relationTypeMap =
                      internalStore.indexes.byRelation.get(key)
                    if (relationTypeMap) {
                      const relatedElements =
                        relationTypeMap.get(value as string) || []
                      const updatedElements = relatedElements.filter(
                        (e) => e !== elm,
                      )

                      if (updatedElements.length === 0) {
                        relationTypeMap.delete(value as string)
                      } else {
                        relationTypeMap.set(value as string, updatedElements)
                      }
                    }
                  }
                }
              }
            }

            if (
              indexConfig.bySubcircuit &&
              internalStore.indexes.bySubcircuit &&
              "subcircuit_id" in elm &&
              "subcircuit_id" in newProps
            ) {
              const oldSubcircuitId = (elm as any).subcircuit_id
              const newSubcircuitId = newProps.subcircuit_id

              if (oldSubcircuitId !== newSubcircuitId) {
                // Remove from old subcircuit index
                const subcircuitElements =
                  internalStore.indexes.bySubcircuit.get(oldSubcircuitId) || []
                const updatedElements = subcircuitElements.filter(
                  (e) => e !== elm,
                )

                if (updatedElements.length === 0) {
                  internalStore.indexes.bySubcircuit.delete(oldSubcircuitId)
                } else {
                  internalStore.indexes.bySubcircuit.set(
                    oldSubcircuitId,
                    updatedElements,
                  )
                }
              }
            }

            if (
              indexConfig.byCustomField &&
              internalStore.indexes.byCustomField
            ) {
              for (const field of indexConfig.byCustomField) {
                if (
                  field in elm &&
                  field in newProps &&
                  (elm as any)[field] !== newProps[field]
                ) {
                  const fieldMap =
                    internalStore.indexes.byCustomField.get(field)
                  if (fieldMap) {
                    const oldValue = String((elm as any)[field])
                    const elements = fieldMap.get(oldValue) || []
                    const updatedElements = elements.filter((e) => e !== elm)

                    if (updatedElements.length === 0) {
                      fieldMap.delete(oldValue)
                    } else {
                      fieldMap.set(oldValue, updatedElements)
                    }
                  }
                }
              }
            }

            // Update the element
            Object.assign(elm, newProps)

            // Add to indexes with updated values
            if (indexConfig.byRelation && internalStore.indexes.byRelation) {
              const elementEntries = Object.entries(elm)
              for (const [key, value] of elementEntries) {
                if (
                  key.endsWith("_id") &&
                  key !== `${elm.type}_id` &&
                  typeof value === "string"
                ) {
                  if (key in newProps) {
                    const relationTypeMap: any =
                      internalStore.indexes.byRelation.get(key) || new Map()
                    const relatedElements: any =
                      relationTypeMap.get(value as string) || []

                    if (!relatedElements.includes(elm)) {
                      relatedElements.push(elm)
                      relationTypeMap.set(value as string, relatedElements)
                      internalStore.indexes.byRelation.set(key, relationTypeMap)
                    }
                  }
                }
              }
            }

            if (
              indexConfig.bySubcircuit &&
              internalStore.indexes.bySubcircuit &&
              "subcircuit_id" in elm &&
              "subcircuit_id" in newProps
            ) {
              const subcircuitId = (elm as any).subcircuit_id
              if (subcircuitId && typeof subcircuitId === "string") {
                const subcircuitElements =
                  internalStore.indexes.bySubcircuit.get(subcircuitId) || []

                if (!subcircuitElements.includes(elm)) {
                  subcircuitElements.push(elm)
                  internalStore.indexes.bySubcircuit.set(
                    subcircuitId,
                    subcircuitElements,
                  )
                }
              }
            }

            if (
              indexConfig.byCustomField &&
              internalStore.indexes.byCustomField
            ) {
              for (const field of indexConfig.byCustomField) {
                if (field in elm && field in newProps) {
                  const fieldValue: any = (elm as any)[field]
                  if (
                    fieldValue !== undefined &&
                    (typeof fieldValue === "string" ||
                      typeof fieldValue === "number")
                  ) {
                    const fieldValueStr = String(fieldValue)
                    const fieldMap =
                      internalStore.indexes.byCustomField.get(field)!
                    const elementsWithFieldValue =
                      fieldMap.get(fieldValueStr) || []

                    if (!elementsWithFieldValue.includes(elm)) {
                      elementsWithFieldValue.push(elm)
                      fieldMap.set(fieldValueStr, elementsWithFieldValue)
                    }
                  }
                }
              }
            }

            return elm as Extract<
              AnyCircuitElement,
              { type: typeof component_type }
            >
          },

          select: (selector: string) => {
            // Selection by selector is specialized enough that we don't use indexes here
            // TODO when applySelector is isolated we can use it, until then we
            // do a poor man's selector implementation for two common cases
            if (component_type === "source_component") {
              return (
                (soup.find(
                  (e) =>
                    e.type === "source_component" &&
                    e.name === selector.replace(/\./g, ""),
                ) as Extract<
                  AnyCircuitElement,
                  { type: typeof component_type }
                >) || null
              )
            } else if (
              component_type === "pcb_port" ||
              component_type === "source_port" ||
              component_type === "schematic_port"
            ) {
              const [component_name, port_selector] = selector
                .replace(/\./g, "")
                .split(/[\s\>]+/)
              const source_component = soup.find(
                (e) =>
                  e.type === "source_component" && e.name === component_name,
              ) as SourceComponentBase
              if (!source_component) return null
              const source_port = soup.find(
                (e) =>
                  e.type === "source_port" &&
                  e.source_component_id ===
                    source_component.source_component_id &&
                  (e.name === port_selector ||
                    (e.port_hints ?? []).includes(port_selector!)),
              ) as SourcePort
              if (!source_port) return null
              if (component_type === "source_port")
                return source_port as Extract<
                  AnyCircuitElement,
                  { type: typeof component_type }
                >

              if (component_type === "pcb_port") {
                return (
                  (soup.find(
                    (e) =>
                      e.type === "pcb_port" &&
                      e.source_port_id === source_port.source_port_id,
                  ) as Extract<
                    AnyCircuitElement,
                    { type: typeof component_type }
                  >) || null
                )
              } else if (component_type === "schematic_port") {
                return (
                  (soup.find(
                    (e) =>
                      e.type === "schematic_port" &&
                      e.source_port_id === source_port.source_port_id,
                  ) as Extract<
                    AnyCircuitElement,
                    { type: typeof component_type }
                  >) || null
                )
              }
            }

            return null
          },
        }
      },
    },
  )

  return suIndexed
}) as any

cjuIndexed.unparsed = cjuIndexed as any

export default cjuIndexed
