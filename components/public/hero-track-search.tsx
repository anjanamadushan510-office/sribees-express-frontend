"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroTrackSearch() {
  const router = useRouter();
  const [waybill, setWaybill] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = waybill.trim();
    router.push(value ? `/track?waybill=${encodeURIComponent(value)}` : "/track");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-md gap-2 rounded-lg border bg-background p-2 shadow-sm"
    >
      <Input
        value={waybill}
        onChange={(e) => setWaybill(e.target.value)}
        placeholder="Enter your waybill number"
        aria-label="Waybill number"
        className="border-0 shadow-none focus-visible:ring-0"
      />
      <Button type="submit">
        <PackageSearch className="size-4" />
        Track
      </Button>
    </form>
  );
}
