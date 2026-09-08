import { useQuery } from "@tanstack/react-query";
import { printClientBarcode } from "@/lib/api/barcode";

export function useClientBarcodePrint(ids: (number | string)[]) {
  return useQuery({
    queryKey: ["client-barcode-print", ids.map(String)],
    queryFn: () => printClientBarcode(ids),
    enabled: ids.length > 0,
  });
}
