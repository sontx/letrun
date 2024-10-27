import { TaskMetadata } from "@letrun/common";
import { TaskIcon } from "./task-icon";
import { Badge } from "../ui/badge";

function snakeToTitleCase(str: string) {
  return str
    .split(/[_-]/)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function camelToTitleCase(str: string) {
  return str
    .split(/(?=[A-Z])/)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function TaskHeader({ task }: { task: TaskMetadata }) {
  return (
    <div className="flex gap-3 items-center">
      <TaskIcon iconUrl={task.icon} className="w-[1em] h-[1em]" />
      <span>
        {camelToTitleCase(snakeToTitleCase(task.name))}
        {task.version && (
          <Badge variant="secondary" className="ml-1 text-muted-foreground">
            v{task.version}
          </Badge>
        )}
      </span>
    </div>
  );
}
