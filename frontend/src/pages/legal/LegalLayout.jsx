import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

// ── Datos corporativos del ecosistema (fuente única para la documentación legal) ──
export const CORP = {
  matriz: 'Punto Cero Multiservicios',
  firmaComercial: 'Inversiones y Variedades DJGG 2013',
  plataforma: 'Punto Cero System OS',
  verticalActual: 'Punto Cero Legal',
  verticalesFuturas: ['Medicina', 'Odontología', 'Contabilidad', 'Bienes Raíces', 'Seguros', 'Educación', 'Recursos Humanos'],
  email: 'puntocerolegal@gmail.com',
  whatsappCo: '+57 302 832 2083',
  whatsappVe: '+58 0424 648 7378',
  paisesLatam: 18,
  updated: '18 de junio de 2026',
};

/**
 * Layout institucional para las páginas legales (mismo lenguaje visual de la Landing:
 * fondo #0f172a, acentos #f97316, logo PD System). No altera ninguna funcionalidad.
 */
export function LegalLayout({ title, intro, children }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#0f172a]/85 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" aria-label="Inicio Punto Cero">
            <img src="/logo-pd-system.png" alt="Punto Cero" className="w-9 h-9 object-contain rounded" />
            <span className="text-lg font-bold tracking-tight">PUNTO CERO</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#f97316]">
            <ShieldCheck className="w-3.5 h-3.5" /> {CORP.plataforma} · Documentación legal
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mt-3 leading-tight">{title}</h1>
          {intro && <p className="text-white/60 mt-3 leading-relaxed">{intro}</p>}
          <p className="text-white/40 text-xs mt-3">Última actualización: {CORP.updated} · Vigencia inmediata desde su publicación.</p>
        </div>

        <article className="space-y-9 text-white/75">{children}</article>

        <div className="mt-16 pt-8 border-t border-white/10 text-white/40 text-xs flex flex-col sm:flex-row gap-4 justify-between">
          <span>© 2026 {CORP.verticalActual.toUpperCase()} · {CORP.matriz}. Todos los derechos reservados.</span>
          <nav className="flex gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Términos</Link>
          </nav>
        </div>
      </main>
    </div>
  );
}

/** Sección numerada del documento legal. */
export const Section = ({ n, title, children }) => (
  <section>
    <h2 className="text-lg lg:text-xl font-bold text-white mb-3 scroll-mt-24">{n}. {title}</h2>
    <div className="space-y-3 text-[15px] leading-relaxed">{children}</div>
  </section>
);

/** Lista con viñetas reutilizable. */
export const Bullets = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5 text-white/70">
    {items.map((t, i) => <li key={i}>{t}</li>)}
  </ul>
);

export default LegalLayout;
