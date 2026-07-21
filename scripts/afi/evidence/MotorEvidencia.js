/**
 * A.F.I. - Motor de Evidencia
 * Captura screenshots, logs de consola, network y video
 * 
 * @author Sistema AFI
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

class MotorEvidencia {
  constructor(page, config) {
    this.page = page;
    this.config = config;
    
    // Directorios de evidencia
    this.dirs = {
      screenshots: 'evidencia/capturas',
      logs: 'evidencia/logs',
      network: 'evidencia/network',
      video: 'evidencia/video'
    };
    
    // Capturadores
    this.consoleCapture = new ConsoleCapture();
    this.networkLogger = new NetworkLogger();
    
    // Contador de capturas
    this.capturaCounter = 0;
  }

  /**
   * Inicializa el sistema de grabación
   */
  async iniciarGrabacion() {
    console.log('📹 Iniciando sistema de evidencia...');
    
    // Crear directorios
    await this.crearDirectorios();
    
    // Iniciar captura de consola
    this.consoleCapture.iniciar();
    
    // Iniciar log de network
    this.networkLogger.iniciar();
    
    console.log('✅ Sistema de evidencia iniciado');
  }

  /**
   * Crea los directorios necesarios para la evidencia
   */
  async crearDirectorios() {
    for (const dir of Object.values(this.dirs)) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directorio ya existe
      }
    }
  }

  /**
   * Captura un screenshot
   */
  async capturarScreenshot(nombre) {
    this.capturaCounter++;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `${this.capturaCounter.toString().padStart(3, '0')}_${nombre}_${timestamp}.png`;
    const rutaCompleta = path.join(this.dirs.screenshots, nombreArchivo);
    
    try {
      await this.page.screenshot({ 
        path: rutaCompleta,
        fullPage: true 
      });
      
      console.log(`      📸 Screenshot: ${nombreArchivo}`);
      
      return rutaCompleta;
    } catch (error) {
      console.log(`      ❌ Error capturando screenshot: ${error.message}`);
      return null;
    }
  }

  /**
   * Captura evidencia de un hallazgo
   */
  async capturarHallazgo(hallazgo) {
    const nombre = `hallazgo-${hallazgo.id}`;
    
    // Capturar screenshot
    await this.capturarScreenshot(nombre);
    
    // Guardar logs de consola asociados
    const logsConsola = this.consoleCapture.getErroresRecientes();
    if (logsConsola.length > 0) {
      await this.guardarLogConsola(nombre, logsConsola);
    }
    
    // Guardar logs de network asociados
    const logsNetwork = this.networkLogger.getErroresRecientes();
    if (logsNetwork.length > 0) {
      await this.guardarLogNetwork(nombre, logsNetwork);
    }
  }

  /**
   * Captura un evento importante
   */
  async capturarEvento(nombre, datos = {}) {
    await this.capturarScreenshot(`evento-${nombre}`);
    
    // Guardar metadata del evento
    const metadata = {
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      ...datos
    };
    
    await this.guardarMetadata(`evento-${nombre}`, metadata);
  }

  /**
   * Captura error crítico
   */
  async capturarErrorCritico(error) {
    await this.capturarScreenshot('error-critico');
    
    const errorData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      url: this.page.url()
    };
    
    await this.guardarMetadata('error-critico', errorData);
  }

  /**
   * Captura error de network
   */
  async capturarErrorNetwork(response) {
    const errorData = {
      timestamp: new Date().toISOString(),
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers()
    };
    
    await this.guardarLogNetwork('error-network', [errorData]);
  }

  /**
   * Guarda metadata en archivo JSON
   */
  async guardarMetadata(nombre, datos) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `${nombre}_${timestamp}.json`;
    const rutaCompleta = path.join(this.dirs.logs, nombreArchivo);
    
    try {
      await fs.writeFile(rutaCompleta, JSON.stringify(datos, null, 2));
    } catch (error) {
      console.log(`      ❌ Error guardando metadata: ${error.message}`);
    }
  }

  /**
   * Guarda log de consola
   */
  async guardarLogConsola(nombre, logs) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `${nombre}_consola_${timestamp}.json`;
    const rutaCompleta = path.join(this.dirs.logs, nombreArchivo);
    
    try {
      await fs.writeFile(rutaCompleta, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.log(`      ❌ Error guardando log de consola: ${error.message}`);
    }
  }

  /**
   * Guarda log de network
   */
  async guardarLogNetwork(nombre, logs) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `${nombre}_network_${timestamp}.json`;
    const rutaCompleta = path.join(this.dirs.network, nombreArchivo);
    
    try {
      await fs.writeFile(rutaCompleta, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.log(`      ❌ Error guardando log de network: ${error.message}`);
    }
  }

  /**
   * Finaliza la grabación
   */
  async finalizarGrabacion() {
    console.log('\n🏁 Finalizando grabación...');
    
    // Guardar logs finales
    await this.guardarLogConsola('consola-final', this.consoleCapture.getTodos());
    await this.guardarLogNetwork('network-final', this.networkLogger.getTodos());
    
    // Generar resumen de evidencia
    await this.generarResumenEvidencia();
    
    console.log('✅ Evidencia guardada correctamente');
  }

  /**
   * Genera resumen de toda la evidencia
   */
  async generarResumenEvidencia() {
    const resumen = {
      timestamp: new Date().toISOString(),
      screenshots: this.capturaCounter,
      erroresConsola: this.consoleCapture.getErrores().length,
      warningsConsola: this.consoleCapture.getWarnings().length,
      erroresNetwork: this.networkLogger.getErrores().length,
      totalRequests: this.networkLogger.getTodos().length
    };
    
    await this.guardarMetadata('resumen', resumen);
  }
}

/**
 * Capturador de logs de consola
 */
class ConsoleCapture {
  constructor() {
    this.logs = [];
    this.errores = [];
    this.warnings = [];
  }

  iniciar() {
    // Los logs se capturan desde AFIEngine
  }

  agregar(log) {
    this.logs.push(log);
    
    if (log.type === 'error') {
      this.errores.push(log);
    } else if (log.type === 'warning') {
      this.warnings.push(log);
    }
  }

  getTodos() {
    return this.logs;
  }

  getErrores() {
    return this.errores;
  }

  getWarnings() {
    return this.warnings;
  }

  getErroresRecientes() {
    // Retornar últimos 10 errores
    return this.errores.slice(-10);
  }
}

/**
 * Logger de requests de red
 */
class NetworkLogger {
  constructor() {
    this.requests = [];
    this.responses = [];
    this.errores = [];
  }

  iniciar() {
    // Los logs se capturan desde AFIEngine
  }

  logRequest(request) {
    const log = {
      timestamp: new Date().toISOString(),
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    };
    
    this.requests.push(log);
  }

  logResponse(response) {
    const log = {
      timestamp: new Date().toISOString(),
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers()
    };
    
    this.responses.push(log);
    
    // Detectar errores
    if (response.status() >= 400) {
      this.errores.push(log);
    }
  }

  getTodos() {
    return [...this.requests, ...this.responses];
  }

  getErrores() {
    return this.errores;
  }

  getErroresRecientes() {
    return this.errores.slice(-10);
  }

  getRequests() {
    return this.requests;
  }

  getResponses() {
    return this.responses;
  }
}

// Exportar clases
module.exports = MotorEvidencia;
module.exports.ConsoleCapture = ConsoleCapture;
module.exports.NetworkLogger = NetworkLogger;