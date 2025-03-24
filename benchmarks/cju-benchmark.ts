import type { AnyCircuitElement } from "circuit-json"
import { performance } from "node:perf_hooks"
import { cju } from "../index"
import { cjuIndexed } from "../lib/cju-indexed"

/**
 * Generates a test soup with the specified number of elements of various types
 */
function generateTestSoup(elementCount: number): AnyCircuitElement[] {
  const soup: AnyCircuitElement[] = []

  // Generate source components
  const componentCount = Math.floor(elementCount * 0.2) // 20% of elements are components
  for (let i = 0; i < componentCount; i++) {
    soup.push({
      type: "source_component",
      source_component_id: `source_component_${i}`,
      name: `C${i}`,
      supplier_part_numbers: {},
      ftype: i % 2 === 0 ? "simple_resistor" : "capacitor",
      resistance: i % 2 === 0 ? 10_000 : undefined,
      capacitance: i % 2 === 0 ? undefined : 0.0001,
      subcircuit_id: `sub_${Math.floor(i / 10)}`,
    } as AnyCircuitElement)
  }

  // Generate source ports (3 for each component)
  for (let i = 0; i < componentCount; i++) {
    for (let j = 0; j < 3; j++) {
      const portId = i * 3 + j
      soup.push({
        type: "source_port",
        source_port_id: `source_port_${portId}`,
        source_component_id: `source_component_${i}`,
        name: j === 0 ? "left" : j === 1 ? "right" : "bottom",
        port_hints: [j === 0 ? "input" : j === 1 ? "output" : "ground"],
        subcircuit_id: `sub_${Math.floor(i / 10)}`,
      } as AnyCircuitElement)
    }
  }

  // Generate pcb_components (one for each source component)
  for (let i = 0; i < componentCount; i++) {
    soup.push({
      type: "pcb_component",
      pcb_component_id: `pcb_component_${i}`,
      source_component_id: `source_component_${i}`,
      x: i * 10,
      y: i * 5,
      width: 10,
      height: 5,
      subcircuit_id: `sub_${Math.floor(i / 10)}`,
    } as AnyCircuitElement)
  }

  // Generate pcb_ports (one for each source port)
  for (let i = 0; i < componentCount; i++) {
    for (let j = 0; j < 3; j++) {
      const portId = i * 3 + j
      soup.push({
        type: "pcb_port",
        pcb_port_id: `pcb_port_${portId}`,
        source_port_id: `source_port_${portId}`,
        x: i * 10 + (j === 0 ? 0 : j === 1 ? 10 : 5),
        y: i * 5 + (j === 0 ? 2.5 : j === 1 ? 2.5 : 5),
        subcircuit_id: `sub_${Math.floor(i / 10)}`,
      } as AnyCircuitElement)
    }
  }

  // Generate pcb_traces (connections between components)
  const traceCount = Math.floor(elementCount * 0.2) // 20% of elements are traces
  for (let i = 0; i < traceCount; i++) {
    const startComponentIdx = i % componentCount
    const endComponentIdx = (i + 1) % componentCount

    soup.push({
      type: "pcb_trace",
      pcb_trace_id: `pcb_trace_${i}`,
      start_pcb_port_id: `pcb_port_${startComponentIdx * 3 + 1}`, // Connect to "right" port
      end_pcb_port_id: `pcb_port_${endComponentIdx * 3}`, // Connect to "left" port
      width: 0.2,
      layer: "F.Cu",
      subcircuit_id: `sub_${Math.floor(i / 10)}`,
    } as AnyCircuitElement)
  }

  return soup
}

/**
 * Runs benchmarks and returns timing results
 */
function runBenchmarks(soupSize: number) {
  console.log(`\nRunning benchmark with ${soupSize} elements`)
  console.log("-".repeat(40))

  // Generate test soup
  const soup = generateTestSoup(soupSize)
  console.log(`Generated soup with ${soup.length} elements`)

  // Create both utility instances
  const regularSu = cju(soup)
  const indexedSu = cjuIndexed(soup, {
    indexConfig: {
      byId: true,
      byType: true,
      byRelation: true,
      bySubcircuit: true,
      byCustomField: ["name", "ftype"],
    },
  })

  const results: Record<
    string,
    { regular: number; indexed: number; speedup: number }
  > = {}

  // Benchmark 1: Get element by ID
  {
    const start1 = performance.now()
    for (let i = 0; i < 1000; i++) {
      const id = `source_component_${i % 50}`
      regularSu.source_component.get(id)
    }
    const end1 = performance.now()

    const start2 = performance.now()
    for (let i = 0; i < 1000; i++) {
      const id = `source_component_${i % 50}`
      indexedSu.source_component.get(id)
    }
    const end2 = performance.now()

    results["Get by ID"] = {
      regular: end1 - start1,
      indexed: end2 - start2,
      speedup: (end1 - start1) / (end2 - start2),
    }
  }

  // Benchmark 2: List elements by type
  {
    const start1 = performance.now()
    for (let i = 0; i < 100; i++) {
      regularSu.source_component.list()
    }
    const end1 = performance.now()

    const start2 = performance.now()
    for (let i = 0; i < 100; i++) {
      indexedSu.source_component.list()
    }
    const end2 = performance.now()

    results["List by type"] = {
      regular: end1 - start1,
      indexed: end2 - start2,
      speedup: (end1 - start1) / (end2 - start2),
    }
  }

  // Benchmark 3: Get using relation
  {
    const start1 = performance.now()
    for (let i = 0; i < 500; i++) {
      const id = `source_component_${i % 50}`
      regularSu.pcb_component.getUsing({ source_component_id: id })
    }
    const end1 = performance.now()

    const start2 = performance.now()
    for (let i = 0; i < 500; i++) {
      const id = `source_component_${i % 50}`
      indexedSu.pcb_component.getUsing({ source_component_id: id })
    }
    const end2 = performance.now()

    results["Get using relation"] = {
      regular: end1 - start1,
      indexed: end2 - start2,
      speedup: (end1 - start1) / (end2 - start2),
    }
  }

  // Benchmark 4: Get where (field matching)
  {
    const start1 = performance.now()
    for (let i = 0; i < 500; i++) {
      const name = `C${i % 50}`
      regularSu.source_component.getWhere({ name })
    }
    const end1 = performance.now()

    const start2 = performance.now()
    for (let i = 0; i < 500; i++) {
      const name = `C${i % 50}`
      indexedSu.source_component.getWhere({ name })
    }
    const end2 = performance.now()

    results["Get where (field)"] = {
      regular: end1 - start1,
      indexed: end2 - start2,
      speedup: (end1 - start1) / (end2 - start2),
    }
  }

  // Benchmark 5: List by subcircuit
  {
    const start1 = performance.now()
    for (let i = 0; i < 100; i++) {
      const subcircuitId = `sub_${i % 10}`
      regularSu.pcb_component.list({ subcircuit_id: subcircuitId })
    }
    const end1 = performance.now()

    const start2 = performance.now()
    for (let i = 0; i < 100; i++) {
      const subcircuitId = `sub_${i % 10}`
      indexedSu.pcb_component.list({ subcircuit_id: subcircuitId })
    }
    const end2 = performance.now()

    results["List by subcircuit"] = {
      regular: end1 - start1,
      indexed: end2 - start2,
      speedup: (end1 - start1) / (end2 - start2),
    }
  }

  // Format and display results
  console.log("Operation         | Regular (ms) | Indexed (ms) | Speedup")
  console.log("-".repeat(60))

  for (const [operation, timing] of Object.entries(results)) {
    console.log(
      `${operation.padEnd(18)} | ${timing.regular.toFixed(2).padStart(12)} | ${timing.indexed.toFixed(2).padStart(11)} | ${timing.speedup.toFixed(2)}x`,
    )
  }

  return results
}

// Run benchmarks with different soup sizes
const smallResults = runBenchmarks(100) // ~700 elements (small circuit)
const mediumResults = runBenchmarks(2000)
const largeResults = runBenchmarks(10000)

// Display summary
console.log("\nSummary of speedups across different soup sizes:")
console.log("-".repeat(70))
console.log(
  "Operation         | Small Circuit | Medium Circuit | Large Circuit",
)
console.log("-".repeat(70))

const operations = Object.keys(smallResults)
for (const operation of operations) {
  console.log(
    `${operation.padEnd(18)} | ${smallResults[operation].speedup.toFixed(2).padStart(13)}x | ${mediumResults[operation].speedup.toFixed(2).padStart(14)}x | ${largeResults[operation].speedup.toFixed(2).padStart(13)}x`,
  )
}
