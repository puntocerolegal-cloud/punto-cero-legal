import { makeResult, requireFields, requireOneOf } from "./_validatorBase";

export function validateSubscription(sub = {}) {
  const errors = [
    ...requireFields(sub, ["company", "plan"]),
    ...requireOneOf(sub, "status", ["active", "trial", "past_due", "cancelled"]),
  ];
  if (sub.monthly != null && Number(sub.monthly) < 0) {
    errors.push("'monthly' no puede ser negativo");
  }
  return makeResult(errors);
}

export default validateSubscription;
