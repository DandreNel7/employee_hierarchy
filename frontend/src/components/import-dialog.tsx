import axios from "axios";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useImportEmployees } from "@/lib/employees";

const COLUMNS =
  "first_name,last_name,email,birth_date,salary,role,department,manager_email";

function problemsFrom(error: unknown): string[] {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (detail && Array.isArray(detail.errors)) return detail.errors;
    if (typeof detail === "string") return [detail];
  }
  return ["The file could not be imported."];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportDialog({ open, onOpenChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const load = useImportEmployees();

  function close() {
    setFile(null);
    load.reset();
    onOpenChange(false);
  }

  function startImport() {
    if (!file) return;
    load.mutate(file, {
      onSuccess: (result) => {
        toast.success(result.message);
        close();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="min-w-0">
          <DialogTitle>Import employees</DialogTitle>
          <DialogDescription>Upload a CSV file.</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Required columns</p>
            <pre className="rounded-md border bg-muted p-3 text-xs break-words whitespace-pre-wrap">
              {COLUMNS}
            </pre>
            <p className="text-xs text-muted-foreground">
              Leave manager_email empty for the top of the hierarchy.
              Departments that do not exist yet are created.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="size-4" />
              Choose file
            </Button>
            <span className="truncate text-sm text-muted-foreground">
              {file ? file.name : "No file chosen"}
            </span>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const chosen = event.target.files?.[0] ?? null;
                event.target.value = "";
                load.reset();
                setFile(chosen);
              }}
            />
          </div>

          {load.isError && (
            <Alert variant="destructive" className="min-w-0">
              <AlertTitle>The file was not imported</AlertTitle>
              <AlertDescription className="min-w-0">
                <ScrollArea className="h-40 w-full">
                  <ul className="space-y-1 pr-3 text-xs">
                    {problemsFrom(load.error).map((problem) => (
                      <li key={problem} className="break-words">
                        {problem}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={startImport}
            disabled={!file || load.isPending}
          >
            {load.isPending ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
