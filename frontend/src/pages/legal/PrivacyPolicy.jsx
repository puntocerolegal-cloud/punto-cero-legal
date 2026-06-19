import React from 'react';
import { LegalLayout, Section, Bullets, CORP } from './LegalLayout';

export const PrivacyPolicy = () => (
  <LegalLayout
    title="Política de Privacidad y Protección de Datos"
    intro={`${CORP.matriz}, a través de su plataforma tecnológica ${CORP.plataforma} y su vertical operativa ${CORP.verticalActual}, presenta esta Política de Privacidad multinacional aplicable a los usuarios de los ${CORP.paisesLatam} países de Latinoamérica donde el servicio opera digitalmente.`}
  >
    <Section n="1" title="Definiciones">
      <Bullets items={[
        <><b>Ecosistema Punto Cero:</b> conjunto formado por la empresa matriz {CORP.matriz}, la plataforma {CORP.plataforma} y sus verticales (actualmente {CORP.verticalActual}, y futuras como Medicina, Odontología, Contabilidad, Bienes Raíces, Seguros, Educación y Recursos Humanos).</>,
        <><b>Plataforma:</b> el software, las aplicaciones web, las API, los servicios cloud y los módulos que componen {CORP.plataforma}.</>,
        <><b>Usuario:</b> toda persona que registra, accede o interactúa con la Plataforma (visitante, cliente, abogado/profesional, organización o administrador).</>,
        <><b>Datos personales:</b> cualquier información que identifique o permita identificar a una persona natural.</>,
        <><b>Tratamiento:</b> recolección, almacenamiento, uso, circulación, transferencia o supresión de datos.</>,
        <><b>Responsable del tratamiento:</b> {CORP.matriz}, titular del ecosistema.</>,
        <><b>Expediente:</b> unidad central de información que agrupa caso, cliente, documentos, agenda, comunicaciones y datos financieros asociados.</>,
      ]} />
    </Section>

    <Section n="2" title="Objeto">
      <p>La presente Política regula cómo {CORP.matriz} recopila, utiliza, protege, conserva y comparte la información de los Usuarios dentro de {CORP.plataforma}, garantizando un tratamiento lícito, leal, transparente y proporcional a las finalidades declaradas.</p>
    </Section>

    <Section n="3" title="Alcance">
      <p>Esta Política aplica a todos los módulos y funcionalidades de la Plataforma, incluyendo —de forma enunciativa y no limitativa— el registro de usuarios, abogados y organizaciones; la gestión de clientes, expedientes y documentos; la agenda y reuniones; la IA Jurídica y asistentes inteligentes; el chat de soporte y el chatbot; el marketplace profesional; la asignación de casos, derivación de clientes y transferencia de expedientes; el almacenamiento y los servicios cloud; las comunicaciones por correo electrónico y WhatsApp; la facturación, suscripciones, periodos de prueba, referidos y programas de fidelización; las automatizaciones; los roles y permisos; las auditorías internas; la analítica; y el procesamiento de pagos.</p>
      <p>Aplica a la vertical actual {CORP.verticalActual} y queda redactada para extenderse, sin reescritura, a las futuras verticales del ecosistema, sin afectar la operación vigente.</p>
    </Section>

    <Section n="4" title="Usuarios">
      <Bullets items={[
        'Visitantes de la Landing y formularios públicos de captación.',
        'Clientes que solicitan orientación o servicios jurídicos.',
        'Abogados y profesionales que se registran, son verificados y prestan servicios.',
        'Organizaciones (firmas, despachos o entidades) que administran equipos y suscripciones.',
        'Administradores y operadores del Centro de Gestión.',
      ]} />
    </Section>

    <Section n="5" title="Registro y acceso">
      <p>El registro requiere datos veraces y actualizados. El acceso se realiza mediante credenciales individuales protegidas y, según el rol, mediante mecanismos de verificación. Cada Usuario es responsable de la confidencialidad de sus credenciales. El acceso a la información se rige por un modelo de roles y permisos que limita la visibilidad a lo estrictamente necesario para cada función.</p>
    </Section>

    <Section n="6" title="Tratamiento de datos">
      <p>El tratamiento se realiza conforme a los principios de finalidad, libertad, veracidad, transparencia, acceso restringido, seguridad y confidencialidad. {CORP.matriz} mantiene la base de datos operativa ligera, delegando el almacenamiento documental en la nube vinculada a la cuenta del suscriptor cuando aplica.</p>
    </Section>

    <Section n="7" title="Información recopilada">
      <Bullets items={[
        'Datos de identificación y contacto: nombre, correo, teléfono, país, ciudad, documento profesional.',
        'Datos profesionales del abogado: especialidad, experiencia, tarjeta profesional, firma/organización.',
        'Datos de clientes y expedientes: información del caso, materia, contraparte, documentos y pruebas aportadas.',
        'Datos de actividad: agenda, reuniones, cronología del expediente, actividades y notificaciones.',
        'Datos comerciales y financieros: plan, suscripción, facturas, abonos, referidos y movimientos.',
        'Datos de comunicaciones: mensajes de correo, WhatsApp, chat de soporte y chatbot.',
        'Datos técnicos: dirección IP, dispositivo, cookies, analítica de uso y registros de auditoría.',
        'Contenido procesado por IA: consultas y contexto del expediente para asistencia jurídica.',
      ]} />
    </Section>

    <Section n="8" title="Finalidades del tratamiento">
      <Bullets items={[
        'Prestar y operar los servicios de la Plataforma y sus módulos.',
        'Crear y gestionar expedientes, asignar casos y coordinar la atención profesional.',
        'Habilitar comunicaciones por correo y WhatsApp con clientes y profesionales.',
        'Proveer asistencia mediante IA Jurídica y asistentes inteligentes sobre el contexto del expediente.',
        'Gestionar suscripciones, periodos de prueba, facturación, referidos y fidelización.',
        'Garantizar seguridad, prevención del fraude, auditoría y cumplimiento legal.',
        'Mejorar la Plataforma mediante analítica agregada y métricas de uso.',
      ]} />
    </Section>

    <Section n="9" title="Bases legales">
      <p>El tratamiento se fundamenta, según la jurisdicción aplicable, en: (i) el consentimiento del Usuario; (ii) la ejecución del contrato de servicio; (iii) el cumplimiento de obligaciones legales; (iv) el interés legítimo de operar y asegurar la Plataforma. Cuando la ley local exija consentimiento expreso, este se solicitará de forma previa e informada.</p>
    </Section>

    <Section n="10" title="Seguridad de la información">
      <p>Se aplican controles técnicos y organizativos acordes a estándares internacionales: cifrado en tránsito y, para documentos sensibles, cifrado de extremo a extremo (Zero-Knowledge) en el navegador; control de acceso por roles y permisos; registros de auditoría; segregación de entornos; y monitoreo de seguridad. Ningún sistema es infalible, por lo que el Usuario colabora manteniendo la confidencialidad de sus credenciales.</p>
    </Section>

    <Section n="11" title="Conservación de datos">
      <p>Los datos se conservan mientras exista relación con el Usuario y durante los plazos exigidos por la legislación aplicable (obligaciones contables, fiscales, profesionales y de respaldo jurídico de expedientes). Concluidos dichos plazos, los datos se eliminan o anonimizan de forma segura.</p>
    </Section>

    <Section n="12" title="Transferencias internacionales">
      <p>Dado que {CORP.plataforma} opera digitalmente en {CORP.paisesLatam} países de Latinoamérica y utiliza proveedores cloud, los datos pueden ser procesados en distintas jurisdicciones. Toda transferencia internacional se realiza con salvaguardas adecuadas y bajo estándares internacionales de protección de datos.</p>
    </Section>

    <Section n="13" title="Uso de cookies">
      <p>La Plataforma utiliza cookies y tecnologías similares para autenticación, preferencias, seguridad y analítica. El detalle y la gestión se describen en la <a href="/cookies" className="text-[#f97316] hover:underline">Política de Cookies</a>.</p>
    </Section>

    <Section n="14" title="Servicios de terceros">
      <p>La Plataforma integra servicios de terceros para mensajería (WhatsApp/Meta), correo (SMTP), videoconferencia, modelos de inteligencia artificial, almacenamiento cloud y analítica. Cada proveedor trata los datos conforme a sus propias políticas; {CORP.matriz} selecciona proveedores que ofrezcan garantías adecuadas.</p>
    </Section>

    <Section n="15" title="Procesamiento de pagos">
      <p>Los pagos se procesan mediante pasarelas externas, actualmente <b>Mercado Pago</b> y, de forma prevista, <b>PayPal</b> y otros procesadores futuros. {CORP.matriz} no almacena datos completos de tarjetas; dicha información es gestionada directamente por el procesador bajo estándares de la industria (PCI-DSS).</p>
    </Section>

    <Section n="16" title="Inteligencia Artificial">
      <p>La IA Jurídica y los asistentes inteligentes procesan las consultas y el contexto del expediente (materia, resumen, identificadores) para generar respuestas de apoyo. La IA es una herramienta de asistencia y no sustituye el criterio profesional del abogado. El contenido generado no constituye asesoría legal definitiva ni crea relación abogado-cliente con la Plataforma.</p>
    </Section>

    <Section n="17" title="Comunicaciones electrónicas">
      <p>Al registrarse, el Usuario acepta recibir comunicaciones operativas y transaccionales por correo y WhatsApp (confirmaciones, notificaciones de casos, recordatorios). Las comunicaciones comerciales podrán deshabilitarse según las opciones disponibles y la legislación aplicable.</p>
    </Section>

    <Section n="18" title="Derechos de los usuarios">
      <p>Cuando la legislación local lo permita, el Usuario puede ejercer los derechos de <b>acceso, rectificación, actualización, oposición, eliminación (supresión) y portabilidad</b> de sus datos, así como revocar el consentimiento. Las solicitudes se atienden a través del contacto corporativo indicado en esta Política.</p>
    </Section>

    <Section n="19" title="Obligaciones de los usuarios">
      <Bullets items={[
        'Proporcionar información veraz y mantenerla actualizada.',
        'Usar la Plataforma de forma lícita y conforme a su perfil profesional.',
        'Custodiar sus credenciales y respetar los roles y permisos asignados.',
        'No vulnerar la confidencialidad de clientes, expedientes ni de terceros.',
      ]} />
    </Section>

    <Section n="20" title="Obligaciones de la plataforma">
      <Bullets items={[
        'Tratar los datos conforme a esta Política y a la ley aplicable.',
        'Aplicar medidas de seguridad razonables y estándares internacionales.',
        'Atender el ejercicio de derechos de los titulares.',
        'Notificar incidentes de seguridad relevantes cuando corresponda.',
      ]} />
    </Section>

    <Section n="21" title="Propiedad intelectual">
      <p>El software, la marca, los diseños y los contenidos del ecosistema Punto Cero son propiedad de {CORP.matriz} o de sus licenciantes. Los datos y documentos cargados por el Usuario permanecen bajo su titularidad; el Usuario otorga a la Plataforma una licencia limitada para tratarlos con el fin de prestar el servicio.</p>
    </Section>

    <Section n="22" title="Licencias de uso">
      <p>El acceso a la Plataforma se concede mediante una licencia de uso personal, intransferible y revocable, vinculada al plan contratado y sujeta a estos términos. Queda prohibida la ingeniería inversa, la reventa no autorizada o el uso fuera del alcance del plan.</p>
    </Section>

    <Section n="23" title="Suspensión de cuentas">
      <p>{CORP.matriz} podrá suspender cuentas ante incumplimientos, riesgos de seguridad, falta de pago o uso indebido, procurando la notificación previa cuando sea posible.</p>
    </Section>

    <Section n="24" title="Terminación del servicio">
      <p>El Usuario puede terminar su relación en cualquier momento. Tras la terminación, los datos se conservan o eliminan según los plazos legales y de respaldo jurídico aplicables, garantizando la portabilidad cuando proceda.</p>
    </Section>

    <Section n="25" title="Limitación de responsabilidad">
      <p>La Plataforma se ofrece como herramienta tecnológica de gestión y asistencia. {CORP.matriz} no responde por el resultado de los asuntos jurídicos, que dependen del criterio profesional del abogado, ni por interrupciones derivadas de terceros o fuerza mayor, dentro de los límites permitidos por la ley.</p>
    </Section>

    <Section n="26" title="Modificaciones futuras">
      <p>Esta Política podrá actualizarse para reflejar nuevas funcionalidades, verticales o requisitos legales. Los cambios sustanciales se comunicarán por los canales habituales y la versión vigente estará siempre disponible en esta página.</p>
    </Section>

    <Section n="27" title="Legislación aplicable">
      <p>Se aplica la legislación de protección de datos del país de residencia del Usuario. En lo no previsto, rige la legislación del domicilio de la empresa matriz y los estándares internacionales adoptados por la Plataforma.</p>
    </Section>

    <Section n="28" title="Resolución de conflictos">
      <p>Las partes procurarán resolver cualquier controversia de buena fe. De no lograrse, se someterán a los mecanismos de resolución y a la jurisdicción competente según la legislación aplicable al Usuario.</p>
    </Section>

    <Section n="29" title="Contacto corporativo">
      <p>{CORP.matriz} — {CORP.plataforma} · {CORP.verticalActual}.<br />
        Correo: <a href={`mailto:${CORP.email}`} className="text-[#f97316] hover:underline">{CORP.email}</a><br />
        WhatsApp: {CORP.whatsappCo} (Colombia) · {CORP.whatsappVe} (Venezuela).</p>
    </Section>
  </LegalLayout>
);

export default PrivacyPolicy;
