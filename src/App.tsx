import { useMemo } from "react";
import { DataTable } from "./components/table/DataTable";
import { NestedDataStoreProvider } from "./data/nestedDataStore/NestedDataStoreProvider";
import { generateData, columns } from "./data/generateData";

function App() {
  const data = useMemo(() => generateData(100), []);

  return (
    <NestedDataStoreProvider>
      <div className="min-h-screen p-8 bg-background text-foreground">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Data Table</h1>
          <div className="rounded-md border bg-card">
            <DataTable columns={columns} data={data} />
          </div>
        </div>
      </div>
    </NestedDataStoreProvider>
  );
}

export default App;
