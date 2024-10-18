import { useMemo } from "react";

export function useUrlAppName() {
  const searchParams = new URLSearchParams(location.search);
  return useMemo(() => {
    return searchParams.get("app") || "letrun";
  }, [location.search]);
}
