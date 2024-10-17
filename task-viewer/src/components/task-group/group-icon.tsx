import { Boxes } from "lucide-react";

export function GroupIcon({
  iconUrl,
  className,
}: {
  iconUrl?: string;
  className?: string;
}) {
  return iconUrl ? (
    <img src={iconUrl} alt="Group icon" className={className} />
  ) : (
    <Boxes className={className} />
  );
}