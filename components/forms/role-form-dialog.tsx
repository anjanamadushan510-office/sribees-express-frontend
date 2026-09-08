"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import axios from "axios";
import { usePermissionCategories, useRole, useCreateRole, useUpdateRole } from "@/lib/hooks/use-admin-roles";
import { getErrorMessage } from "@/lib/api/client";
import type { PermissionCategory, RoleDetail } from "@/types/admin-role";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function RoleFormDialog({
  open,
  onOpenChange,
  roleId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode. */
  roleId: number | null;
}) {
  const isEdit = roleId !== null;
  const { data: categories, isLoading: categoriesLoading } = usePermissionCategories();
  const { data: role, isLoading: roleLoading } = useRole(isEdit ? roleId : null);

  const isLoading = categoriesLoading || (isEdit && roleLoading);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit role permissions" : "New role"}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !categories ? (
          <p className="text-sm text-muted-foreground">Could not load permissions.</p>
        ) : (
          <RoleForm
            key={roleId ?? "new"}
            roleId={roleId}
            role={role ?? null}
            categories={categories}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleForm({
  roleId,
  role,
  categories,
  onDone,
}: {
  roleId: number | null;
  role: RoleDetail | null;
  categories: PermissionCategory[];
  onDone: () => void;
}) {
  const isEdit = roleId !== null;
  const [name, setName] = useState(role?.name ?? "");
  const [nameError, setNameError] = useState<string | undefined>();
  const [selected, setSelected] = useState<Set<number>>(
    new Set((role?.permissions ?? []).map((p) => p.id))
  );
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(roleId ?? 0);
  const mutation = isEdit ? updateMutation : createMutation;

  const toggle = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (!isEdit && !name.trim()) {
      setNameError("Role name is required");
      return;
    }
    setNameError(undefined);
    const permission_ids = Array.from(selected);

    const onSuccess = () => {
      toast.success(isEdit ? "Role updated" : "Role created");
      onDone();
    };
    const onError = (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = (error.response.data?.error ?? {}) as Record<string, string[]>;
        if (fieldErrors.name?.[0]) {
          setNameError(fieldErrors.name[0]);
          toast.error("Please fix the highlighted field");
          return;
        }
      }
      toast.error(getErrorMessage(error, "Could not save role"));
    };

    if (isEdit) {
      updateMutation.mutate({ permission_ids }, { onSuccess, onError });
    } else {
      createMutation.mutate({ name: name.trim(), permission_ids }, { onSuccess, onError });
    }
  };

  return (
    <div className="space-y-4">
      {!isEdit && (
        <div>
          <Label className="mb-1.5 block">Role name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Branch Supervisor" />
          {nameError && <p className="mt-1 text-sm text-destructive">{nameError}</p>}
        </div>
      )}

      <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
        {categories.map((cat) => (
          <div key={cat.id}>
            <p className="mb-2 text-sm font-medium">{cat.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {cat.permissions.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      checked
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {checked && <Check className="size-3" />}
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={mutation.isPending} onClick={submit}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Save permissions" : "Create role"}
        </Button>
      </DialogFooter>
    </div>
  );
}
