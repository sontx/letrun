import { Box } from "lucide-react";

export function TaskIcon({
  iconUrl,
  className,
}: {
  iconUrl?: string;
  className?: string;
}) {
  return iconUrl ? (
    <img src={iconUrl} alt="Task icon" className={className} />
  ) : (
    <Box className={className} />
  );
}
