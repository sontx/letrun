import { TaskGroupMetadata } from "@letrun/common";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { TaskHeader } from "./task-header";
import { TaskDetails } from "./task-details";
import { GroupHeader } from "./group-header";

function TaskList({
  meta,
  className,
}: {
  meta: TaskGroupMetadata;
  className?: string;
}) {
  const tasks = meta.tasks;
  return (
    <Accordion type="single" collapsible className={className}>
      {tasks.map((task) => (
        <AccordionItem value={task.name} key={task.name}>
          <AccordionTrigger className="!no-underline">
            <TaskHeader task={task} />
          </AccordionTrigger>
          <AccordionContent>
            <TaskDetails task={task} type={meta.type} groupName={meta.name} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function TaskGroup({ meta }: { meta: TaskGroupMetadata }) {
  return (
    <>
      <GroupHeader meta={meta} />
      <TaskList meta={meta} className="mt-3" />
    </>
  );
}
