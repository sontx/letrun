import { useJsonSchema } from "@/hooks/useJsonSchema.ts";
import type { Description } from "joi";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SchemaTable } from "../schema-table";
import { cn } from "@/lib/utils";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useExpandable } from "./useExpandable";

function ValueItem({ value, secondary }: { value: any; secondary?: boolean }) {
  return (
    <Badge
      variant={secondary ? "secondary" : "outline"}
      className={cn({
        italic: value === null || value === "",
        "text-muted-foreground": secondary,
      })}
    >
      {value === null
        ? "<null>"
        : value === ""
          ? "<empty>"
          : typeof value === "boolean"
            ? value.toString()
            : value}
    </Badge>
  );
}

function ItemType({
  expandable,
  expand,
  schema,
}: {
  expandable?: boolean;
  expand?: boolean;
  schema: Description;
}) {
  const { type, min, max } = useJsonSchema(schema);
  const minMax = [min && `min: ${min}`, max && `max: ${max}`]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <code className="text-orange-700">{type}</code>
      {minMax && <span className="ml-1 text-muted-foreground">({minMax})</span>}
      {expandable &&
        (expand ? (
          <ChevronsDownUp className="w-[16px] h-[16px] absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
        ) : (
          <ChevronsUpDown className="w-[16px] h-[16px] absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
        ))}
    </>
  );
}

function DefaultItems({ schema }: { schema: Description }) {
  const { availableValues, defaultValue } = useJsonSchema(schema);

  return (
    (availableValues?.length || defaultValue !== undefined) && (
      <div className="flex gap-1 flex-wrap">
        {availableValues?.map((value, index) => (
          <ValueItem key={index} value={value} secondary />
        ))}
        {defaultValue !== undefined && <ValueItem value={defaultValue} />}
      </div>
    )
  );
}

function Notes({ notes }: { notes: string[] }) {
  return (
    <div className="mt-2">
      {notes.map((note, index) => (
        <blockquote
          key={index}
          className="text-sm text-muted-foreground p-2 border-s-4 border-gray-300 dark:border-gray-500"
        >
          {note}
        </blockquote>
      ))}
    </div>
  );
}

export function SchemaTableRow({
  schema,
  fieldName,
  className,
  columnCount,
}: {
  schema: Description;
  fieldName?: string;
  className?: string;
  columnCount: number;
}) {
  const { required, type, description, oneOf, notes } = useJsonSchema(schema);
  const { expand, expandable, toggleExpand } = useExpandable(schema);

  return (
    <>
      <TableRow
        onClick={toggleExpand}
        className={cn({ "cursor-pointer": expandable }, className)}
      >
        {columnCount >= 4 && (
          <TableCell align="left">
            {fieldName}
            {required && <span className="text-red-600 ml-1">*</span>}
          </TableCell>
        )}
        <TableCell align="left" className="relative">
          <ItemType schema={schema} expand={expand} expandable={expandable} />
        </TableCell>
        <TableCell align="left">
          {description}
          {notes?.length && expand && <Notes notes={notes} />}
        </TableCell>
        <TableCell align="left">
          <DefaultItems schema={schema} />
        </TableCell>
      </TableRow>
      {expandable &&
        expand &&
        oneOf?.map((schema, index) => (
          <SchemaTableRow
            key={index}
            schema={schema}
            className="bg-slate-50"
            columnCount={columnCount}
          />
        ))}
      {expandable && type === "object" && expand && (
        <TableRow className="bg-slate-50">
          {Object.keys(schema.keys ?? {}).length > 0 ? (
            <>
              {columnCount >= 4 && <TableCell />}
              <TableCell align="left" className="pl-0" colSpan={3}>
                <SchemaTable schema={schema} />
              </TableCell>
            </>
          ) : (
            <TableCell colSpan={4}>Anything ¯\_(ツ)_/¯</TableCell>
          )}
        </TableRow>
      )}
    </>
  );
}
