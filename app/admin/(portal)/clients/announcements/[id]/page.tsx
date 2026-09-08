"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAdminClientNotify } from "@/lib/hooks/use-admin-client-notify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminClientAnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, isError } = useAdminClientNotify(id);

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/clients/announcements">
          <ArrowLeft className="size-4" />
          Back to announcements
        </Link>
      </Button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">Announcement #{id}</h1>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError || !data || data.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this announcement, or it has no recorded recipients.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data[0].subject && (
            <p className="text-sm text-muted-foreground">Subject: {data[0].subject}</p>
          )}
          {data.map((r, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{r.client_name}</span>
                  <span className="text-xs font-normal uppercase text-muted-foreground">
                    {r.type}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {r.client_email && (
                  <p className="mb-2 text-xs text-muted-foreground">{r.client_email}</p>
                )}
                <p className="whitespace-pre-wrap text-sm">{r.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
