// Países oficiales de Punto Cero — fuente única para selectores internacionales.
export const COUNTRIES = [
  { iso: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
  { iso: "EC", name: "Ecuador", dial: "+593", flag: "🇪🇨" },
  { iso: "PE", name: "Perú", dial: "+51", flag: "🇵🇪" },
  { iso: "VE", name: "Venezuela", dial: "+58", flag: "🇻🇪" },
  { iso: "BO", name: "Bolivia", dial: "+591", flag: "🇧🇴" },
  { iso: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { iso: "HN", name: "Honduras", dial: "+504", flag: "🇭🇳" },
  { iso: "GT", name: "Guatemala", dial: "+502", flag: "🇬🇹" },
  { iso: "SV", name: "El Salvador", dial: "+503", flag: "🇸🇻" },
  { iso: "PA", name: "Panamá", dial: "+507", flag: "🇵🇦" },
  { iso: "DO", name: "República Dominicana", dial: "+1-809", flag: "🇩🇴" },
  { iso: "PR", name: "Puerto Rico", dial: "+1-787", flag: "🇵🇷" },
  { iso: "NI", name: "Nicaragua", dial: "+505", flag: "🇳🇮" },
  { iso: "CL", name: "Chile", dial: "+56", flag: "🇨🇱" },
  { iso: "MX", name: "México", dial: "+52", flag: "🇲🇽" },
  { iso: "UY", name: "Uruguay", dial: "+598", flag: "🇺🇾" },
  { iso: "ES", name: "España", dial: "+34", flag: "🇪🇸" },
  { iso: "PY", name: "Paraguay", dial: "+595", flag: "🇵🇾" },
  { iso: "CR", name: "Costa Rica", dial: "+506", flag: "🇨🇷" },
  { iso: "CU", name: "Cuba", dial: "+53", flag: "🇨🇺" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Colombia

// Idiomas y zonas horarias soportados (para configuración de país).
export const LANGUAGES = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
  { code: "pt", name: "Português" },
];

export const TIMEZONES = [
  "America/Bogota", "America/Guayaquil", "America/Lima", "America/Caracas",
  "America/La_Paz", "America/Argentina/Buenos_Aires", "America/Tegucigalpa",
  "America/Guatemala", "America/El_Salvador", "America/Panama",
  "America/Santo_Domingo", "America/Puerto_Rico", "America/Managua",
  "America/Santiago", "America/Mexico_City", "America/Montevideo",
  "Europe/Madrid", "America/Asuncion", "America/Costa_Rica", "America/Havana",
];
