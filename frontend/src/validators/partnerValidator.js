import { makeResult, requireFields, requireOneOf } from "./_validatorBase";

export function validatePartner(partner = {}) {
  const errors = [
    ...requireFields(partner, ["company", "vertical"]),
    ...requireOneOf(partner, "status", ["active", "pending", "inactive"]),
  ];
  return makeResult(errors);
}

export default validatePartner;
