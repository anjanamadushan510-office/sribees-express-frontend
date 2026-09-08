"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  useAdminClientProfileRequest,
  useApproveAdminClientProfileRequest,
} from "@/lib/hooks/use-admin-client-profiles";
import { getErrorMessage } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { ApproveClientProfilePayload } from "@/types/admin-client-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminClientProfileRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { hasPermission } = useAuth();

  const { data, isLoading, isError } = useAdminClientProfileRequest(id);

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/admin/clients/profile-requests">
          <ArrowLeft className="size-4" />
          Back to profile requests
        </Link>
      </Button>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError || !data ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load this request. It may not exist, or you may not have permission
            to view it.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
            <p className="text-sm text-muted-foreground">
              Requested {formatDate(data.created_at)} — {data.status ? "approved" : "pending"}
            </p>
          </div>

          {data.business_type && data.business_type.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Business type</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {data.business_type.join(", ")} — read-only here; the backend&apos;s approve
                  endpoint doesn&apos;t round-trip this field cleanly, so it isn&apos;t applied
                  automatically on approval.
                </p>
              </CardContent>
            </Card>
          )}

          {(data.identity_document_front || data.identity_document_back) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Identity documents</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {data.identity_document_front && (
                  <a
                    href={data.identity_document_front}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline"
                  >
                    Front document
                  </a>
                )}
                {data.identity_document_back && (
                  <a
                    href={data.identity_document_back}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline"
                  >
                    Back document
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          <ReviewForm
            key={data.id}
            data={data}
            canApprove={hasPermission("update-client")}
            onApproved={() => router.push("/admin/clients/profile-requests")}
          />
        </>
      )}
    </div>
  );
}

function ReviewForm({
  data,
  canApprove,
  onApproved,
}: {
  data: NonNullable<ReturnType<typeof useAdminClientProfileRequest>["data"]>;
  canApprove: boolean;
  onApproved: () => void;
}) {
  const [form, setForm] = useState<ApproveClientProfilePayload>({
    owner_name: data.owner_name ?? "",
    owner_nic: data.owner_nic ?? "",
    owner_email: data.owner_email ?? "",
    owner_phone_no: data.owner_phone_no ?? "",
    owner_address: data.owner_address ?? "",
    advicer_name: data.advicer_name ?? "",
    name: data.name,
    business_reg_no: data.business_reg_no ?? "",
    email: data.email,
    address: data.address ?? "",
    business_phone_no: data.business_phone_no ?? "",
    account_name: data.account_name,
    account_no: data.account_no,
    branch_name: data.branch_name,
    bank_name: data.bank_name,
    bank_id: data.bank_id,
    pick_address: data.pickup_address,
    pick_phone_no: data.pickup_phone_no,
    nearest_city: data.nearest_city,
    pickup_branch: data.pickup_branch,
    payment_terms: data.payment_terms ?? "",
    verification_document_type: data.verification_document_type ?? "",
  });
  const mutation = useApproveAdminClientProfileRequest(data.id);

  const field = (key: keyof ApproveClientProfilePayload, label: string) => (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <Input
        value={String(form[key] ?? "")}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  const submit = () => {
    mutation.mutate(
      { ...form, nearest_city: Number(form.nearest_city) },
      {
        onSuccess: () => {
          toast.success("Profile change approved and applied");
          onApproved();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not approve this request")),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Requested changes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {field("name", "Business name")}
          {field("email", "Email")}
          {field("address", "Address")}
          {field("business_phone_no", "Business phone")}
          {field("business_reg_no", "Business reg. no.")}
          {field("owner_name", "Owner name")}
          {field("owner_nic", "Owner NIC")}
          {field("owner_email", "Owner email")}
          {field("owner_phone_no", "Owner phone")}
          {field("owner_address", "Owner address")}
          {field("advicer_name", "Advisor name")}
          {field("account_name", "Bank account name")}
          {field("account_no", "Bank account number")}
          {field("bank_name", "Bank name")}
          {field("branch_name", "Bank branch")}
          {field("bank_id", "Bank branch code")}
          {field("pick_address", "Pickup address")}
          {field("pick_phone_no", "Pickup phone")}
          {field("pickup_branch", "Pickup branch")}
          {field("nearest_city", "Nearest city (id)")}
          {field("payment_terms", "Payment terms")}
          {field("verification_document_type", "Verification document type")}
        </div>
        {canApprove && (
          <div className="flex justify-end pt-2">
            <Button disabled={mutation.isPending} onClick={submit}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Approve &amp; apply
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
