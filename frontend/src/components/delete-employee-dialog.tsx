import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorMessage } from "@/lib/api";
import { descendantIds, useDeleteEmployee } from "@/lib/employees";
import type { Employee } from "@/types";

const NOBODY = "nobody";

interface Props {
  employee: Employee | null;
  employees: Employee[];
  onClose: () => void;
}

export default function DeleteEmployeeDialog({
  employee,
  employees,
  onClose,
}: Props) {
  const remove = useDeleteEmployee();
  // The page gives this component a key per employee, so the state starts fresh each time.
  const [reassignTo, setReassignTo] = useState(NOBODY);

  if (!employee) return null;

  const reports = employees.filter((e) => e.manager_id === employee.id);
  const below = descendantIds(employees, employee.id);
  const options = employees.filter(
    (e) =>
      e.id !== employee.id &&
      (!below.has(e.id) || e.manager_id === employee.id),
  );

  function confirm() {
    remove.mutate(
      {
        id: employee!.id,
        reassignTo: reassignTo === NOBODY ? null : Number(reassignTo),
      },
      {
        onSuccess: () => {
          toast.success(
            `${employee!.first_name} ${employee!.last_name} was deleted`,
          );
          onClose();
        },
      },
    );
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {employee.first_name} {employee.last_name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {reports.length > 0
              ? `${reports.length} ${reports.length === 1 ? "person reports" : "people report"} to
                 them, so choose who takes over the team.`
              : "This cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {reports.length > 0 && (
          <div className="space-y-2">
            <Label>New manager for the team</Label>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NOBODY}>
                  Nobody (move them to the top)
                </SelectItem>
                {options.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.first_name} {option.last_name} - {option.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {remove.isError && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(remove.error)}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              confirm();
            }}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
