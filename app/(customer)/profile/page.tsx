"use client";

import { useMyProfile } from "@/lib/hooks/use-profile";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettingsForm } from "@/components/customer/account-settings-form";
import { ChangePasswordForm } from "@/components/customer/change-password-form";

export default function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();

  return (
    <>
      <PageHeader title="My Profile" description="Manage your account details and security." />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business details</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : profile ? (
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <Info label="Name" value={profile.name} />
                  <Info label="Email" value={profile.email} />
                  <Info
                    label="Phone"
                    value={profile.phone_number ?? profile.phone_no}
                  />
                  <Info label="Address" value={profile.address} />
                  <Info label="Delivery email" value={profile.delivery_email} />
                  <Info label="Financial email" value={profile.financial_email} />
                  <Info
                    label="Waybill mode"
                    value={profile.way_bill_auto_generate}
                  />
                  <Info label="AI progress" value={profile.ai_status} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Could not load profile.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account settings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full max-w-lg" />
              ) : profile ? (
                <AccountSettingsForm profile={profile} />
              ) : (
                <p className="text-sm text-muted-foreground">Could not load profile.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change password</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5">{value || "—"}</dd>
    </div>
  );
}
