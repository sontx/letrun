import { useToast } from "@/hooks/use-toast";
import { TaskDef, TaskMetadata } from "@letrun/common";
import { useCallback } from "react";
import { systemTasks } from "./build-system-tasks";

function convertToVariableName(str: string, maxLength = 20) {
  // Remove accents from Vietnamese characters
  const withoutAccents = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Replace non-alphanumeric characters with spaces
  const stringWithSpaces = withoutAccents.replace(/[^a-zA-Z0-9]/g, " ");

  // Convert the string to camel case
  const fullVar = stringWithSpaces
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => {
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    })
    .replace(/\s+/g, "");
  return fullVar.substring(0, maxLength);
}

function buildSampleFromObject(obj: any): any {
  return Object.keys(obj)
    .filter((key) => obj[key]?.flags?.presence === "required")
    .reduce((acc, key) => {
      let value = null;
      switch (obj[key].type) {
        case "object":
          value = buildSampleFromObject(obj[key].keys);
          break;
        case "array":
          value = [];
          break;
        case "number":
          value = 0;
          break;
        case "string":
          value = "";
          break;
        case "boolean":
          value = false;
          break;
      }
      return {
        ...acc,
        [key]: value,
      };
    }, {});
}

export function useCopyTask(task: TaskMetadata, taskHandler: string) {
  const { toast } = useToast();
  return useCallback(() => {
    const input = task.parameters?.keys ?? {};
    const taskSample: TaskDef = {
      name: convertToVariableName(task.name, 50),
      handler: taskHandler,
      parameters: buildSampleFromObject(input),
    };
    
    systemTasks[task.name]?.(taskSample);

    navigator.clipboard.writeText(JSON.stringify(taskSample, null, 2));
    toast({
      title: "Copied task sample",
      description: "Paste the copied task in your configuration file.",
    });
  }, [task.name, task.parameters?.keys, taskHandler, toast]);
}
