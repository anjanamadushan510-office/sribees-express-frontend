"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { useNotificationSettings } from "@/lib/hooks/use-admin-notifications";
import type { NotificationSetting } from "@/types/admin-notification";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationEditDialog } from "@/components/forms/notification-edit-dialog";

/**
 * Channels are derived from the data, not hard-coded.
 *
 * The API returns every setting with its own `channel`, so the tab strip is
 * whatever channels actually exist. A fixed list of four tabs (as this page
 * used to have) shows empty tabs for channels the backend never seeds, and
 * hides any channel it adds later.
 */
export default function AdminNotificationsSettingsPage() {
  const { data: settings, isLoading, isError } = useNotificationSettings();
  const [editing, setEditing] = useState<NotificationSetting | null>(null);

  const channels = useMemo(
    () => Array.from(new Set((settings ?? []).map((s) => s.channel))).sort(),
    [settings]
  );

  const columns: Column<NotificationSetting>[] = [
    { header: "Key", cell: (r) => <span className="font-medium">{r.key}</span> },
    {
      header: "Template",
      cell: (r) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {r.message_template}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.is_active ? "Active" : "Inactive"} />,
    },
    {
      header: "Updated",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.updated_at ? formatDate(r.updated_at) : "—"}
        </span>
      ),
    },
    {
      header: "",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(r);
          }}
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Message templates sent on status changes."
      />

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load notification settings right now.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <DataTable columns={columns} rows={undefined} isLoading rowKey={(r) => r.id} />
      ) : channels.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No notification settings have been seeded.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={channels[0]}>
          <TabsList>
            {channels.map((c) => (
              <TabsTrigger key={c} value={c} className="capitalize">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
          {channels.map((c) => (
            <TabsContent key={c} value={c}>
              <DataTable
                columns={columns}
                rows={(settings ?? []).filter((s) => s.channel === c)}
                rowKey={(r) => r.id}
                emptyMessage="No settings on this channel."
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <NotificationEditDialog setting={editing} onClose={() => setEditing(null)} />
    </>
  );
}
