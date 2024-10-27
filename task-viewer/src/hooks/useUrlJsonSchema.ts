import { useMemo } from "react";
import { inflate } from "pako";

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const uint8Array = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  return uint8Array;
}

export function useUrlJsonSchema() {
  const searchParams = new URLSearchParams(location.search);
  const base64Schema = searchParams.get("schema");
  return useMemo(() => {
    if (base64Schema) {
      try {
        const uint8Array = base64ToUint8Array(base64Schema);
        const decompressedData = inflate(uint8Array, { to: "string" });
        return JSON.parse(decompressedData);
      } catch (error) {
        console.error("Failed to parse schema", error);
      }
    }
    return undefined;
  }, [base64Schema]);
}
