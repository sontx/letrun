import { cn } from "@/lib/utils";
import { UploadIcon } from "lucide-react";
import { useCallback } from "react";
import Dropzone from "react-dropzone";

export function SchemaSelector({
  onSelect,
}: {
  onSelect: (schema: any) => void;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const schema = JSON.parse(reader.result as string);
          onSelect(schema);
        };
        reader.readAsText(acceptedFiles[0]);
      } catch (error) {
        console.error("Failed to parse schema", error);
      }
    },
    [onSelect]
  );

  return (
    <Dropzone
      onDrop={onDrop}
      accept={{
        "application/json": [".json"],
      }}
      maxFiles={1}
      multiple={false}
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div
          {...getRootProps()}
          className={cn(
            "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isDragActive && "border-muted-foreground/50"
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
              <div className="rounded-full border border-dashed p-3">
                <UploadIcon
                  className="size-7 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="font-medium text-muted-foreground">
                Drop the files here
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
              <div className="rounded-full border border-dashed p-3">
                <UploadIcon
                  className="size-7 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col gap-px">
                <p className="font-medium text-muted-foreground">
                  Drag {`'n'`} drop schema file here, or click to select file
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Dropzone>
  );
}
