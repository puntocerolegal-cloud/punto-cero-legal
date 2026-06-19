import { mapVertical } from "@/utils/mappers";

/**
 * Normaliza un partner del backend (companyName/contactName/commissionRate)
 * al shape que usan PartnersDashboard / PartnerPipeline / CommissionSummary
 * (company / contact / commission / joined). Idempotente con el mock.
 */
export function normalizePartner(raw = {}) {
  return {
    _id: raw._id || raw.id || "",
    company: raw.company || raw.companyName || raw.name || "—",
    contact: raw.contact || raw.contactName || "—",
    email: raw.email || "",
    phone: raw.phone || "",
    vertical: mapVertical(raw.vertical),
    status: raw.status || "active",
    stage: raw.stage || "lead",
    commission: raw.commission ?? raw.commissionRate ?? 0,
    projectedRevenue: raw.projectedRevenue ?? 0,
    joined: raw.joined || raw.createdAt || raw.created_at || "",
  };
}

export function normalizePartners(list = []) {
  return Array.isArray(list) ? list.map(normalizePartner) : [];
}

export default normalizePartner;
