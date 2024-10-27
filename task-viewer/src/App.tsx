import "./App.css";

import { SchemaTable } from "@/components/schema-table";
import { useUrlJsonSchema } from "./hooks/useUrlJsonSchema";
import { SchemaSelector } from "./components/schema-selector";
import { useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { TaskGroup } from "./components/task-group";
import { Toaster } from "@/components/ui/toaster";
import { TaskGroupMetadata } from "@letrun/common";
import { useUrlAppName } from "@/hooks/useUrlAppName.ts";

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
  const appName = useUrlAppName();
  const [fileSchema, setFileSchema] = useState();

  return (
    <HelmetProvider>
      <Helmet>
        <title>{appName} - Task Viewer</title>
      </Helmet>
      {urlSchema || fileSchema ? (
        <SchemaSwitcher schema={urlSchema || fileSchema} />
      ) : (
        <SchemaSelector onSelect={setFileSchema} />
      )}
      <Toaster />
    </HelmetProvider>
  );
}

export default App;
