import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { errorMessage } from "@/lib/api";
import { useSaveDepartment } from "@/lib/departments";
import { cn } from "@/lib/utils";
import type { Department } from "@/types";

const PRESETS = [
  "#051641",
  "#BD2E47",
  "#1F4E8C",
  "#3F7D3F",
  "#8C6D1F",
  "#6B3FA0",
];

const schema = z.object({
  name: z.string().min(1, "Enter a department name").max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pick a colour"),
});

type DepartmentForm = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
}

export default function DepartmentDialog({
  open,
  onOpenChange,
  department,
}: Props) {
  const save = useSaveDepartment();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: department?.name ?? "",
      color: department?.color ?? PRESETS[0],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: department?.name ?? "",
        color: department?.color ?? PRESETS[0],
      });
      save.reset();
    }
  }, [open, department]);

  const color = watch("color");

  function onSubmit(values: DepartmentForm) {
    save.mutate(
      { id: department?.id, values },
      {
        onSuccess: () => {
          toast.success(department ? "Department updated" : "Department added");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {department ? "Edit department" : "Add department"}
          </DialogTitle>
          <DialogDescription>
            The colour is used for the badge in the table and on the org chart.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="SAP Consulting"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Colour</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                className="h-9 w-14 p-1"
                value={color}
                onChange={(event) => setValue("color", event.target.value)}
              />
              <Input
                value={color}
                onChange={(event) => setValue("color", event.target.value)}
                className="w-32 font-mono"
              />
              <div className="flex gap-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-label={preset}
                    onClick={() => setValue("color", preset)}
                    style={{ backgroundColor: preset }}
                    className={cn(
                      "size-6 rounded-full border",
                      color.toLowerCase() === preset.toLowerCase() &&
                        "ring-2 ring-ring ring-offset-2",
                    )}
                  />
                ))}
              </div>
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color.message}</p>
            )}
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
