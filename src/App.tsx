import { useMemo } from "react"
import { DataTable } from "./components/table/DataTable"
import { Button } from "./components/ui/button"
import { useUnsavedChanges } from "./hooks/useUnsavedChanges"
import { generateData, columns } from "./data/generateData"

function App() {
  const data = useMemo(() => generateData(100), [])
  const { hasUnsavedChanges, handleDataChange, handleSave } =
    useUnsavedChanges()

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Data Table</h1>

        <div className="mb-4">
          <Button disabled={!hasUnsavedChanges} onClick={handleSave}>
            Save changes
          </Button>
        </div>

        <div className="rounded-md border bg-card">
          <DataTable
            columns={columns}
            data={data}
            onDataChange={handleDataChange}
          />
        </div>

        <div className="mt-4">
          <Button disabled={!hasUnsavedChanges} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
