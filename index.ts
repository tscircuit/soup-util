import type { AnySoupElement, AnySoupElementInput } from "@tscircuit/builder"

export type SoupUtilObject<T extends AnySoupElement | AnySoupElementInput> = {
  [K in AnySoupElement["type"]]: {
    get: (id: string) => Extract<T, { type: K }> | null
    getWhere: (where: any) => Extract<T, { type: K }> | null
    getUsing: (using: {
      [key: `${string}_id`]: string
    }) => Extract<T, { type: K }> | null
    list: (where: any) => Extract<T, { type: K }>[] | null
  }
}

export type GetSoupUtilObject = <
  T extends AnySoupElement | AnySoupElementInput =
    | AnySoupElement
    | AnySoupElementInput
>(
  soup: T[]
) => SoupUtilObject<
  T extends AnySoupElement
    ? AnySoupElement
    : AnySoupElement | AnySoupElementInput
>

export const su: GetSoupUtilObject = (soup) => {
  const su = new Proxy(
    {},
    {
      get: (proxy_target: any, component_type: string) => {
        return {
          get: (id: string) =>
            soup.find(
              (e: any) =>
                e.type === component_type && e[`${component_type}_id`] === id
            ),
          getUsing: (using: any) => {
            const keys = Object.keys(using)
            if (keys.length !== 1) {
              throw new Error(
                "getUsing requires exactly one key, e.g. { pcb_component_id }"
              )
            }
            const join_key = keys[0] as string
            const join_type = join_key.replace("_id", "")
            const joiner: any = soup.find(
              (e: any) =>
                e.type === join_type && e[join_key] === using[join_key]
            )
            if (!joiner) return null
            return soup.find(
              (e: any) =>
                e.type === component_type &&
                e[`${component_type}_id`] === joiner[`${component_type}_id`]
            )
          },
          getWhere: (where: any) => {
            const keys = Object.keys(where)
            return soup.find(
              (e: any) =>
                e.type === component_type &&
                keys.every((key) => e[key] === where[key])
            )
          },
          list: (where: any) => {
            const keys = Object.keys(where)
            return soup.filter(
              (e: any) =>
                e.type === component_type &&
                keys.every((key) => e[key] === where[key])
            )
          },
        }
      },
    }
  )

  return su
}

export default su
