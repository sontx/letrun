import type { Description } from "joi";
import { useMemo } from "react";

interface JsonSchema {
  required?: boolean;
  min?: string;
  max?: string;
  availableValues?: string[];
  description?: string;
  notes?: string[];
  type?: string;
  defaultValue?: any;
  oneOf?: JsonSchema[];
  allowUnknown?: boolean;
}

function getArrayType(schema: Description) {
  const schemaItems = schema.items as Description[];
  if (schemaItems?.length) {
    const firstItem = schemaItems[0]!;
    if (firstItem.type === "alternatives") {
      return "array";
    }
    return schemaItems.length > 1
      ? `array of ${schemaItems.map((item) => item.type).join(" or ")}`
      : `${schemaItems[0].type}[]`;
  } else {
    return "array";
  }
}

function getMinMax(schema: Description) {
  if (!schema.rules) {
    return {};
  }

  let minValue = "";
  let maxValue = "∞";

  // Check for min and max rules
  const minRule = schema.rules.find((rule: any) => rule.name === "min");
  const maxRule = schema.rules.find((rule: any) => rule.name === "max");
  if (minRule) {
    minValue = minRule.args.limit.toString();
  }
  if (maxRule) {
    maxValue = maxRule.args.limit.toString();
  }

  // Check for greater and less rules for number type
  if (schema.type === "number") {
    const greaterRule = schema.rules.find(
      (rule: any) => rule.name === "greater",
    );
    const lessRule = schema.rules.find((rule: any) => rule.name === "less");
    if (greaterRule) {
      minValue = greaterRule.args.limit.toString();
    }
    if (lessRule) {
      maxValue = lessRule.args.limit.toString();
    }
  }

  // Check for length rule for array type
  if (schema.type === "array") {
    const lengthRule = schema.rules.find((rule: any) => rule.name === "length");
    if (lengthRule) {
      maxValue = lengthRule.args.limit.toString();
    }
  }

  // Return min and max if any rules were found
  if (
    minRule ||
    maxRule ||
    schema.type === "number" ||
    schema.type === "array"
  ) {
    return {
      min: minValue,
      max: maxValue,
    };
  }

  return {};
}

function getRawSchemaFromAlternativesType(schema: Description) {
  const matches = schema.matches as any[];
  return matches?.map((match) => {
    return match.schema;
  });
}

function createJsonSchema(schema: Description) {
  const flags = schema.flags as any;
  const result: JsonSchema = {
    required: flags?.presence === "required",
    defaultValue: flags?.default,
    allowUnknown: flags?.unknown,
    notes: schema.notes,
  };

  // Determine the type and add additional constraints if applicable
  let type = schema.type;
  switch (type) {
    case "alternatives":
      type = "one of";
      result.oneOf = getRawSchemaFromAlternativesType(schema);
      break;
    case "array":
      type = getArrayType(schema);
      const firstItem = (schema.items ?? [])[0] as Description;
      if (firstItem?.type === "alternatives") {
        result.oneOf = getRawSchemaFromAlternativesType(firstItem);
      }
      break;
  }

  const { min, max } = getMinMax(schema);
  result.min = min;
  result.max = max;

  // Determine available values
  result.availableValues = schema.allow;

  // Description, if any
  result.description = flags?.description || "";
  result.type = type;

  return result;
}

export function useJsonSchema(schema: Description) {
  return useMemo(() => {
    return createJsonSchema(schema);
  }, [schema]);
}
