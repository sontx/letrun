import { useJsonSchema } from "@/components/schema-table-row/useJsonSchema";
import type { Description } from "joi";
import { useCallback, useState } from "react";

export function useExpandable(schema: Description) {
  const { type, oneOf, allowUnknown } = useJsonSchema(schema);

  const hasChildrenKeys =
    type === "object" && Object.keys(schema.keys ?? {}).length > 0;
  const hasItems = type === "array" && schema.items;
  const expandable =
    hasChildrenKeys || hasItems || oneOf?.length || allowUnknown;

  const [expand, setExpand] = useState(false);

  const toggleExpand = useCallback(() => {
    setExpand((prev) => !prev);
  }, []);

  return { expand, expandable, toggleExpand };
}
