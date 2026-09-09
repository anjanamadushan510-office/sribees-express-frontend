"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { useUpdateNotificationSetting } from "@/lib/hooks/use-admin-notifications";
import { getErrorMessage } from "@/lib/api/client";
import type { NotificationSetting } from "@/types/admin-notification";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Edit one notification template.
 *
 * Takes the whole `setting` rather than an id: the list already holds every
 * field, so fetching a detail view would re-request data we have — and this
 * API has no per-setting GET anyway.
 */
export function NotificationEditDialog({
  setting,
  onClose,
}: {
  setting: NotificationSetting | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={setting !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {setting && (
          // `key` remounts the form when a different setting is opened, which
          // seeds the fields from props with no effect and no setState during
          // an effect. Resetting state in a useEffect is the same thing done
          // one render later, and React's compiler lint flags it for that.
          <EditForm key={setting.id} setting={setting} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  setting,
  onClose,
}: {
  setting: NotificationSetting;
  onClose: () => void;
}) {
  const [template, setTemplate] = useState(setting.message_template);
  const [isActive, setIsActive] = useState(setting.is_active);
  const mutation = useUpdateNotificationSetting();

  const dirty =
    template !== setting.message_template || isActive !== setting.is_active;

  const submit = () => {
    if (!dirty) return;
    mutation.mutate(
      {
        id: setting.id,
        // Only what changed — this is a PATCH, so resending an unchanged
        // template would needlessly clobber a concurrent edit of it.
        payload: {
          ...(template !== setting.message_template
            ? { message_template: template }
            : {}),
          ...(isActive !== setting.is_active ? { is_active: isActive } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success("Notification setting saved");
          onClose();
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not save the setting")),
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit notification</DialogTitle>
        <DialogDescription>
          {setting.channel} · {setting.key}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="message_template">Message template</Label>
          <Textarea
            id="message_template"
            rows={5}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Placeholders are substituted by the backend when the message is sent.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="is_active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Turn off to stop sending this notification.
            </p>
          </div>
          {/* This design system has no Switch primitive; a two-state button is
              clearer than adding a dependency for one control. */}
          <Button
            id="is_active"
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsActive((v) => !v)}
          >
            {isActive ? <Check className="size-4" /> : <X className="size-4" />}
            {isActive ? "On" : "Off"}
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button disabled={!dirty || mutation.isPending} onClick={submit}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
