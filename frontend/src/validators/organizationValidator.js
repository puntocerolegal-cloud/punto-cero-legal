import { makeResult, requireFields, requireOneOf } from "./_validatorBase";

export function validateOrganization(org = {}) {
  const errors = [
    ...requireFields(org, ["name", "vertical", "plan"]),
    ...requireOneOf(org, "status", ["active", "trial", "at_risk", "suspended"]),
  ];
  return makeResult(errors);
}

export default validateOrganization;
