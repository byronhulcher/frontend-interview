import { useMemo } from "react"
import { DataTable } from "./components/table/DataTable"
import { SaveButton } from "./components/SaveButton"
import { useUnsavedChanges } from "./hooks/useUnsavedChanges"
import { generateData, columns } from "./data/generateData"

function App() {
  const initialData = useMemo(() => generateData(100), [])
  const { unsavedChangesCount, handleDataChange, handleSave, data, dataMap } =
    useUnsavedChanges(initialData)

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Data Table</h1>

        <div className="mb-4">
          <SaveButton
            unsavedChangesCount={unsavedChangesCount}
            handleSave={handleSave}
          />
        </div>

        <div className="rounded-md border bg-card">
          <DataTable
            columns={columns}
            data={data}
            dataMap={dataMap}
            onDataChange={handleDataChange}
          />
        </div>

        <div className="mt-4">
          <SaveButton
            unsavedChangesCount={unsavedChangesCount}
            handleSave={handleSave}
          />
        </div>
      </div>
    </div>
  )
}

export default App
