"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useMerchant, useUpdateMerchant } from "@/lib/hooks/use-identity";
import { getErrorMessage } from "@/lib/api/client";
import { searchStaffPostalCities } from "@/lib/api/dropdowns";
import type { Merchant } from "@/types/identity";
import { PostalCityPicker, type PostalCityOption } from "@/components/shared/postal-city-picker";
import { MerchantOutletsTab } from "@/components/admin/merchant-outlets-tab";
import { MerchantPricingTab } from "@/components/admin/merchant-pricing-tab";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MerchantLoginsTab } from "@/components/admin/merchant-logins-tab";
import { MerchantApiKeysTab } from "@/components/admin/merchant-api-keys-tab";

export default function AdminMerchantDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);
  const { data: merchant, isLoading, isError, error } = useMerchant(clientId);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/admin/clients">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All merchants
        </Link>
      </Button>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load this merchant."}
        </p>
      )}

      {merchant && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {merchant.business_name}
            </h1>
            <StatusBadge status={merchant.is_active ? "Active" : "Inactive"} />
          </div>

          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="outlets">Outlets</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="logins">Portal logins</TabsTrigger>
              <TabsTrigger value="api-keys">API keys</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <MerchantDetailsForm clientId={clientId} merchant={merchant} />
            </TabsContent>
            <TabsContent value="outlets">
              <MerchantOutletsTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="pricing">
              <MerchantPricingTab clientId={clientId} weightBasisKg={merchant.weight_basis_kg} />
            </TabsContent>
            <TabsContent value="logins">
              <MerchantLoginsTab clientId={clientId} />
            </TabsContent>
            <TabsContent value="api-keys">
              <MerchantApiKeysTab clientId={clientId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </>
  );
}

function MerchantDetailsForm({
  clientId,
  merchant,
}: {
  clientId: number;
  merchant: Merchant;
}) {
  const [form, setForm] = useState({
    business_name: merchant.business_name,
    email: merchant.email,
    address: merchant.address ?? "",
    commission_percent: merchant.commission_percent,
  });
  const [postalCity, setPostalCity] = useState<PostalCityOption | null>(merchant.postal_city);
  const [weightBasisKg, setWeightBasisKg] = useState<"1" | "5" | "10">(
    String(merchant.weight_basis_kg) as "1" | "5" | "10"
  );
  const update = useUpdateMerchant();

  async function save(event: React.FormEvent) {
    event.preventDefault();
    // An address can be changed but never cleared: the API refuses a null, so
    // an empty field is left out rather than sent.
    const address = form.address.trim();
    try {
      await update.mutateAsync({
        id: clientId,
        payload: {
          business_name: form.business_name,
          email: form.email,
          commission_percent: form.commission_percent,
          weight_basis_kg: Number(weightBasisKg) as 1 | 5 | 10,
          ...(address ? { address } : {}),
          ...(postalCity ? { postal_city_id: postalCity.id } : {}),
        },
      });
      toast.success("Merchant updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save"));
    }
  }

  async function setActive(isActive: boolean) {
    try {
      await update.mutateAsync({ id: clientId, payload: { is_active: isActive } });
      toast.success(isActive ? "Merchant reactivated" : "Merchant suspended");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not change the status"));
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Business details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="business_name">Business name</Label>
              <Input
                id="business_name"
                value={form.business_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Business email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commission_percent">Commission %</Label>
                <Input
                  id="commission_percent"
                  inputMode="decimal"
                  value={form.commission_percent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, commission_percent: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="weight_basis_kg">Pricing weight basis</Label>
                <Select
                  value={weightBasisKg}
                  onValueChange={(v) => setWeightBasisKg(v as "1" | "5" | "10")}
                >
                  <SelectTrigger id="weight_basis_kg" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Per 1 kg</SelectItem>
                    <SelectItem value="5">Per 5 kg</SelectItem>
                    <SelectItem value="10">Per 10 kg</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Governs every price quoted to this merchant, including the standard zone rate.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="address">Registered address</Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postal_city">Postal city</Label>
                <PostalCityPicker
                  id="postal_city"
                  queryKey="staff"
                  search={searchStaffPostalCities}
                  value={postalCity}
                  onChange={setPostalCity}
                />
                {!merchant.address && (
                  <p className="text-xs text-muted-foreground">
                    This merchant predates required addresses — add one.
                  </p>
                )}
              </div>
            </div>
            <div>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/*
            Suspending is not deletion, and it is not cosmetic: the API refuses
            a suspended merchant's logins at both sign-in and token refresh, so
            an open session stops working rather than running to expiry. Orders
            reference this row, so there is no delete to offer.
          */}
          <p className="text-sm text-muted-foreground">
            Suspending blocks this merchant&apos;s portal logins immediately.
            Their existing parcels are unaffected.
          </p>
          {merchant.is_active ? (
            <Button
              variant="destructive"
              onClick={() => setActive(false)}
              disabled={update.isPending}
            >
              Suspend merchant
            </Button>
          ) : (
            <Button onClick={() => setActive(true)} disabled={update.isPending}>
              Reactivate merchant
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
