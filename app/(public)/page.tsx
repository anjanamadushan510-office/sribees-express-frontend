import Link from "next/link";
import {
  Truck,
  PackageCheck,
  BarChart3,
  MapPinned,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroTrackSearch } from "@/components/public/hero-track-search";

const features = [
  {
    icon: MapPinned,
    title: "Real-time tracking",
    description: "Follow every parcel from pickup to doorstep with live status updates.",
  },
  {
    icon: Truck,
    title: "Island-wide delivery",
    description: "A connected branch and rider network covering every district.",
  },
  {
    icon: Clock,
    title: "Fast pickups",
    description: "Schedule a pickup request and a rider is assigned automatically.",
  },
  {
    icon: BarChart3,
    title: "Business analytics",
    description: "Dashboards for order volume, success rates, and finances.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & reliable",
    description: "Role-based access for customers, branches, and head office.",
  },
  {
    icon: PackageCheck,
    title: "Bulk shipments",
    description: "Upload and print waybills in bulk with built-in barcode support.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Truck className="size-3.5" /> Courier &amp; Delivery Management
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Ship smarter with{" "}
            <span className="text-primary">SRIBEES Express</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Track packages in real time, manage shipments, and run your delivery
            operations — all in one platform.
          </p>

          <div className="mt-8">
            <HeroTrackSearch />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">Customer Portal</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/admin/login">Staff Portal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need to deliver
          </h2>
          <p className="mt-2 text-muted-foreground">
            From the first pickup to the final mile.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                  <f.icon className="size-6" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to send your first parcel?
          </h2>
          <p className="max-w-md text-muted-foreground">
            Create a customer account and start booking shipments in minutes.
          </p>
          <Button asChild size="lg">
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
