import type Joi from "joi";
import { ReactNode } from "react";
import { SchemaTable } from "../schema-table";
import { cn } from "@/lib/utils";

export function TaskSchema({
  schema,
  empty,
  icon,
  title,
  className,
}: {
  schema?: Joi.Description | null;
  empty: string;
  icon: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <>
      <div
        className={cn("font-[500] mb-1.5 flex gap-2 items-center", className)}
      >
        {icon} {title}
      </div>
      {schema ? (
        <SchemaTable schema={schema} className="border" />
      ) : (
        <p className="text-muted-foreground text-center pb-2">{empty}</p>
      )}
    </>
  );
}
