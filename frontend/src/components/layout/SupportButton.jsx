import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

// Número de soporte oficial (mismo que la Landing). Para cambiarlo, edita esta
// constante; es el único punto de configuración del soporte del dashboard.
const SUPPORT_WHATSAPP = '573028322083';

/**
 * Acceso rápido a Soporte por WhatsApp — visible en el header de TODO el dashboard.
 * Precarga nombre, correo, organización y plan activo del abogado. Abre WhatsApp
 * en una pestaña nueva. No crea tickets ni toca el backend.
 */
export function SupportButton() {
  const { user } = useAuth();
  const { access } = useSubscription();
  const plan = access?.plan?.name || '—';
  const org = user?.firm_name || user?.organization || '—';

  const text =
    `Hola, necesito soporte de Punto Cero System OS.\n` +
    `Abogado: ${user?.full_name || '—'}\n` +
    `Correo: ${user?.email || '—'}\n` +
    `Organización: ${org}\n` +
    `Plan activo: ${plan}`;
  const href = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Soporte por WhatsApp"
      aria-label="Soporte por WhatsApp"
      data-testid="support-button"
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#25d366]/15 border border-[#25d366]/40 text-[#6ee7b7] hover:bg-[#25d366]/25 transition-colors text-xs font-semibold"
    >
      <LifeBuoy className="w-4 h-4" />
      <span className="hidden sm:inline">Soporte</span>
    </a>
  );
}

export default SupportButton;
