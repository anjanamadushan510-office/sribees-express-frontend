"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useNotificationSettings,
  useToggleNotificationStatus,
} from "@/lib/hooks/use-admin-notifications";
import type { NotificationChannel } from "@/lib/api/admin-notifications";
import type { NotificationSettingRow } from "@/types/admin-notification";
import { getErrorMessage } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationEditDialog } from "@/components/forms/notification-edit-dialog";

const PER_PAGE = 20;

export default function AdminNotificationsSettingsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="SMS, e-receipt, portal, and pickup-request notification settings by status."
      />
      <Tabs defaultValue="sms">
        <TabsList>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="ereceipt">E-receipt</TabsTrigger>
          <TabsTrigger value="portal">Portal</TabsTrigger>
          <TabsTrigger value="pickup">Pickup Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="sms">
          <ChannelTab channel="sms" editable />
        </TabsContent>
        <TabsContent value="ereceipt">
          <ChannelTab channel="ereceipt" editable />
        </TabsContent>
        <TabsContent value="portal">
          <ChannelTab channel="portal" editable={false} />
        </TabsContent>
        <TabsContent value="pickup">
          <ChannelTab channel="pickup" editable={false} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ChannelTab({
  channel,
  editable,
}: {
  channel: NotificationChannel;
  editable: boolean;
}) {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isFetching, isError } = useNotificationSettings(channel, {
    page,
    perPage: PER_PAGE,
  });
  const toggleMutation = useToggleNotificationStatus(channel);

  const canEdit = editable && hasPermission("edit-sms");
  const canToggle = hasPermission("active-sms") || hasPermission("de-active-sms");

  const columns: Column<NotificationSettingRow>[] = [
    { header: "Status", cell: (r) => <span className="font-medium">{r.status_name}</span> },
    {
      header: "Notification status",
      cell: (r) => <StatusBadge status={r.Status === "Active" ? "Active" : "Deactive"} />,
    },
    {
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-2">
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setEditingId(r.id)}>
              Edit
            </Button>
          )}
          {canToggle && (
            <Button
              size="sm"
              variant="outline"
              disabled={toggleMutation.isPending}
              onClick={() =>
                toggleMutation.mutate(
                  { id: r.id, isActive: r.Status !== "Active" },
                  {
                    onSuccess: () => toast.success("Notification status updated"),
                    onError: (error) =>
                      toast.error(getErrorMessage(error, "Could not update status")),
                  }
                )
              }
            >
              {r.Status === "Active" ? "Deactivate" : "Activate"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {isError ? (
        <Card className="mt-4">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load notification settings right now. Check your connection and
            try again.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isFetching && !data}
            rowKey={(r) => r.id}
            emptyMessage="No notification settings found."
          />
          <Pagination
            pagination={data?.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </div>
      )}

      {editable && (
        <NotificationEditDialog
          channel={channel as "sms" | "ereceipt"}
          id={editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </>
  );
}
