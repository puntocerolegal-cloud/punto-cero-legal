/**
 * A.F.I. - AUDITOR FUNCIONAL INTELIGENTE
 * Motor Principal del Sistema de Certificación Automática
 * 
 * Filosofía: NO analices el código → ANALIZA EL COMPORTAMIENTO
 * 
 * @author Sistema AFI
 * @version 1.0.0
 * @date 2026-07-18
 */

const { chromium } = require('playwright');
const NavegadorAutonomo = require('./NavegadorAutonomo');
const InteractorUniversal = require('./InteractorUniversal');
const ValidadorComportamiento = require('./ValidadorComportamiento');
const MotorEvidencia = require('../evidence/MotorEvidencia');
const HTMLReporter = require('../reporters/HTMLReporter');

class AFIEngine {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000',
      adminPath: config.adminPath || '/admin',
      headless: config.headless !== undefined ? config.headless : false,
      recordVideo: config.recordVideo !== undefined ? config.recordVideo : true,
      screenshotOnError: config.screenshotOnError !== undefined ? config.screenshotOnError : true,
      timeout: config.timeout || 30000,
      slowMo: config.slowMo || 500, // Delay entre acciones para simular humano
      ...config
    };

    this.browser = null;
    this.context = null;
    this.page = null;
    
    // Componentes del motor
    this.navegador = null;
    this.interactor = null;
    this.validador = null;
    this.evidencia = null;
    this.reporter = null;
    
    // Estado de la auditoría
    this.estado = {
      inicio: null,
      fin: null,
      rutasDescubiertas: [],
      rutasProbadas: [],
      hallazgos: [],
      metricas: {
        totalBotones: 0,
        totalFormularios: 0,
        totalTablas: 0,
        totalModales: 0,
        botonesProbados: 0,
        formulariosProbados: 0,
        tablasProbadas: 0,
        modalesProbados: 0
      }
    };
  }

  /**
   * Inicializa el motor AFI
   */
  async inicializar() {
    console.log('🚀 Inicializando A.F.I. - Auditor Funcional Inteligente');
    console.log('═'.repeat(80));
    
    this.estado.inicio = new Date();
    
    // 1. Inicializar navegador
    console.log('🌐 Inicializando navegador...');
    this.browser = await chromium.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox'
      ]
    });

    // 2. Crear contexto con capacidades de grabación
    console.log('📹 Configurando contexto de grabación...');
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: this.config.recordVideo ? {
        dir: 'evidencia/video/',
        size: { width: 1920, height: 1080 }
      } : undefined,
      screenshot: 'only-on-failure',
      acceptDownloads: true
    });

    // 3. Crear página
    this.page = await this.context.newPage();
    
    // 4. Inicializar componentes
    console.log('⚙️  Inicializando componentes del motor...');
    this.evidencia = new MotorEvidencia(this.page, this.config);
    await this.evidencia.iniciarGrabacion();
    
    this.navegador = new NavegadorAutonomo(this.page, this.evidencia);
    this.interactor = new InteractorUniversal(this.page, this.evidencia);
    this.validador = new ValidadorComportamiento(this.page, this.evidencia);
    this.reporter = new HTMLReporter();
    
    // 5. Configurar interceptores de red
    await this.configurarInterceptores();
    
    // 6. Configurar captura de consola
    await this.configurarCapturaConsola();
    
    console.log('✅ A.F.I. inicializado correctamente');
    console.log('═'.repeat(80));
  }

  /**
   * Configura interceptores de red para capturar todas las requests
   */
  async configurarInterceptores() {
    await this.context.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      
      // Loggear request
      this.evidencia.networkLogger.logRequest(request);
      
      // Continuar con la request
      await route.continue();
    });

    // Capturar responses
    this.page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      
      // Loggear response
      this.evidencia.networkLogger.logResponse(response);
      
      // Detectar errores HTTP
      if (status >= 400) {
        console.log(`⚠️  Error HTTP detectado: ${status} - ${url}`);
        await this.evidencia.capturarErrorNetwork(response);
      }
    });
  }

  /**
   * Configura captura de consola
   */
  async configurarCapturaConsola() {
    // Capturar console.error
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      this.evidencia.consoleCapture.add({
        type,
        text,
        timestamp: new Date(),
        location: msg.location()
      });
      
      // Mostrar en consola del auditor
      if (type === 'error') {
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        console.log(`⚠️  Console Warning: ${text}`);
      }
    });

    // Capturar errores de página
    this.page.on('pageerror', (error) => {
      console.log(`💥 Error de página: ${error.message}`);
      this.evidencia.consoleCapture.add({
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
    });

    // Capturar errores de request no manejados
    this.page.on('requestfailed', (request) => {
      const url = request.url();
      const failure = request.failure();
      console.log(`🌐 Request fallida: ${url} - ${failure.errorText}`);
    });
  }

  /**
   * Ejecuta la auditoría completa del Dashboard Administrativo
   */
  async ejecutarAuditoriaCompleta() {
    console.log('\n🎯 INICIANDO AUDITORÍA COMPLETA DEL DASHBOARD ADMINISTRATIVO');
    console.log('═'.repeat(80));
    
    try {
      // FASE 1: Login
      await this.faseLogin();
      
      // FASE 2: Descubrimiento de rutas
      await this.faseDescubrimientoRutas();
      
      // FASE 3: Auditoría de cada ruta
      await this.faseAuditoriaRutas();
      
      // FASE 4: Pruebas específicas por módulo
      await this.fasePruebasEspecificas();
      
      // FASE 5: Generación de reporte
      await this.faseGeneracionReporte();
      
    } catch (error) {
      console.error('💥 Error crítico en la auditoría:', error);
      await this.evidencia.capturarErrorCritico(error);
    } finally {
      await this.finalizar();
    }
  }

  /**
   * Fase 1: Login en el sistema
   */
  async faseLogin() {
    console.log('\n📋 FASE 1: LOGIN');
    console.log('─'.repeat(80));
    
    await this.evidencia.capturarEvento('FASE_1_LOGIN', { fase: 'Login' });
    
    // Navegar a login
    console.log('🔑 Navegando a página de login...');
    await this.page.goto(`${this.config.baseUrl}/login`);
    await this.page.waitForLoadState('networkidle');
    
    await this.evidencia.capturarScreenshot('login-inicial');
    
    // Verificar errores visuales
    const erroresVisuales = await this.validador.detectarErroresVisuales();
    if (erroresVisuales.length > 0) {
      await this.reportarHallazgo({
        tipo: 'ERROR VISUAL EN LOGIN',
        ruta: '/login',
        severidad: 'P1',
        detalles: erroresVisuales
      });
    }
    
    // Llenar formulario de login
    console.log('📝 Llenando credenciales...');
    await this.interactor.llenarCampo('input[name="email"]', 'admin@test.com');
    await this.interactor.llenarCampo('input[name="password"]', 'password123');
    
    await this.evidencia.capturarScreenshot('login-credenciales-llenadas');
    
    // Hacer clic en login
    console.log('🖱️  Haciendo clic en botón de login...');
    const resultadoLogin = await this.interactor.probarBoton('button[type="submit"]', {
      esperarNavegacion: true,
      urlEsperada: '/admin'
    });
    
    if (!resultadoLogin.exitoso) {
      await this.reportarHallazgo({
        tipo: 'ERROR EN LOGIN',
        ruta: '/login',
        severidad: 'P0',
        detalles: resultadoLogin.error,
        accion: 'CLICK_BOTON_LOGIN'
      });
      throw new Error('Login fallido - No se puede continuar con la auditoría');
    }
    
    await this.evidencia.capturarScreenshot('login-exitoso');
    console.log('✅ Login exitoso');
  }

  /**
   * Fase 2: Descubrimiento automático de rutas
   */
  async faseDescubrimientoRutas() {
    console.log('\n🔍 FASE 2: DESCUBRIMIENTO DE RUTAS');
    console.log('─'.repeat(80));
    
    await this.evidencia.capturarEvento('FASE_2_DESCUBRIMIENTO', { fase: 'Descubrimiento' });
    
    // Descubrir rutas del sidebar
    console.log('🧭 Descubriendo rutas del sidebar...');
    const rutasSidebar = await this.navegador.descubrirRutasSidebar();
    console.log(`   📍 Encontradas ${rutasSidebar.length} rutas en sidebar`);
    
    // Descubrir rutas del contenido principal
    console.log('🧭 Descubriendo rutas del contenido principal...');
    const rutasContenido = await this.navegador.descubrirRutasContenido();
    console.log(`   📍 Encontradas ${rutasContenido.length} rutas en contenido`);
    
    // Combinar y deduplicar rutas
    this.estado.rutasDescubiertas = this.navegador.combinarRutas(rutasSidebar, rutasContenido);
    
    console.log(`\n📊 Total rutas descubiertas: ${this.estado.rutasDescubiertas.length}`);
    this.estado.rutasDescubiertas.forEach((ruta, index) => {
      console.log(`   ${index + 1}. ${ruta.nombre} → ${ruta.ruta}`);
    });
    
    await this.evidencia.capturarEvento('RUTAS_DESCUBIERTAS', {
      total: this.estado.rutasDescubiertas.length,
      rutas: this.estado.rutasDescubiertas
    });
  }

  /**
   * Fase 3: Auditoría de cada ruta descubierta
   */
  async faseAuditoriaRutas() {
    console.log('\n🧪 FASE 3: AUDITORÍA DE RUTAS');
    console.log('─'.repeat(80));
    
    await this.evidencia.capturarEvento('FASE_3_AUDITORIA_RUTAS', { 
      fase: 'Auditoría de rutas',
      total: this.estado.rutasDescubiertas.length 
    });
    
    for (const ruta of this.estado.rutasDescubiertas) {
      console.log(`\n🧪 Probando: ${ruta.nombre} (${ruta.ruta})`);
      console.log('─'.repeat(80));
      
      try {
        await this.auditarRuta(ruta);
        this.estado.rutasProbadas.push(ruta);
      } catch (error) {
        console.log(`❌ Error en ruta ${ruta.ruta}: ${error.message}`);
        await this.reportarHallazgo({
          tipo: 'ERROR NAVEGACIÓN',
          ruta: ruta.ruta,
          modulo: ruta.modulo,
          severidad: 'P1',
          error: error.message,
          accion: 'NAVEGAR'
        });
      }
    }
    
    console.log(`\n✅ Rutas probadas: ${this.estado.rutasProbadas.length}/${this.estado.rutasDescubiertas.length}`);
  }

  /**
   * Audita una ruta específica
   */
  async auditarRuta(ruta) {
    // 1. Navegar a la ruta
    await this.navegador.navegar(ruta.ruta);
    
    // 2. Capturar evidencia inicial
    await this.evidencia.capturarScreenshot(`${ruta.nombre}-inicial`);
    
    // 3. Verificar errores visuales
    const erroresVisuales = await this.validador.detectarErroresVisuales();
    if (erroresVisuales.length > 0) {
      await this.reportarHallazgo({
        tipo: 'ERROR VISUAL',
        ruta: ruta.ruta,
        modulo: ruta.modulo,
        severidad: 'P2',
        detalles: erroresVisuales
      });
    }
    
    // 4. Verificar errores de consola
    const erroresConsola = this.evidencia.consoleCapture.getErrores();
    if (erroresConsola.length > 0) {
      await this.reportarHallazgo({
        tipo: 'ERROR CONSOLA',
        ruta: ruta.ruta,
        modulo: ruta.modulo,
        severidad: 'P2',
        detalles: erroresConsola
      });
    }
    
    // 5. Verificar errores de network
    const erroresNetwork = this.evidencia.networkLogger.getErrores();
    if (erroresNetwork.length > 0) {
      await this.reportarHallazgo({
        tipo: 'ERROR NETWORK',
        ruta: ruta.ruta,
        modulo: ruta.modulo,
        severidad: 'P1',
        detalles: erroresNetwork
      });
    }
    
    // 6. Probar botones
    await this.probarBotonesEnRuta(ruta);
    
    // 7. Probar formularios
    await this.probarFormulariosEnRuta(ruta);
    
    // 8. Probar tablas
    await this.probarTablasEnRuta(ruta);
    
    // 9. Capturar evidencia final
    await this.evidencia.capturarScreenshot(`${ruta.nombre}-final`);
  }

  /**
   * Prueba todos los botones en una ruta
   */
  async probarBotonesEnRuta(ruta) {
    const botones = await this.page.locator('button, [role="button"]').all();
    this.estado.metricas.totalBotones += botones.length;
    
    console.log(`   🖱️  Probando ${botones.length} botones...`);
    
    for (let i = 0; i < botones.length; i++) {
      const boton = botones[i];
      const selector = await boton.evaluate(el => {
        // Generar selector único
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return el.tagName.toLowerCase();
      });
      
      const texto = await boton.textContent();
      
      try {
        const resultado = await this.interactor.probarBoton(boton, {
          nombre: texto?.trim() || `Botón ${i + 1}`,
          selector
        });
        
        this.estado.metricas.botonesProbados++;
        
        if (!resultado.exitoso) {
          await this.reportarHallazgo({
            tipo: 'BOTÓN SIN FUNCIÓN',
            ruta: ruta.ruta,
            modulo: ruta.modulo,
            componente: selector,
            severidad: resultado.severidad || 'P2',
            accion: 'CLICK',
            selector,
            resultado_esperado: resultado.esperado,
            resultado_obtenido: resultado.obtenido,
            detalles: resultado.detalles
          });
        }
      } catch (error) {
        console.log(`      ❌ Error probando botón: ${error.message}`);
      }
    }
  }

  /**
   * Prueba todos los formularios en una ruta
   */
  async probarFormulariosEnRuta(ruta) {
    const formularios = await this.page.locator('form').all();
    this.estado.metricas.totalFormularios += formularios.length;
    
    if (formularios.length === 0) return;
    
    console.log(`   📝 Probando ${formularios.length} formularios...`);
    
    for (let i = 0; i < formularios.length; i++) {
      const form = formularios[i];
      
      try {
        await this.interactor.probarFormulario(form, {
          nombre: `Formulario ${i + 1}`,
          datosPrueba: this.generarDatosPrueba()
        });
        
        this.estado.metricas.formulariosProbados++;
      } catch (error) {
        console.log(`      ❌ Error probando formulario: ${error.message}`);
      }
    }
  }

  /**
   * Prueba todas las tablas en una ruta
   */
  async probarTablasEnRuta(ruta) {
    const tablas = await this.page.locator('table, [role="table"]').all();
    this.estado.metricas.totalTablas += tablas.length;
    
    if (tablas.length === 0) return;
    
    console.log(`   📊 Probando ${tablas.length} tablas...`);
    
    for (let i = 0; i < tablas.length; i++) {
      const tabla = tablas[i];
      
      try {
        await this.interactor.probarTabla(tabla, {
          nombre: `Tabla ${i + 1}`
        });
        
        this.estado.metricas.tablasProbadas++;
      } catch (error) {
        console.log(`      ❌ Error probando tabla: ${error.message}`);
      }
    }
  }

  /**
   * Fase 4: Pruebas específicas por módulo
   */
  async fasePruebasEspecificas() {
    console.log('\n🎯 FASE 4: PRUEBAS ESPECÍFICAS POR MÓDULO');
    console.log('─'.repeat(80));
    
    // Esta fase se puede expandir con pruebas específicas
    // Por ahora, las pruebas generales en Fase 3 son suficientes
    console.log('ℹ️  Pruebas específicas se ejecutan durante la auditoría de rutas');
  }

  /**
   * Fase 5: Generación de reporte
   */
  async faseGeneracionReporte() {
    console.log('\n📊 FASE 5: GENERACIÓN DE REPORTE');
    console.log('─'.repeat(80));
    
    await this.evidencia.capturarEvento('FASE_5_REPORTE', { fase: 'Generación de reporte' });
    
    // Calcular métricas finales
    this.estado.fin = new Date();
    const duracion = (this.estado.fin - this.estado.inicio) / 1000 / 60; // en minutos
    
    const reporte = {
      metadata: {
        fecha: this.estado.inicio.toISOString(),
        duracionMinutos: duracion,
        urlBase: this.config.baseUrl,
        navegador: 'Chromium',
        headless: this.config.headless
      },
      metricas: {
        rutasDescubiertas: this.estado.rutasDescubiertas.length,
        rutasProbadas: this.estado.rutasProbadas.length,
        cobertura: `${((this.estado.rutasProbadas.length / this.estado.rutasDescubiertas.length) * 100).toFixed(2)}%`,
        totalBotones: this.estado.metricas.totalBotones,
        botonesProbados: this.estado.metricas.botonesProbados,
        totalFormularios: this.estado.metricas.totalFormularios,
        formulariosProbados: this.estado.metricas.formulariosProbados,
        totalTablas: this.estado.metricas.totalTablas,
        tablasProbadas: this.estado.metricas.tablasProbadas
      },
      hallazgos: this.estado.hallazgos,
      resumen: this.generarResumenHallazgos(),
      evidencia: {
        video: this.config.recordVideo ? 'evidencia/video/sesion.webm' : null,
        screenshots: 'evidencia/capturas/',
        logs: 'evidencia/logs/',
        network: 'evidencia/network/'
      }
    };
    
    // Generar reporte HTML
    console.log('📄 Generando reporte HTML...');
    await this.reporter.generarHTML(reporte);
    
    // Generar reporte JSON
    console.log('📋 Generando reporte JSON...');
    await this.reporter.generarJSON(reporte);
    
    console.log('✅ Reportes generados correctamente');
  }

  /**
   * Genera resumen de hallazgos por severidad
   */
  generarResumenHallazgos() {
    const resumen = {
      P0: { cantidad: 0, descripcion: 'Impide producción' },
      P1: { cantidad: 0, descripcion: 'Error crítico' },
      P2: { cantidad: 0, descripcion: 'Error funcional' },
      P3: { cantidad: 0, descripcion: 'Error visual' },
      P4: { cantidad: 0, descripcion: 'Mejora' }
    };
    
    for (const hallazgo of this.estado.hallazgos) {
      if (resumen[hallazgo.severidad]) {
        resumen[hallazgo.severidad].cantidad++;
      }
    }
    
    return resumen;
  }

  /**
   * Reporta un hallazgo
   */
  async reportarHallazgo(hallazgo) {
    const id = `HALL-${String(this.estado.hallazgos.length + 1).padStart(3, '0')}`;
    
    const hallazgoCompleto = {
      id,
      fecha: new Date().toISOString(),
      ...hallazgo
    };
    
    this.estado.hallazgos.push(hallazgoCompleto);
    
    console.log(`\n⚠️  HALLAZGO DETECTADO: ${id}`);
    console.log(`   Tipo: ${hallazgo.tipo}`);
    console.log(`   Severidad: ${hallazgo.severidad}`);
    console.log(`   Ruta: ${hallazgo.ruta}`);
    console.log(`   Acción: ${hallazgo.accion || 'N/A'}`);
    
    // Capturar evidencia del hallazgo
    await this.evidencia.capturarHallazgo(hallazgoCompleto);
    
    return hallazgoCompleto;
  }

  /**
   * Genera datos de prueba para formularios
   */
  generarDatosPrueba() {
    return {
      nombre: 'Usuario Prueba AFI',
      email: 'test@afi.com',
      telefono: '+573000000000',
      documento: '1234567890',
      direccion: 'Calle Prueba 123',
      ciudad: 'Bogotá',
      pais: 'Colombia'
    };
  }

  /**
   * Finaliza la auditoría y limpia recursos
   */
  async finalizar() {
    console.log('\n🏁 FINALIZANDO AUDITORÍA');
    console.log('═'.repeat(80));
    
    // Finalizar grabación de video
    if (this.evidencia) {
      await this.evidencia.finalizarGrabacion();
    }
    
    // Cerrar navegador
    if (this.context) {
      await this.context.close();
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    // Mostrar resumen
    this.mostrarResumenFinal();
  }

  /**
   * Muestra resumen final en consola
   */
  mostrarResumenFinal() {
    console.log('\n📊 RESUMEN FINAL DE AUDITORÍA');
    console.log('═'.repeat(80));
    
    const duracion = (this.estado.fin - this.estado.inicio) / 1000 / 60;
    
    console.log(`⏱️  Duración: ${duracion.toFixed(2)} minutos`);
    console.log(`📍 Rutas descubiertas: ${this.estado.rutasDescubiertas.length}`);
    console.log(`✅ Rutas probadas: ${this.estado.rutasProbadas.length}`);
    console.log(`🖱️  Botones probados: ${this.estado.metricas.botonesProbados}/${this.estado.metricas.totalBotones}`);
    console.log(`📝 Formularios probados: ${this.estado.metricas.formulariosProbados}/${this.estado.metricas.totalFormularios}`);
    console.log(`📊 Tablas probadas: ${this.estado.metricas.tablasProbadas}/${this.estado.metricas.totalTablas}`);
    
    console.log('\n⚠️  HALLAZGOS POR SEVERIDAD:');
    const resumen = this.generarResumenHallazgos();
    for (const [severidad, datos] of Object.entries(resumen)) {
      const emoji = severidad === 'P0' ? '🔴' : severidad === 'P1' ? '🟠' : severidad === 'P2' ? '🟡' : '🔵';
      console.log(`   ${emoji} ${severidad}: ${datos.cantidad} - ${datos.descripcion}`);
    }
    
    console.log(`\n📁 Evidencia guardada en: evidencia/`);
    console.log('═'.repeat(80));
  }
}

// Exportar clase
module.exports = AFIEngine;

// Ejecución directa
if (require.main === module) {
  const engine = new AFIEngine();
  engine.inicializar()
    .then(() => engine.ejecutarAuditoriaCompleta())
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}