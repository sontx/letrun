import { TaskMetadata } from "@letrun/common";
import { TaskHandler } from "./task-handler";
import { TaskSchema } from "./task-schema";
import { FileInput, FileOutput } from "lucide-react";
import { Button } from "../ui/button";
import { useCopyTask } from "./useCopyTask";

export function TaskDetails({
  task,
  type,
  groupName,
}: {
  task: TaskMetadata;
  type?: string;
  groupName: string;
}) {
  const handler =
    (type === "package" ? `package:${groupName}:` : "") + task.name;
  const copyTask = useCopyTask(task, handler);

  return (
    <div className="ml-[24px]">
      {task.description && (
        <p className="text-muted-foreground mb-4">{task.description}</p>
      )}
      {(type === "package" || !type) && <TaskHandler handler={handler} />}
      <TaskSchema
        schema={task.parameters}
        empty="No input parameters ¯\_(ツ)_/¯"
        icon={<FileInput className="w-[1em] h-[1em]" />}
        title="Input parameters"
      />
      <TaskSchema
        schema={task.output}
        empty="No output parameters ¯\_(ツ)_/¯"
        icon={<FileOutput className="w-[1em] h-[1em]" />}
        title="Output parameters"
        className="mt-4"
      />

      <div className="pb-3 pt-4">
        <Button size="sm" onClick={copyTask}>
          Copy task
        </Button>
      </div>
    </div>
  );
}
