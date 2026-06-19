import React from 'react';
import { LegalLayout, Section, Bullets, CORP } from './LegalLayout';

export const TermsConditions = () => (
  <LegalLayout
    title="Términos y Condiciones de Uso"
    intro={`Estos Términos regulan el acceso y uso de ${CORP.plataforma}, plataforma tecnológica de ${CORP.matriz}, en su vertical ${CORP.verticalActual}, disponible digitalmente en ${CORP.paisesLatam} países de Latinoamérica. Al registrarse o utilizar la Plataforma, el Usuario acepta estos Términos.`}
  >
    <Section n="1" title="Definiciones">
      <Bullets items={[
        <><b>Empresa:</b> {CORP.matriz} (firma comercial {CORP.firmaComercial}), titular del ecosistema.</>,
        <><b>Plataforma:</b> {CORP.plataforma}, software, aplicaciones, API y servicios cloud.</>,
        <><b>Vertical:</b> línea de negocio operada sobre la Plataforma; la actual es {CORP.verticalActual}.</>,
        <><b>Usuario:</b> visitante, cliente, abogado/profesional, organización o administrador.</>,
        <><b>Servicios:</b> funcionalidades y módulos disponibles según el plan contratado.</>,
      ]} />
    </Section>

    <Section n="2" title="Objeto">
      <p>Regular la relación entre la Empresa y el Usuario respecto del uso de la Plataforma como herramienta de gestión jurídica y profesional: captación, expedientes, documentos, agenda, comunicaciones, IA de asistencia, facturación y suscripciones.</p>
    </Section>

    <Section n="3" title="Alcance">
      <p>Aplica a todos los módulos: registro de usuarios, abogados y organizaciones; gestión de clientes, expedientes y documentos; agenda y reuniones; IA Jurídica y asistentes; chat de soporte y chatbot; marketplace profesional; asignación de casos, derivación de clientes y transferencia de expedientes; almacenamiento y cloud; comunicaciones por correo y WhatsApp; facturación, suscripciones, periodos de prueba, referidos y fidelización; automatizaciones; roles y permisos; auditorías; analítica; e integraciones actuales y futuras. Queda redactado para futuras verticales (Medicina, Odontología, Contabilidad, Bienes Raíces, Seguros, Educación, Recursos Humanos y otras) sin afectar la operación vigente.</p>
    </Section>

    <Section n="4" title="Usuarios">
      <p>El uso profesional está reservado a abogados y profesionales que declaren credenciales veraces. Los clientes acceden para solicitar y dar seguimiento a sus asuntos. Las organizaciones administran equipos, roles y suscripciones. El Usuario declara tener capacidad legal para contratar.</p>
    </Section>

    <Section n="5" title="Registro y acceso">
      <p>El registro exige información veraz, completa y actualizada. El abogado puede requerir verificación previa a su activación. Las credenciales son personales e intransferibles; el Usuario responde por las actividades realizadas con su cuenta y por respetar el modelo de roles y permisos.</p>
    </Section>

    <Section n="6" title="Tratamiento de datos">
      <p>El tratamiento de datos se rige por la <a href="/privacy" className="text-[#f97316] hover:underline">Política de Privacidad</a>, parte integrante de estos Términos. El Usuario es responsable de la licitud de los datos de terceros (clientes) que incorpore a la Plataforma.</p>
    </Section>

    <Section n="7" title="Información recopilada">
      <p>Se recopila la información necesaria para operar los Servicios, según el detalle de la Política de Privacidad (identificación, datos profesionales, expedientes, actividad, datos comerciales, comunicaciones y datos técnicos).</p>
    </Section>

    <Section n="8" title="Finalidades del tratamiento">
      <p>Prestar los Servicios, gestionar expedientes y asignaciones, habilitar comunicaciones, ofrecer asistencia mediante IA, administrar pagos y suscripciones, y garantizar seguridad y cumplimiento.</p>
    </Section>

    <Section n="9" title="Bases legales">
      <p>El uso de la Plataforma se sustenta en la ejecución del contrato de servicio, el consentimiento del Usuario, el cumplimiento de obligaciones legales y el interés legítimo de la Empresa, según la jurisdicción aplicable.</p>
    </Section>

    <Section n="10" title="Seguridad de la información">
      <p>La Empresa aplica medidas técnicas y organizativas conforme a estándares internacionales, incluyendo cifrado en tránsito y cifrado Zero-Knowledge para documentos sensibles. El Usuario debe mantener la confidencialidad de sus credenciales y reportar usos no autorizados.</p>
    </Section>

    <Section n="11" title="Conservación de datos">
      <p>Los datos y expedientes se conservan durante la relación contractual y los plazos legales de respaldo. El archivo y respaldo jurídico de expedientes puede mantenerse conforme a las obligaciones profesionales aplicables.</p>
    </Section>

    <Section n="12" title="Transferencias internacionales">
      <p>La operación en {CORP.paisesLatam} países y el uso de proveedores cloud implican que la información puede procesarse en distintas jurisdicciones, con salvaguardas adecuadas y estándares internacionales.</p>
    </Section>

    <Section n="13" title="Uso de cookies">
      <p>El uso de cookies y almacenamiento local se rige por la <a href="/cookies" className="text-[#f97316] hover:underline">Política de Cookies</a>.</p>
    </Section>

    <Section n="14" title="Servicios de terceros">
      <p>La Plataforma integra servicios de terceros (mensajería, correo, video, IA, cloud y pagos). El Usuario acepta que dichos servicios se rigen por las políticas de sus respectivos proveedores y que su disponibilidad puede variar.</p>
    </Section>

    <Section n="15" title="Procesamiento de pagos">
      <Bullets items={[
        <>Los pagos de suscripciones y servicios se procesan mediante <b>Mercado Pago</b> y, de forma prevista, <b>PayPal</b> y otros procesadores futuros.</>,
        'La Empresa no almacena datos completos de tarjetas; los gestiona el procesador bajo estándares de la industria.',
        'Los precios se muestran en la moneda local según el país y el catálogo oficial de planes vigente.',
        'El cobro de un plan habilita las funciones y límites correspondientes a dicho plan.',
      ]} />
    </Section>

    <Section n="16" title="Inteligencia Artificial">
      <p>La IA Jurídica y los asistentes inteligentes brindan apoyo de redacción y análisis sobre el contexto del expediente. Sus respuestas son orientativas, no constituyen asesoría legal definitiva ni generan relación abogado-cliente con la Plataforma; la decisión profesional corresponde al abogado.</p>
    </Section>

    <Section n="17" title="Comunicaciones electrónicas">
      <p>El Usuario acepta recibir comunicaciones operativas por correo y WhatsApp inherentes al servicio (notificaciones de casos, recordatorios de agenda, estados de facturación) y podrá gestionar las comunicaciones comerciales según las opciones disponibles.</p>
    </Section>

    <Section n="18" title="Derechos de los usuarios">
      <p>El Usuario puede ejercer los derechos de acceso, rectificación, actualización, oposición, eliminación y portabilidad de datos cuando la legislación local lo permita, conforme a la Política de Privacidad.</p>
    </Section>

    <Section n="19" title="Obligaciones de los usuarios">
      <Bullets items={[
        'Utilizar la Plataforma de forma lícita, ética y conforme a su perfil.',
        'No suplantar identidades ni vulnerar la confidencialidad de clientes o expedientes.',
        'No introducir software malicioso ni intentar accesos no autorizados.',
        'Respetar los límites del plan y no revender el servicio sin autorización.',
        'Mantener la veracidad de su información profesional.',
      ]} />
    </Section>

    <Section n="20" title="Obligaciones de la plataforma">
      <Bullets items={[
        'Proveer los Servicios conforme al plan contratado con disponibilidad razonable.',
        'Aplicar medidas de seguridad y respetar la privacidad de los datos.',
        'Informar cambios sustanciales y mantener la documentación legal accesible.',
        'Brindar canales de soporte para la atención del Usuario.',
      ]} />
    </Section>

    <Section n="21" title="Propiedad intelectual">
      <p>El software, marcas, logotipos, diseños y contenidos del ecosistema Punto Cero pertenecen a la Empresa o a sus licenciantes. Los datos y documentos del Usuario son de su titularidad; la Empresa solo los trata para prestar el servicio.</p>
    </Section>

    <Section n="22" title="Licencias de uso">
      <p>Se concede una licencia de uso personal, limitada, intransferible y revocable, sujeta al plan y a estos Términos. Queda prohibida la copia, modificación, descompilación o explotación no autorizada de la Plataforma.</p>
    </Section>

    <Section n="23" title="Suspensión de cuentas">
      <p>La Empresa podrá suspender o restringir el acceso ante incumplimientos, falta de pago, riesgos de seguridad o uso indebido, procurando notificación previa cuando sea posible y preservando la integridad de los expedientes.</p>
    </Section>

    <Section n="24" title="Terminación del servicio">
      <p>Cualquiera de las partes puede terminar la relación. El Usuario puede cancelar su suscripción; los periodos ya pagados se rigen por las condiciones del plan. Tras la terminación, se aplican los plazos de conservación y portabilidad correspondientes.</p>
    </Section>

    <Section n="25" title="Limitación de responsabilidad">
      <p>La Plataforma es una herramienta tecnológica de gestión y asistencia. La Empresa no garantiza resultados de los asuntos jurídicos —que dependen del abogado— ni responde por indisponibilidades de terceros, fuerza mayor o uso indebido, dentro de los límites permitidos por la ley aplicable.</p>
    </Section>

    <Section n="26" title="Modificaciones futuras">
      <p>La Empresa podrá modificar estos Términos por evolución de la Plataforma, nuevas verticales o requisitos legales. El uso continuado tras la publicación implica aceptación de la versión vigente.</p>
    </Section>

    <Section n="27" title="Legislación aplicable">
      <p>Se aplica la legislación del país de residencia del Usuario en lo relativo a consumo y protección de datos y, en lo no previsto, la del domicilio de la Empresa, junto con los estándares internacionales adoptados.</p>
    </Section>

    <Section n="28" title="Resolución de conflictos">
      <p>Las controversias se resolverán de buena fe mediante negociación directa y, de persistir, mediante los mecanismos de conciliación o arbitraje y la jurisdicción competente conforme a la legislación aplicable al Usuario.</p>
    </Section>

    <Section n="29" title="Contacto corporativo">
      <p>{CORP.matriz} — {CORP.plataforma} · {CORP.verticalActual}.<br />
        Correo: <a href={`mailto:${CORP.email}`} className="text-[#f97316] hover:underline">{CORP.email}</a><br />
        WhatsApp: {CORP.whatsappCo} (Colombia) · {CORP.whatsappVe} (Venezuela).</p>
    </Section>
  </LegalLayout>
);

export default TermsConditions;
