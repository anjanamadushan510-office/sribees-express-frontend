"use client";

import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Staff order creation is not available against this API.
 *
 * `POST /shipments/orders` exists and takes a `client_id`, but nothing exposes
 * the list of clients — so a staff member has no way to choose which merchant
 * the order belongs to, and a form that asks them to type a numeric id from
 * memory is not a form, it is a trap. Merchants create their own orders through
 * the customer portal in the meantime.
 *
 * The route is kept rather than deleted so existing links and bookmarks land on
 * an explanation instead of a 404.
 */
export default function NewPackagePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/packages">
          <ArrowLeft className="size-4" />
          Back to packages
        </Link>
      </Button>

      <PageHeader
        title="Create order"
        description="Not available from the admin portal yet."
      />

      <Card>
        <CardContent className="space-y-4 py-8">
          <div className="flex gap-3">
            <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="space-y-2 text-sm">
              <p>
                Creating an order on a client&apos;s behalf needs a way to pick the
                client, and the API has no endpoint that lists or searches them
                yet. Rather than ask you to recall a numeric client ID, this form
                is withheld until that exists.
              </p>
              <p className="text-muted-foreground">
                Merchants can create their own shipments in the customer portal,
                and those appear here immediately.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Button asChild variant="outline">
              <Link href="/admin/packages">View all packages</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
