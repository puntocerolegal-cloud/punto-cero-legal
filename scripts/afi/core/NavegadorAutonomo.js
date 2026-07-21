/**
 * A.F.I. - Navegador Autónomo
 * Descubre y recorre automáticamente todas las rutas del Dashboard
 * 
 * @author Sistema AFI
 * @version 1.0.0
 */

class NavegadorAutonomo {
  constructor(page, evidencia) {
    this.page = page;
    this.evidencia = evidencia;
    this.rutasVisitadas = new Set();
    this.grafoRutas = new Map();
  }

  /**
   * Descubre todas las rutas del sidebar de navegación
   */
  async descubrirRutasSidebar() {
    console.log('   🔍 Analizando sidebar de navegación...');
    
    const rutas = [];
    
    try {
      // Estrategia 1: Buscar elementos de navegación
      const selectoresSidebar = [
        'nav',
        'aside',
        '[role="navigation"]',
        '.sidebar',
        '.nav-menu',
        '[data-testid*="sidebar"]',
        '[data-testid*="nav"]'
      ];
      
      let sidebar = null;
      for (const selector of selectoresSidebar) {
        sidebar = await this.page.locator(selector).first();
        if (await sidebar.count() > 0) {
          break;
        }
      }
      
      if (!sidebar || await sidebar.count() === 0) {
        console.log('   ⚠️  No se encontró sidebar');
        return rutas;
      }
      
      // Extraer todos los links
      const links = await sidebar.locator('a').all();
      
      for (const link of links) {
        try {
          const href = await link.getAttribute('href');
          const texto = await link.textContent();
          
          if (href && !href.startsWith('http') && !href.startsWith('#')) {
            rutas.push({
              ruta: href,
              nombre: texto?.trim() || 'Sin nombre',
              modulo: this.detectarModulo(href, texto),
              fuente: 'sidebar'
            });
          }
        } catch (error) {
          // Ignorar links que no se pueden leer
        }
      }
      
      // También buscar botones de navegación
      const botones = await sidebar.locator('button, [role="button"]').all();
      
      for (const boton of botones) {
        try {
          const texto = await boton.textContent();
          const onclick = await boton.getAttribute('onclick');
          
          if (onclick && onclick.includes('location') || onclick.includes('navigate')) {
            // Extraer ruta del onclick
            const rutaMatch = onclick.match(/['"](/[^'"]+)['"]/);
            if (rutaMatch) {
              rutas.push({
                ruta: rutaMatch[1],
                nombre: texto?.trim() || 'Sin nombre',
                modulo: this.detectarModulo(rutaMatch[1], texto),
                fuente: 'sidebar-button'
              });
            }
          }
        } catch (error) {
          // Ignorar botones que no se pueden leer
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error descubriendo rutas del sidebar: ${error.message}`);
    }
    
    return rutas;
  }

  /**
   * Descubre rutas en el contenido principal
   */
  async descubrirRutasContenido() {
    console.log('   🔍 Analizando contenido principal...');
    
    const rutas = [];
    
    try {
      // Buscar en contenido principal
      const selectoresContenido = [
        'main',
        '.content',
        '#content',
        '[role="main"]',
        '.main-content'
      ];
      
      let contenido = null;
      for (const selector of selectoresContenido) {
        contenido = await this.page.locator(selector).first();
        if (await contenido.count() > 0) {
          break;
        }
      }
      
      if (!contenido || await contenido.count() === 0) {
        console.log('   ⚠️  No se encontró contenido principal');
        return rutas;
      }
      
      // Extraer links
      const links = await contenido.locator('a').all();
      
      for (const link of links) {
        try {
          const href = await link.getAttribute('href');
          const texto = await link.textContent();
          
          if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            // Evitar duplicados
            if (!rutas.some(r => r.ruta === href)) {
              rutas.push({
                ruta: href,
                nombre: texto?.trim() || 'Sin nombre',
                modulo: this.detectarModulo(href, texto),
                fuente: 'contenido'
              });
            }
          }
        } catch (error) {
          // Ignorar
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error descubriendo rutas del contenido: ${error.message}`);
    }
    
    return rutas;
  }

  /**
   * Detecta el módulo basado en la ruta y el texto
   */
  detectarModulo(ruta, texto) {
    const rutaLower = ruta.toLowerCase();
    const textoLower = (texto || '').toLowerCase();
    
    // Mapeo de palabras clave a módulos
    const modulos = {
      'dashboard': 'Dashboard',
      'user': 'Usuarios',
      'usuario': 'Usuarios',
      'client': 'Clientes',
      'cliente': 'Clientes',
      'case': 'Casos',
      'expediente': 'Casos',
      'document': 'Documentos',
      'documento': 'Documentos',
      'firm': 'Firmas',
      'empresa': 'Empresas',
      'company': 'Empresas',
      'billing': 'Facturación',
      'factura': 'Facturación',
      'payment': 'Pagos',
      'pago': 'Pagos',
      'subscription': 'Suscripciones',
      'plan': 'Planes',
      'role': 'Roles',
      'permission': 'Permisos',
      'permiso': 'Permisos',
      'config': 'Configuración',
      'setting': 'Configuración',
      'security': 'Seguridad',
      'seguridad': 'Seguridad',
      'audit': 'Auditoría',
      'log': 'Logs',
      'notification': 'Notificaciones',
      'notificacion': 'Notificaciones',
      'ai': 'IA',
      'ia': 'IA',
      'chatbot': 'Chatbot',
      'meeting': 'Reuniones',
      'reunion': 'Reuniones',
      'calendar': 'Calendario',
      'report': 'Reportes',
      'informe': 'Reportes',
      'analytics': 'Analítica',
      'estadistica': 'Analítica'
    };
    
    // Buscar en ruta
    for (const [keyword, modulo] of Object.entries(modulos)) {
      if (rutaLower.includes(keyword)) {
        return modulo;
      }
    }
    
    // Buscar en texto
    for (const [keyword, modulo] of Object.entries(modulos)) {
      if (textoLower.includes(keyword)) {
        return modulo;
      }
    }
    
    return 'Desconocido';
  }

  /**
   * Combina y deduplica rutas de múltiples fuentes
   */
  combinarRutas(rutas1, rutas2) {
    const todas = [...rutas1, ...rutas2];
    const únicas = [];
    const vistas = new Set();
    
    for (const ruta of todas) {
      // Normalizar ruta
      const rutaNormalizada = ruta.ruta.split('?')[0]; // Remover query params
      
      if (!vistas.has(rutaNormalizada)) {
        vistas.add(rutaNormalizada);
        únicas.push({
          ...ruta,
          ruta: rutaNormalizada
        });
      }
    }
    
    // Ordenar por nombre
    únicas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    return únicas;
  }

  /**
   * Navega a una ruta y espera a que cargue
   */
  async navegar(ruta) {
    const urlCompleta = ruta.startsWith('http') ? ruta : `${this.page.url().split('/admin')[0]}${ruta}`;
    
    console.log(`   🌐 Navegando a: ${ruta}`);
    
    // Navegar
    await this.page.goto(urlCompleta, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Esperar a que la página esté estable
    await this.page.waitForTimeout(1000);
    
    // Verificar que no hay errores 404/500
    const titulo = await this.page.title();
    const bodyText = await this.page.textContent('body');
    
    if (bodyText?.includes('404') || bodyText?.includes('Not Found')) {
      throw new Error(`Página 404: ${ruta}`);
    }
    
    if (bodyText?.includes('500') || bodyText?.includes('Internal Server Error')) {
      throw new Error(`Error 500: ${ruta}`);
    }
    
    // Marcar como visitada
    this.rutasVisitadas.add(ruta);
    
    return {
      ruta,
      titulo,
      url: this.page.url()
    };
  }

  /**
   * Descubre rutas dinámicamente desde el estado actual
   */
  async descubrirRutasDinamicas() {
    console.log('   🔍 Buscando rutas dinámicas...');
    
    const rutas = [];
    
    try {
      // Buscar en el estado de React (si está disponible)
      const reactRoot = await this.page.locator('[data-reactroot], #root, #app').first();
      
      // Buscar todos los elementos con href
      const todosLosLinks = await this.page.locator('a[href]').all();
      
      for (const link of todosLosLinks) {
        try {
          const href = await link.getAttribute('href');
          const texto = await link.textContent();
          
          if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
            if (!this.rutasVisitadas.has(href)) {
              rutas.push({
                ruta: href,
                nombre: texto?.trim() || 'Sin nombre',
                modulo: this.detectarModulo(href, texto),
                fuente: 'dinamico'
              });
            }
          }
        } catch (error) {
          // Ignorar
        }
      }
      
      // Buscar botones con navigate
      const botones = await this.page.locator('button[onclick*="navigate"], button[onclick*="location"]').all();
      
      for (const boton of botones) {
        try {
          const onclick = await boton.getAttribute('onclick');
          const texto = await boton.textContent();
          
          const rutaMatch = onclick.match(/['"](/[^'"]+)['"]/);
          if (rutaMatch) {
            const ruta = rutaMatch[1];
            if (!this.rutasVisitadas.has(ruta)) {
              rutas.push({
                ruta,
                nombre: texto?.trim() || 'Sin nombre',
                modulo: this.detectarModulo(ruta, texto),
                fuente: 'boton-dinamico'
              });
            }
          }
        } catch (error) {
          // Ignorar
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error en descubrimiento dinámico: ${error.message}`);
    }
    
    return rutas;
  }

  /**
   * Ejecuta BFS (Breadth-First Search) para recorrer todas las rutas
   */
  async ejecutarBFS(rutasIniciales, maxProfundidad = 3) {
    console.log('\n🧭 Ejecutando BFS para recorrer todas las rutas...');
    
    const cola = [...rutasIniciales];
    const visitadas = new Set();
    const resultado = [];
    
    while (cola.length > 0) {
      const ruta = cola.shift();
      
      // Normalizar ruta
      const rutaNormalizada = ruta.ruta.split('?')[0];
      
      // Verificar si ya fue visitada
      if (visitadas.has(rutaNormalizada)) {
        continue;
      }
      
      // Verificar profundidad
      const profundidad = (rutaNormalizada.match(/\//g) || []).length;
      if (profundidad > maxProfundidad) {
        continue;
      }
      
      try {
        // Navegar a la ruta
        await this.navegar(rutaNormalizada);
        visitadas.add(rutaNormalizada);
        
        resultado.push({
          ...ruta,
          ruta: rutaNormalizada,
          exito: true
        });
        
        console.log(`   ✅ ${ruta.nombre} (${rutaNormalizada})`);
        
        // Descubrir nuevas rutas desde esta página
        const nuevasRutas = await this.descubrirRutasDinamicas();
        
        for (const nuevaRuta of nuevasRutas) {
          if (!visitadas.has(nuevaRuta.ruta)) {
            cola.push(nuevaRuta);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error en ${rutaNormalizada}: ${error.message}`);
        resultado.push({
          ...ruta,
          ruta: rutaNormalizada,
          exito: false,
          error: error.message
        });
      }
    }
    
    return resultado;
  }
}

// Exportar clase
module.exports = NavegadorAutonomo;