import React from 'react';
import { LegalLayout, Section, Bullets, CORP } from './LegalLayout';

export const CookiePolicy = () => (
  <LegalLayout
    title="Política de Cookies"
    intro={`Esta Política de Cookies explica cómo ${CORP.plataforma}, plataforma de ${CORP.matriz} operada en su vertical ${CORP.verticalActual}, utiliza cookies y tecnologías similares en los ${CORP.paisesLatam} países de Latinoamérica donde presta servicio.`}
  >
    <Section n="1" title="Definiciones">
      <Bullets items={[
        <><b>Cookie:</b> pequeño archivo que un sitio almacena en el dispositivo del Usuario para recordar información.</>,
        <><b>Tecnologías similares:</b> almacenamiento local (localStorage/sessionStorage), píxeles y tokens de sesión.</>,
        <><b>Cookies propias:</b> establecidas por la Plataforma.</>,
        <><b>Cookies de terceros:</b> establecidas por proveedores integrados (analítica, pagos, mensajería, video).</>,
      ]} />
    </Section>

    <Section n="2" title="Objeto">
      <p>Informar de forma transparente sobre las cookies y tecnologías de almacenamiento empleadas, sus finalidades y los mecanismos de gestión disponibles para el Usuario.</p>
    </Section>

    <Section n="3" title="Alcance">
      <p>Aplica a la Landing, al panel de la Oficina Virtual y a todos los módulos de {CORP.plataforma} ({CORP.verticalActual} y futuras verticales), sin afectar la operación vigente.</p>
    </Section>

    <Section n="4" title="Tipos de cookies y tecnologías utilizadas">
      <Bullets items={[
        <><b>Estrictamente necesarias:</b> autenticación, sesión segura, balanceo y seguridad (no requieren consentimiento).</>,
        <><b>De preferencias:</b> idioma, país/moneda, plan y configuración de la experiencia.</>,
        <><b>De funcionalidad:</b> mantienen el contexto de expediente activo, frases de cifrado de sesión y estados de la interfaz.</>,
        <><b>Analíticas:</b> métricas agregadas de uso para mejorar la Plataforma.</>,
        <><b>De terceros:</b> establecidas por procesadores de pago, mensajería y video al utilizar dichos servicios.</>,
      ]} />
      <p className="text-white/50 text-sm">La Plataforma utiliza almacenamiento local del navegador para conservar el token de sesión, las preferencias comerciales y el expediente activo, manteniendo la base de datos central ligera.</p>
    </Section>

    <Section n="5" title="Finalidades del tratamiento mediante cookies">
      <Bullets items={[
        'Autenticar al Usuario y mantener la sesión activa de forma segura.',
        'Recordar preferencias regionales (país, moneda, idioma) y de visualización.',
        'Preservar el contexto operativo (expediente/cliente activo) entre pantallas.',
        'Medir el rendimiento y el uso de la Plataforma de forma agregada.',
        'Prevenir fraude y reforzar la seguridad informática.',
      ]} />
    </Section>

    <Section n="6" title="Servicios de terceros">
      <p>Al usar funciones que integran terceros —Mercado Pago y futuros procesadores como PayPal, mensajería WhatsApp/Meta, videoconferencia y modelos de inteligencia artificial— dichos proveedores pueden establecer sus propias cookies conforme a sus políticas. {CORP.matriz} selecciona proveedores con garantías adecuadas.</p>
    </Section>

    <Section n="7" title="Procesamiento de pagos">
      <p>Las pasarelas de pago pueden emplear cookies para prevención de fraude y continuidad de la transacción. Estas cookies son gestionadas por el procesador correspondiente.</p>
    </Section>

    <Section n="8" title="Analítica">
      <p>La analítica se utiliza de forma agregada y orientada a mejorar la Plataforma; no se emplea para decisiones automatizadas que produzcan efectos jurídicos sobre el Usuario sin su conocimiento.</p>
    </Section>

    <Section n="9" title="Conservación">
      <p>Las cookies de sesión expiran al cerrar sesión o el navegador; las persistentes se conservan por el plazo necesario para su finalidad o hasta que el Usuario las elimine.</p>
    </Section>

    <Section n="10" title="Transferencias internacionales">
      <p>Al operar en {CORP.paisesLatam} países y con proveedores cloud, la información asociada a cookies puede procesarse en distintas jurisdicciones, siempre bajo estándares internacionales de protección de datos.</p>
    </Section>

    <Section n="11" title="Gestión y desactivación">
      <p>El Usuario puede configurar su navegador para bloquear o eliminar cookies y limpiar el almacenamiento local. La desactivación de cookies estrictamente necesarias puede impedir el funcionamiento de la autenticación y de ciertos módulos.</p>
    </Section>

    <Section n="12" title="Derechos de los usuarios">
      <p>El Usuario conserva los derechos descritos en la <a href="/privacy" className="text-[#f97316] hover:underline">Política de Privacidad</a> (acceso, rectificación, actualización, oposición, eliminación y portabilidad), cuando la legislación local lo permita.</p>
    </Section>

    <Section n="13" title="Modificaciones futuras">
      <p>Esta Política podrá actualizarse ante nuevas integraciones, verticales o requisitos legales; la versión vigente estará siempre disponible en esta página.</p>
    </Section>

    <Section n="14" title="Legislación aplicable y contacto">
      <p>Rige la legislación aplicable al país del Usuario y los estándares internacionales adoptados. Consultas: {CORP.matriz} — <a href={`mailto:${CORP.email}`} className="text-[#f97316] hover:underline">{CORP.email}</a> · WhatsApp {CORP.whatsappCo}.</p>
    </Section>
  </LegalLayout>
);

export default CookiePolicy;
