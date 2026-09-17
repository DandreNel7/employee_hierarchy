import { MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import DepartmentDialog from "@/components/department-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorMessage } from "@/lib/api";
import { useDeleteDepartment, useDepartments } from "@/lib/departments";
import { useEmployees } from "@/lib/employees";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const { data: departments = [], isPending } = useDepartments();
  const { data: employees = [] } = useEmployees();
  const remove = useDeleteDepartment();

  const [editing, setEditing] = useState<Department | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);

  function headcount(departmentId: number) {
    return employees.filter(
      (employee) => employee.department?.id === departmentId,
    ).length;
  }

  function confirmDelete() {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`${deleting.name} was deleted`);
        setDeleting(null);
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Departments</h1>
          <p className="text-sm text-muted-foreground">
            {departments.length}{" "}
            {departments.length === 1 ? "department" : "departments"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add department
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            )}

            {!isPending && departments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No departments yet. Add one to group your employees.
                </TableCell>
              </TableRow>
            )}

            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="size-4 rounded-full border"
                      style={{ backgroundColor: department.color }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {department.color}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{headcount(department.id)}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(department);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleting(department)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editing}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && headcount(deleting.id) > 0
                ? `${headcount(deleting.id)} employees are still in this department. Move them somewhere else first.`
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>

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
                confirmDelete();
              }}
              disabled={
                remove.isPending ||
                (deleting !== null && headcount(deleting.id) > 0)
              }
            >
              {remove.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
