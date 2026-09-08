import { PageHeader } from "@/components/shared/page-header";
import { CreateShipmentForm } from "@/components/forms/create-shipment-form";

export default function NewShipmentPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Create Shipment"
        description="Book a new delivery. Fields marked required must be completed."
      />
      <CreateShipmentForm />
    </div>
  );
}
