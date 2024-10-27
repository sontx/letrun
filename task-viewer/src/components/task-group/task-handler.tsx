import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function TaskHandler({ handler }: { handler: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const timeoutRef = useRef<number | null>(null);

  const doClearTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      doClearTimeout();
    };
  }, []);

  const doCopy = useCallback(() => {
    setCopied(true);
    navigator.clipboard.writeText(`"${handler}"`);

    doClearTimeout();
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 1000);

    toast({
      title: "Copied",
      description: (
        <>
          Paste the copied task handler in your configuration file:
          <pre className="text-muted-foreground mt-2">
            {"{"}
            <br />
            {"  "}"handler": "<span className="text-orange-700">{handler}</span>
            "
            <br />
            {"}"}
          </pre>
        </>
      ),
    });
  }, [handler, toast]);

  return (
    <div className="grid w-fit items-center mb-4">
      <label className="text-sm font-medium leading-none mb-1.5">
        Task Handler
      </label>
      <div className="flex w-full min-w-64 rounded-md border border-input bg-background pl-2 text-sm justify-between items-center font-mono">
        <span>
          <span className="text-muted-foreground select-none">"handler": </span>
          <span className="text-orange-700">"{handler}"</span>
        </span>
        <span
          className="border-l rounded-tr rounded-br p-2.5 ml-2 text-secondary-foreground hover:bg-secondary/80 cursor-pointer"
          onClick={doCopy}
        >
          {copied ? (
            <Check className="text-green-600 w-[1em] h-[1em]" />
          ) : (
            <Copy className="w-[1em] h-[1em]" />
          )}
        </span>
      </div>
    </div>
  );
}
