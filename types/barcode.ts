/** One entry of GET /v1/client-barcodes/print-barcode → data.barcode_data (BarcodePrintAction). */
export interface BarcodeLabel {
  oder_id: number; // sic — backend typo, preserved as-is
  waybill_id: string;
  order_no: string | null;
  client_name: string;
  client_address: string | null;
  client_business_phone_no: string | null;
  date: string;
  customer_name: string;
  customer_address: string | null;
  customer_phone_no: string | null;
  cod: string;
  branch_name: string | null;
  wight: number | string | null; // sic — backend spelling of "weight"
  remarks: string | null;
  description: string | null;
}
