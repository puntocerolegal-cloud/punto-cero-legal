import { mapVertical } from "@/utils/mappers";

/**
 * Normaliza una factura del backend al shape que usa BillingDashboard /
 * InvoiceTable (invoice, client, vertical, source, issued, due, amount, status).
 * Idempotente con el mock.
 */
export function normalizeInvoice(raw = {}) {
  return {
    _id: raw._id || raw.id || "",
    invoice: raw.invoice || raw.invoiceNumber || raw.number || "—",
    client: raw.client || raw.clientName || "—",
    vertical: mapVertical(raw.vertical),
    source: raw.source || "Suscripción",
    issued: raw.issued || raw.issueDate || raw.created_at || "",
    due: raw.due || raw.dueDate || "",
    amount: raw.amount ?? 0,
    status: raw.status || "pending",
    paymentMethod: raw.paymentMethod || null,
    paidDate: raw.paidDate || null,
  };
}

export function normalizeInvoices(list = []) {
  return Array.isArray(list) ? list.map(normalizeInvoice) : [];
}

export default normalizeInvoice;
