/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import type { TableData } from "@/components/table/types"

// ── Nesting path context ────────────────────────────────────────────────
// Provides a deterministic, hierarchical key for each nested table so that
// snapshots survive Radix Portal unmount/remount cycles.

const NestingPathContext = createContext("")

export function NestingPathProvider({
  segment,
  children,
}: {
  segment: string
  children: ReactNode
}) {
  const parent = useContext(NestingPathContext)
  const path = parent ? `${parent}/${segment}` : segment
  return (
    <NestingPathContext.Provider value={path}>
      {children}
    </NestingPathContext.Provider>
  )
}

export function useNestingPath() {
  return useContext(NestingPathContext)
}

// ── Nested changes tracking ─────────────────────────────────────────────

interface NestedTableEntry {
  currentData: TableData[]
  savedData: TableData[]
}

interface ChangeTrackingContextType {
  registerTable: (
    id: string,
    currentData: TableData[],
    savedData: TableData[],
  ) => void
  getSnapshot: (id: string) => NestedTableEntry | undefined
  clearAllDirtyState: () => void
  totalChangesCount: number
}

export const ChangeTrackingContext =
  createContext<ChangeTrackingContextType | null>(null)

interface ChangeTrackingProviderProps {
  children: ReactNode
}

/**
 * Tracks unsaved changes across the entire table tree (root + all nested popper tables).
 *
 * The root table is registered with id "", and nested tables use hierarchical paths.
 * Entries persist so the change count survives unmount/remount cycles caused by
 * Radix Portal teardown. A ref (+ a state counter) is used to keep
 * the context value referentially stable across nested-table keystrokes.
 */
export function ChangeTrackingProvider({
  children,
}: ChangeTrackingProviderProps) {
  // We store entries in a ref to keep registerNestedTable referentially stable.
  // A separate revision counter triggers the nestedChangesCount recomputation.
  const entriesRef = useRef<Record<string, NestedTableEntry>>({})
  const [revision, setRevision] = useRevision()

  const registerTable = useCallback(
    (id: string, currentData: TableData[], savedData: TableData[]) => {
      entriesRef.current[id] = { currentData, savedData }
      setRevision()
    },
    [setRevision],
  )

  const getSnapshot = useCallback(
    (id: string) => {
      // `revision` is in the dep list so a new function identity is created
      // after clearAllDirtyState, which causes downstream useMemo/useEffect
      // deps that depend on the snapshot to re-evaluate.
      void revision
      return entriesRef.current[id]
    },
    [revision],
  )

  const clearAllDirtyState = useCallback(() => {
    // Replace each entry with a new object so that getSnapshot consumers
    // see fresh references after the revision bump.
    const entries = entriesRef.current
    Object.keys(entries).forEach((id) => {
      entries[id] = {
        currentData: entries[id].currentData,
        savedData: structuredClone(entries[id].currentData),
      }
    })
    setRevision()
  }, [setRevision])

  const totalChangesCount = useMemo(() => {
    // `revision` is in the dep list solely to trigger recomputation.
    void revision
    let count = 0
    Object.values(entriesRef.current).forEach(({ currentData, savedData }) => {
      const dataMap = new Map(savedData.map((row) => [row.id, row]))

      currentData.forEach((row) => {
        const savedRow = dataMap.get(row.id)
        if (savedRow) {
          Object.keys(row).forEach((key) => {
            if (JSON.stringify(row[key]) !== JSON.stringify(savedRow[key])) {
              count++
            }
          })
        }
      })

      count += Math.max(0, savedData.length - currentData.length)
    })
    return count
  }, [revision])

  const value = useMemo(
    () => ({
      registerTable,
      getSnapshot,
      clearAllDirtyState,
      totalChangesCount,
    }),
    [registerTable, getSnapshot, clearAllDirtyState, totalChangesCount],
  )

  return (
    <ChangeTrackingContext.Provider value={value}>
      {children}
    </ChangeTrackingContext.Provider>
  )
}

// Tiny helper — returns a stable setter that bumps revision.
function useRevision() {
  const [rev, setRev] = useState(0)
  const bump = useCallback(() => setRev((r) => r + 1), [])
  return [rev, bump] as const
}
