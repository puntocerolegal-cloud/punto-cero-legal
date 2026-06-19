import { mapVertical } from "@/utils/mappers";

// Plan backend (minúsculas) → etiqueta UI (capitalizada).
const PLAN_LABEL = { essential: "Essential", professional: "Professional", enterprise: "Enterprise" };

/**
 * Normaliza una suscripción del backend al shape que usan
 * SubscriptionsDashboard / ActiveSubscriptions / RenewalPanel / BillingCenter.
 * Idempotente con el mock (que ya viene capitalizado).
 */
export function normalizeSubscription(raw = {}) {
  const plan = raw.plan || "essential";
  return {
    _id: raw._id || raw.id || "",
    company: raw.company || raw.companyName || "—",
    vertical: mapVertical(raw.vertical),
    plan: PLAN_LABEL[plan] || plan,
    status: raw.status || "active",
    renewal: raw.renewal || raw.renewalDate || "",
    monthly: raw.monthly ?? raw.monthlyAmount ?? 0,
    billingCycle: raw.billingCycle || "monthly",
    usersIncluded: raw.usersIncluded ?? 0,
    usersUsed: raw.usersUsed ?? 0,
  };
}

export function normalizeSubscriptions(list = []) {
  return Array.isArray(list) ? list.map(normalizeSubscription) : [];
}

export default normalizeSubscription;
