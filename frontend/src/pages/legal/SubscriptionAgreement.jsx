import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Lock, Settings, Users, Gift, CreditCard, Sparkles } from 'lucide-react';
import { LegalLayout, Section, Bullets, CORP } from './LegalLayout';

const BENEFITS = [
  { icon: Sparkles, title: 'CONTROL TOTAL', color: '#06b6d4', desc: 'Administra tu propio entorno privado con capacidad para gestionar más de 500 casos activos, múltiples equipos de trabajo y operaciones simultáneas sin interferencias.' },
  { icon: Cpu, title: 'INDEPENDENCIA TECNOLÓGICA', color: '#3b82f6', desc: 'Infraestructura profesional diseñada para mantener el control total de tu operación jurídica.' },
  { icon: Lock, title: 'SEGURIDAD EMPRESARIAL', color: '#10b981', desc: 'Altos estándares de protección, privacidad, auditoría y control de acceso.' },
  { icon: Settings, title: 'PERSONALIZACIÓN AVANZADA', color: '#8b5cf6', desc: 'Procesos, módulos y automatizaciones adaptables a las necesidades de tu firma.' },
  { icon: Users, title: 'CONSULTORÍA EXCLUSIVA', color: '#f97316', desc: 'Acompañamiento especializado durante implementación y crecimiento operativo.' },
];

const IDEAL = ['Firmas Jurídicas', 'Bufetes Corporativos', 'Redes de Abogados', 'Equipos Jurídicos Empresariales', 'Organizaciones Legales', 'Operaciones de Alto Volumen', 'Equipos con más de 10 profesionales'];

export const SubscriptionAgreement = () => (
  <LegalLayout
    title="CONTRATO DE SUSCRIPCIÓN PROFESIONAL"
    intro={`${CORP.verticalActual} · ${CORP.plataforma}. Este contrato regula la relación entre ${CORP.matriz} y el abogado o firma que se suscribe a la plataforma para operar su práctica jurídica digital en los ${CORP.paisesLatam} países de Latinoamérica donde el servicio está disponible.`}
  >
    {/* ── Bloque de beneficios corporativos ── */}
    <section>
      <h2 className="text-lg lg:text-xl font-bold text-white mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#f97316]" /> Beneficios corporativos</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${b.color}22`, border: `1px solid ${b.color}55` }}>
              <b.icon className="w-5 h-5" style={{ color: b.color }} />
            </div>
            <div className="font-bold text-sm tracking-wide mb-1" style={{ color: b.color }}>{b.title}</div>
            <p className="text-[13px] text-white/65 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-[#f97316]/25 bg-[#f97316]/[0.06] p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-[#f97316] mb-2">Ideal para</div>
        <div className="flex flex-wrap gap-2">
          {IDEAL.map((x) => <span key={x} className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/75">{x}</span>)}
        </div>
      </div>
    </section>

    {/* ── Información comercial ── */}
    <section>
      <h2 className="text-lg lg:text-xl font-bold text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#10b981]" /> Información comercial</h2>
      <div className="grid sm:grid-cols-2 gap-3 text-[15px]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">✔ Prueba gratuita vigente configurada por el sistema.</div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">✔ Sin permanencia obligatoria.</div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">✔ Pagos con <b>Mercado Pago</b>.</div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">✔ Pagos con <b>PayPal</b>.</div>
      </div>
      <div className="mt-3 rounded-xl border border-[#10b981]/30 bg-[#10b981]/[0.08] p-4 flex items-start gap-2 text-[#6ee7b7]">
        <Gift className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span className="text-sm font-medium">Obtén 1 mes adicional gratuito por cada referido válido que complete una suscripción activa.</span>
      </div>
    </section>

    {/* ── Cláusulas del contrato ── */}
    <Section n="1" title="Naturaleza del Servicio">
      <p>{CORP.verticalActual} es una <b>plataforma tecnológica</b> de gestión jurídica operada por {CORP.matriz} sobre {CORP.plataforma}. Provee herramientas digitales (expedientes, documentos, agenda, comunicaciones, asistentes de IA, facturación y administración) para que el abogado opere su práctica. <b>La Plataforma no presta asesoría jurídica, no representa clientes, no emite conceptos legales y no participa en estrategias jurídicas.</b></p>
    </Section>

    <Section n="2" title="Independencia Profesional">
      <p>El abogado suscrito actúa con plena <b>independencia profesional</b>. La Plataforma no dirige, supervisa ni interviene en el ejercicio profesional del abogado. El uso de las herramientas, incluida la IA de asistencia, no sustituye el criterio del profesional, que es el único responsable de validar y decidir sobre cada actuación.</p>
    </Section>

    <Section n="3" title="Responsabilidad sobre Clientes Asignados">
      <p>Una vez que un cliente es asignado o derivado a un abogado a través de la Plataforma, <b>la relación profesional se establece directa y exclusivamente entre el abogado y el cliente</b>. El abogado es el único responsable de:</p>
      <Bullets items={['La atención del cliente.', 'La asesoría jurídica.', 'Los contratos y acuerdos.', 'Los honorarios y su cobro.', 'Las actuaciones procesales y extraprocesales.', 'Los resultados del asunto.']} />
      <p>{CORP.verticalActual} <b>no será responsable</b> por las decisiones profesionales tomadas por los abogados suscritos, ni por los resultados de los asuntos gestionados.</p>
    </Section>

    <Section n="4" title="Seguridad y Protección">
      <p>La Plataforma aplica estándares de seguridad de nivel empresarial: cifrado en tránsito, cifrado Zero-Knowledge para documentos sensibles, control de acceso por roles y permisos, registros de auditoría y monitoreo. El abogado debe custodiar sus credenciales y respetar la confidencialidad de la información de sus clientes y expedientes.</p>
    </Section>

    <Section n="5" title="Período de Prueba">
      <p>La Plataforma ofrece un <b>período de prueba gratuito vigente, configurado por el sistema</b>, que permite evaluar las funcionalidades sin permanencia. Al finalizar el período, el abogado puede contratar un plan para continuar operando. La activación del período de prueba requiere la aceptación previa de este Contrato.</p>
    </Section>

    <Section n="6" title="Suscripciones">
      <p>El acceso continuo se realiza mediante planes de suscripción según el catálogo oficial vigente, sin permanencia obligatoria. El cobro habilita las funciones y límites del plan contratado. Los pagos se procesan mediante <b>Mercado Pago</b> y <b>PayPal</b> (y procesadores futuros). El abogado puede cambiar o cancelar su plan conforme a las condiciones vigentes.</p>
    </Section>

    <Section n="7" title="Programa de Referidos">
      <p>El abogado puede participar en el programa de referidos: <b>obtiene 1 mes adicional gratuito por cada referido válido que complete una suscripción activa</b>, conforme a las reglas del programa vigentes en la Plataforma.</p>
    </Section>

    <Section n="8" title="Propiedad Intelectual">
      <p>El software, marcas, diseños y contenidos del ecosistema Punto Cero pertenecen a {CORP.matriz} o sus licenciantes. Los datos, documentos y expedientes cargados por el abogado son de su titularidad o de la de sus clientes; la Plataforma solo los trata para prestar el servicio mediante una licencia limitada.</p>
    </Section>

    <Section n="9" title="Limitación de Responsabilidad">
      <p>La Plataforma se ofrece como herramienta tecnológica de gestión y asistencia. {CORP.matriz} no garantiza resultados de los asuntos jurídicos —que dependen del abogado— ni responde por interrupciones de terceros, fuerza mayor o uso indebido, dentro de los límites permitidos por la ley aplicable.</p>
    </Section>

    <Section n="10" title="Protección de Datos">
      <p>El tratamiento de datos se rige por la <Link to="/privacy" className="text-[#f97316] hover:underline">Política de Privacidad</Link> y el uso de cookies por la <Link to="/cookies" className="text-[#f97316] hover:underline">Política de Cookies</Link>. La Plataforma adopta estándares internacionales y respeta los derechos de acceso, rectificación, actualización, oposición, eliminación y portabilidad cuando la legislación local lo permita.</p>
    </Section>

    <Section n="11" title="Terminación del Servicio">
      <p>Cualquiera de las partes puede terminar la relación. El abogado puede cancelar su suscripción en cualquier momento; los periodos ya pagados se rigen por las condiciones del plan. Tras la terminación se aplican los plazos de conservación y respaldo jurídico de expedientes, garantizando la portabilidad cuando proceda.</p>
    </Section>

    <Section n="12" title="Legislación Aplicable">
      <p>Se aplica la legislación del país de residencia del abogado en materia de consumo y protección de datos y, en lo no previsto, la del domicilio de {CORP.matriz}, junto con los estándares internacionales adoptados. Las controversias se resolverán de buena fe y, de persistir, ante la jurisdicción competente aplicable.</p>
    </Section>

    <Section n="13" title="Aceptación del Contrato">
      <p>El registro como abogado y la activación del período de prueba requieren la <b>aceptación expresa</b> de este Contrato de Suscripción Profesional, junto con los <Link to="/terms" className="text-[#f97316] hover:underline">Términos y Condiciones</Link>, la <Link to="/privacy" className="text-[#f97316] hover:underline">Política de Privacidad</Link> y la <Link to="/cookies" className="text-[#f97316] hover:underline">Política de Cookies</Link>. La aceptación queda registrada con fecha, hora y usuario.</p>
    </Section>
  </LegalLayout>
);

export default SubscriptionAgreement;
