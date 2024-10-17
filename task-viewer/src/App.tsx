import "./App.css";

import { SchemaTable } from "@/components/schema-table";
import { useUrlJsonSchema } from "./hooks/useUrlJsonSchema";
import { SchemaSelector } from "./components/schema-selector";
import { useState } from "react";
import { TaskGroup } from "./components/task-group";
import { Toaster } from "@/components/ui/toaster";
import { TaskGroupMetadata } from "@letrun/common";

function isGroupMetadata(arg: any): arg is TaskGroupMetadata {
  return !!arg?.tasks;
}

function SchemaSwitcher({ schema }: { schema: any }) {
  if (isGroupMetadata(schema)) {
    return <TaskGroup meta={schema} />;
  }
  return <SchemaTable schema={schema} />;
}

function App() {
  const urlSchema = useUrlJsonSchema();
  const [fileSchema, setFileSchema] = useState();

  return (
    <>
      {urlSchema || fileSchema ? (
        <SchemaSwitcher schema={urlSchema || fileSchema} />
      ) : (
        <SchemaSelector onSelect={setFileSchema} />
      )}
      <Toaster />
    </>
  );
}

export default App;
