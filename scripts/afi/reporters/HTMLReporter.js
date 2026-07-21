/**
 * A.F.I. - HTML Reporter
 * Genera reporte HTML interactivo con toda la evidencia
 * 
 * @author Sistema AFI
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

class HTMLReporter {
  constructor() {
    this.reportePath = 'evidencia/reporte';
  }

  /**
   * Genera el reporte HTML completo
   */
  async generarHTML(reporte) {
    console.log('📄 Generando reporte HTML...');
    
    // Crear directorio
    await fs.mkdir(this.reportePath, { recursive: true });
    
    // Generar HTML
    const html = this.construirHTML(reporte);
    
    // Guardar archivo
    const rutaCompleta = path.join(this.reportePath, 'auditoria-afi.html');
    await fs.writeFile(rutaCompleta, html, 'utf-8');
    
    console.log(`✅ Reporte HTML generado: ${rutaCompleta}`);
    
    return rutaCompleta;
  }

  /**
   * Construye el HTML del reporte
   */
  construirHTML(reporte) {
    const fecha = new Date(reporte.metadata.fecha).toLocaleString('es-CO');
    const duracion = reporte.metadata.duracionMinutos.toFixed(2);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AUDITORÍA AFI - Dashboard Administrativo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        
        h1 {
            color: white;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #e2e8f0;
            font-size: 1.1em;
        }
        
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .meta-card {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .meta-label {
            color: #94a3b8;
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        
        .meta-value {
            color: white;
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .section {
            background: #1e293b;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .section-title {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .metric-card {
            background: #0f172a;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-top: 3px solid #667eea;
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .metric-label {
            color: #94a3b8;
            font-size: 0.9em;
        }
        
        .severity-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }
        
        .severity-card {
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .severity-p0 {
            background: #dc2626;
            color: white;
        }
        
        .severity-p1 {
            background: #f97316;
            color: white;
        }
        
        .severity-p2 {
            background: #eab308;
            color: white;
        }
        
        .severity-p3 {
            background: #3b82f6;
            color: white;
        }
        
        .severity-p4 {
            background: #10b981;
            color: white;
        }
        
        .severity-count {
            font-size: 2em;
            font-weight: bold;
        }
        
        .severity-label {
            font-size: 0.8em;
            margin-top: 5px;
        }
        
        .findings-list {
            margin-top: 20px;
        }
        
        .finding-item {
            background: #0f172a;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #f97316;
        }
        
        .finding-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .finding-id {
            color: #667eea;
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .finding-severity {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        
        .finding-type {
            color: #f97316;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .finding-details {
            color: #94a3b8;
            font-size: 0.95em;
            line-height: 1.6;
        }
        
        .finding-route {
            color: #10b981;
            font-family: monospace;
            background: rgba(16, 185, 129, 0.1);
            padding: 5px 10px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 10px;
        }
        
        .no-findings {
            text-align: center;
            padding: 40px;
            color: #10b981;
            font-size: 1.2em;
        }
        
        .evidence-section {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #334155;
        }
        
        .evidence-title {
            color: #667eea;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .evidence-list {
            list-style: none;
            padding-left: 0;
        }
        
        .evidence-list li {
            padding: 5px 0;
            color: #94a3b8;
        }
        
        .evidence-list li:before {
            content: "📎 ";
            margin-right: 5px;
        }
        
        footer {
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 0.9em;
        }
        
        .timestamp {
            color: #94a3b8;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔍 AUDITORÍA AFI</h1>
            <p class="subtitle">Dashboard Administrativo - Punto Cero Legal</p>
            
            <div class="metadata">
                <div class="meta-card">
                    <div class="meta-label">📅 Fecha</div>
                    <div class="meta-value">${fecha}</div>
                </div>
                <div class="meta-card">
                    <div class="meta-label">⏱️ Duración</div>
                    <div class="meta-value">${duracion} min</div>
                </div>
                <div class="meta-card">
                    <div class="meta-label">📍 Rutas Descubiertas</div>
                    <div class="meta-value">${reporte.metricas.rutasDescubiertas}</div>
                </div>
                <div class="meta-card">
                    <div class="meta-label">✅ Rutas Probadas</div>
                    <div class="meta-value">${reporte.metricas.rutasProbadas}</div>
                </div>
                <div class="meta-card">
                    <div class="meta-label">📊 Cobertura</div>
                    <div class="meta-value">${reporte.metricas.cobertura}</div>
                </div>
            </div>
        </header>
        
        <div class="section">
            <h2 class="section-title">📊 Métricas de Cobertura</h2>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${reporte.metricas.totalBotones}</div>
                    <div class="metric-label">Botones Totales</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reporte.metricas.botonesProbados}</div>
                    <div class="metric-label">Botones Probados</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reporte.metricas.totalFormularios}</div>
                    <div class="metric-label">Formularios Totales</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reporte.metricas.formulariosProbados}</div>
                    <div class="metric-label">Formularios Probados</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reporte.metricas.totalTablas}</div>
                    <div class="metric-label">Tablas Totales</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${reporte.metricas.tablasProbadas}</div>
                    <div class="metric-label">Tablas Probadas</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">⚠️ Hallazgos por Severidad</h2>
            
            <div class="severity-grid">
                <div class="severity-card severity-p0">
                    <div class="severity-count">${reporte.resumen.P0.cantidad}</div>
                    <div class="severity-label">P0 - Impide Producción</div>
                </div>
                <div class="severity-card severity-p1">
                    <div class="severity-count">${reporte.resumen.P1.cantidad}</div>
                    <div class="severity-label">P1 - Error Crítico</div>
                </div>
                <div class="severity-card severity-p2">
                    <div class="severity-count">${reporte.resumen.P2.cantidad}</div>
                    <div class="severity-label">P2 - Error Funcional</div>
                </div>
                <div class="severity-card severity-p3">
                    <div class="severity-count">${reporte.resumen.P3.cantidad}</div>
                    <div class="severity-label">P3 - Error Visual</div>
                </div>
                <div class="severity-card severity-p4">
                    <div class="severity-count">${reporte.resumen.P4.cantidad}</div>
                    <div class="severity-label">P4 - Mejora</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">🔍 Hallazgos Detectados</h2>
            
            <div class="findings-list">
                ${reporte.hallazgos.length === 0 ? 
                    '<div class="no-findings">✅ No se detectaron hallazgos. El sistema está listo para producción.</div>' :
                    reporte.hallazgos.map(hallazgo => this.construirHallazgoHTML(hallazgo)).join('')
                }
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📁 Evidencia</h2>
            
            <div class="evidence-section">
                <div class="evidence-title">📹 Video de la Sesión</div>
                <ul class="evidence-list">
                    <li>${reporte.evidencia.video || 'No disponible'}</li>
                </ul>
            </div>
            
            <div class="evidence-section">
                <div class="evidence-title">📸 Capturas de Pantalla</div>
                <ul class="evidence-list">
                    <li>${reporte.evidencia.screenshots}</li>
                </ul>
            </div>
            
            <div class="evidence-section">
                <div class="evidence-title">📋 Logs de Consola</div>
                <ul class="evidence-list">
                    <li>${reporte.evidencia.logs}</li>
                </ul>
            </div>
            
            <div class="evidence-section">
                <div class="evidence-title">🌐 Logs de Network</div>
                <ul class="evidence-list">
                    <li>${reporte.evidencia.network}</li>
                </ul>
            </div>
        </div>
        
        <footer>
            <p>Generado por A.F.I. - Auditor Funcional Inteligente</p>
            <p class="timestamp">${fecha}</p>
        </footer>
    </div>
</body>
</html>`;
  }

  /**
   * Construye el HTML de un hallazgo individual
   */
  construirHallazgoHTML(hallazgo) {
    const severityClass = this.obtenerClaseSeveridad(hallazgo.severidad);
    
    return `
        <div class="finding-item">
            <div class="finding-header">
                <span class="finding-id">${hallazgo.id}</span>
                <span class="finding-severity ${severityClass}">${hallazgo.severidad}</span>
            </div>
            
            <div class="finding-type">${hallazgo.tipo}</div>
            
            <div class="finding-details">
                <p><strong>Ruta:</strong> ${hallazgo.ruta}</p>
                <p><strong>Módulo:</strong> ${hallazgo.modulo || 'N/A'}</p>
                <p><strong>Acción:</strong> ${hallazgo.accion || 'N/A'}</p>
                <p><strong>Resultado Esperado:</strong> ${hallazgo.resultado_esperado || 'N/A'}</p>
                <p><strong>Resultado Obtenido:</strong> ${hallazgo.resultado_obtenido || 'N/A'}</p>
                ${hallazgo.detalles ? `<p><strong>Detalles:</strong> ${JSON.stringify(hallazgo.detalles)}</p>` : ''}
            </div>
            
            <div class="finding-route">
                📍 ${hallazgo.ruta}
            </div>
        </div>
    `;
  }

  /**
   * Obtiene la clase CSS según la severidad
   */
  obtenerClaseSeveridad(severidad) {
    const clases = {
      'P0': 'severity-p0',
      'P1': 'severity-p1',
      'P2': 'severity-p2',
      'P3': 'severity-p3',
      'P4': 'severity-p4'
    };
    
    return clases[severidad] || 'severity-p2';
  }

  /**
   * Genera el reporte JSON
   */
  async generarJSON(reporte) {
    console.log('📋 Generando reporte JSON...');
    
    const rutaCompleta = path.join(this.reportePath, 'auditoria-afi.json');
    
    try {
      await fs.writeFile(rutaCompleta, JSON.stringify(reporte, null, 2), 'utf-8');
      console.log(`✅ Reporte JSON generado: ${rutaCompleta}`);
      return rutaCompleta;
    } catch (error) {
      console.log(`❌ Error generando JSON: ${error.message}`);
      return null;
    }
  }
}

// Exportar clase
module.exports = HTMLReporter;