import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorMessage } from "@/lib/api";
import { groupDigits, initials } from "@/lib/format";
import {
  descendantIds,
  useRemoveAvatar,
  useSaveEmployee,
  useUploadAvatar,
} from "@/lib/employees";
import type { Department, Employee } from "@/types";

const NONE = "none";

const MIN_BIRTH_DATE = "1900-01-01";
const MAX_BIRTH_DATE = (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 16);
  return date.toISOString().slice(0, 10);
})();

const schema = z.object({
  first_name: z.string().min(1, "Enter a first name"),
  last_name: z.string().min(1, "Enter a surname"),
  email: z.string().email("Enter a valid email address"),
  birth_date: z
    .string()
    .min(1, "Pick a birth date")
    .refine((value) => value >= MIN_BIRTH_DATE, "Enter a realistic birth date")
    .refine(
      (value) => value <= MAX_BIRTH_DATE,
      "An employee must be at least 16",
    ),
  salary: z.string().min(1, "Enter a salary"),
  role: z.string().min(1, "Enter a role"),
  department_id: z.string(),
  manager_id: z.string(),
});

type EmployeeForm = z.infer<typeof schema>;

function toForm(employee?: Employee): EmployeeForm {
  return {
    first_name: employee?.first_name ?? "",
    last_name: employee?.last_name ?? "",
    email: employee?.email ?? "",
    birth_date: employee?.birth_date ?? "",
    salary: employee ? String(Math.round(Number(employee.salary))) : "",
    role: employee?.role ?? "",
    department_id: employee?.department ? String(employee.department.id) : NONE,
    manager_id: employee?.manager_id ? String(employee.manager_id) : NONE,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  employees: Employee[];
  departments: Department[];
}

export default function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  employees,
  departments,
}: Props) {
  const save = useSaveEmployee();
  const uploadPhoto = useUploadAvatar();
  const removePhoto = useRemoveAvatar();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const [removePending, setRemovePending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeForm>({
    resolver: zodResolver(schema),
    defaultValues: toForm(employee),
  });

  useEffect(() => {
    if (open) {
      reset(toForm(employee));
      save.reset();
      clearPendingPhoto();
      setRemovePending(false);
    }
  }, [open, employee]);

  // Nobody can manage themselves, and nobody below them can be their manager.
  const notAllowed = employee
    ? descendantIds(employees, employee.id)
    : new Set<number>();
  const managerOptions = employees.filter(
    (e) => e.id !== employee?.id && !notAllowed.has(e.id),
  );

  const current = employees.find((e) => e.id === employee?.id) ?? employee;

  function clearPendingPhoto() {
    if (pendingPhoto) URL.revokeObjectURL(pendingPhoto.url);
    setPendingPhoto(null);
  }

  const photoPreview = pendingPhoto
    ? pendingPhoto.url
    : removePending
      ? undefined
      : current?.avatar_url;

  async function applyPhotoChange(employeeId: number) {
    if (pendingPhoto) {
      await uploadPhoto.mutateAsync({
        id: employeeId,
        file: pendingPhoto.file,
      });
    } else if (removePending) {
      await removePhoto.mutateAsync(employeeId);
    }
  }

  function onSubmit(values: EmployeeForm) {
    save.mutate(
      {
        id: employee?.id,
        values: {
          ...values,
          department_id:
            values.department_id === NONE ? null : Number(values.department_id),
          manager_id:
            values.manager_id === NONE ? null : Number(values.manager_id),
        },
      },
      {
        onSuccess: async (saved) => {
          try {
            await applyPhotoChange(saved.id);
          } catch (error) {
            toast.error(errorMessage(error, "The photo could not be saved."));
            return;
          }
          toast.success(employee ? "Employee updated" : "Employee added");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit employee" : "Add employee"}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? `Employee number ${employee.employee_number}`
              : "The employee number is generated automatically."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {current && (
            <div className="flex items-center gap-4 rounded-md border p-3">
              <Avatar className="size-14">
                <AvatarImage src={photoPreview} alt="" />
                <AvatarFallback>
                  {initials(current.first_name, current.last_name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <p className="text-sm font-medium">Photo</p>
                <p className="text-xs text-muted-foreground">
                  {pendingPhoto
                    ? "New photo, saved when you press Save."
                    : removePending
                      ? "Photo removed, applied when you press Save."
                      : current.avatar_key
                        ? "Uploaded photo. Remove it to fall back to Gravatar."
                        : "Showing their Gravatar. Upload a photo to override it."}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInput.current?.click()}
                  >
                    Choose photo
                  </Button>
                  {(pendingPhoto || removePending) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearPendingPhoto();
                        setRemovePending(false);
                      }}
                    >
                      Undo
                    </Button>
                  )}
                  {current.avatar_key && !pendingPhoto && !removePending && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setRemovePending(true)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setRemovePending(false);
                  clearPendingPhoto();
                  setPendingPhoto({ file, url: URL.createObjectURL(file) });
                }}
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">Name</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && (
                <p className="text-sm text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Surname</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && (
                <p className="text-sm text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Birth date</Label>
              <Input
                id="birth_date"
                type="date"
                min={MIN_BIRTH_DATE}
                max={MAX_BIRTH_DATE}
                {...register("birth_date")}
              />
              {errors.birth_date && (
                <p className="text-sm text-destructive">
                  {errors.birth_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  R
                </span>
                <Input
                  id="salary"
                  inputMode="numeric"
                  className="pl-7"
                  value={groupDigits(watch("salary"))}
                  onChange={(event) =>
                    setValue("salary", event.target.value.replace(/\D/g, ""), {
                      shouldValidate: true,
                    })
                  }
                />
              </div>
              {errors.salary && (
                <p className="text-sm text-destructive">
                  {errors.salary.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="SAP Consultant"
              {...register("role")}
            />
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={watch("department_id")}
                onValueChange={(value) => setValue("department_id", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No department</SelectItem>
                  {departments.map((department) => (
                    <SelectItem
                      key={department.id}
                      value={String(department.id)}
                    >
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Manager</Label>
              <Select
                value={watch("manager_id")}
                onValueChange={(value) => setValue("manager_id", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    No manager (top of hierarchy)
                  </SelectItem>
                  {managerOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.first_name} {option.last_name} - {option.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {save.isError && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(save.error)}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
