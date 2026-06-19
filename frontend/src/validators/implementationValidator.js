import { makeResult, requireFields, requireOneOf } from "./_validatorBase";

const STAGES = ["vendido", "kickoff", "configuracion", "capacitacion", "pruebas", "golive", "operacion"];

export function validateImplementation(impl = {}) {
  const errors = [
    ...requireFields(impl, ["company", "vertical", "stage"]),
    ...requireOneOf(impl, "stage", STAGES),
  ];
  if (impl.progress != null && (impl.progress < 0 || impl.progress > 100)) {
    errors.push("'progress' debe estar entre 0 y 100");
  }
  return makeResult(errors);
}

export default validateImplementation;
