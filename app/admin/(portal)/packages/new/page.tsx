import { PageHeader } from "@/components/shared/page-header";
import { CreateAdminOrderForm } from "@/components/forms/create-admin-order-form";

export default function NewAdminPackagePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Package"
        description="Create a delivery order on behalf of a client. The waybill number is assigned automatically."
      />
      <CreateAdminOrderForm />
    </div>
  );
}
