import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Placeholder for portal pages whose backend payloads we'll wire up
 * in the next feature iteration.
 */
export function ComingSoon({ feature }: { feature: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="rounded-full bg-muted p-3 text-muted-foreground">
          <Construction className="size-6" />
        </div>
        <div>
          <p className="font-medium">{feature}</p>
          <p className="text-sm text-muted-foreground">
            This screen is scaffolded and ready to be wired to the backend.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
