import { TaskGroupMetadata } from "@letrun/common";
import { Badge } from "../ui/badge";
import { GroupIcon } from "./group-icon";

export function GroupHeader({ meta }: { meta: TaskGroupMetadata }) {
  return (
    <div className="flex gap-3.5">
      <GroupIcon iconUrl={meta.icon} className="w-10 h-10" />
      <div>
        <div className="text-lg font-semibold leading-none">
          {meta.name}{" "}
          {meta.version && <Badge variant="secondary">v{meta.version}</Badge>}
        </div>
        {meta.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {meta.description}
          </p>
        )}
      </div>
    </div>
  );
}