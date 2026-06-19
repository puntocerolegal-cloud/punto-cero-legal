import { makeResult, requireFields, requireOneOf } from "./_validatorBase";

export function validateInvoice(invoice = {}) {
  const errors = [
    ...requireFields(invoice, ["invoice", "client", "amount"]),
    ...requireOneOf(invoice, "status", ["paid", "pending", "overdue", "review"]),
  ];
  if (invoice.amount != null && Number(invoice.amount) < 0) {
    errors.push("'amount' no puede ser negativo");
  }
  return makeResult(errors);
}

export default validateInvoice;
