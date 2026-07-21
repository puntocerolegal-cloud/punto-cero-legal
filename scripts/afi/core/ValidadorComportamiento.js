/**
 * A.F.I. - Validador de Comportamiento
 * Detecta errores visuales, de consola y de network
 * 
 * @author Sistema AFI
 * @version 1.0.0
 */

class ValidadorComportamiento {
  constructor(page, evidencia) {
    this.page = page;
    this.evidencia = evidencia;
  }

  /**
   * Detecta errores visuales en la página
   */
  async detectarErroresVisuales() {
    const errores = [];
    
    try {
      // 1. Pantalla en blanco
      const bodyText = await this.page.textContent('body');
      if (!bodyText || bodyText.trim().length < 50) {
        errores.push({
          tipo: 'PANTALLA_EN_BLANCO',
          severidad: 'P0',
          descripcion: 'La página está en blanco o tiene muy poco contenido',
          detalles: `Contenido: ${bodyText?.substring(0, 100) || 'vacío'}`
        });
      }

      // 2. Elementos superpuestos
      const elementosSuperpuestos = await this.detectarElementosSuperpuestos();
      if (elementosSuperpuestos.length > 0) {
        errores.push({
          tipo: 'ELEMENTOS_SUPERPUESTOS',
          severidad: 'P2',
          descripcion: 'Se detectaron elementos superpuestos',
          detalles: elementosSuperpuestos
        });
      }

      // 3. Texto cortado
      const textoCortado = await this.detectarTextoCortado();
      if (textoCortado.length > 0) {
        errores.push({
          tipo: 'TEXTO_CORTADO',
          severidad: 'P3',
          descripcion: 'Hay texto cortado en la página',
          detalles: textoCortado
        });
      }

      // 4. Overflow horizontal
      const overflow = await this.detectarOverflowHorizontal();
      if (overflow) {
        errores.push({
          tipo: 'OVERFLOW_HORIZONTAL',
          severidad: 'P2',
          descripcion: 'La página tiene overflow horizontal',
          detalles: 'Se detectó scroll horizontal no deseado'
        });
      }

      // 5. Spinners eternos
      const spinners = await this.detectarSpinnersEternos();
      if (spinners > 0) {
        errores.push({
          tipo: 'SPINNER_ETERNO',
          severidad: 'P1',
          descripcion: 'Hay spinners de carga que no desaparecen',
          detalles: `${spinners} spinners detectados`
        });
      }

      // 6. Modales congelados
      const modalesCongelados = await this.detectarModalesCongelados();
      if (modalesCongelados) {
        errores.push({
          tipo: 'MODAL_CONGELADO',
          severidad: 'P1',
          descripcion: 'Hay un modal abierto que no se puede cerrar',
          detalles: 'El modal permanece visible sin forma de cerrarlo'
        });
      }

    } catch (error) {
      errores.push({
        tipo: 'ERROR_VALIDACION_VISUAL',
        severidad: 'P2',
        descripcion: 'Error al validar errores visuales',
        detalles: error.message
      });
    }

    return errores;
  }

  /**
   * Detecta elementos superpuestos
   */
  async detectarElementosSuperpuestos() {
    const superpuestos = [];
    
    try {
      // Ejecutar JavaScript para detectar superposiciones
      const resultado = await this.page.evaluate(() => {
        const elementos = document.querySelectorAll('*');
        const superpuestos = [];
        
        for (let i = 0; i < elementos.length; i++) {
          const el1 = elementos[i];
          const rect1 = el1.getBoundingClientRect();
          
          // Ignorar elementos ocultos o muy pequeños
          if (rect1.width === 0 || rect1.height === 0 || 
              el1.style.display === 'none' || 
              el1.style.visibility === 'hidden') {
            continue;
          }
          
          for (let j = i + 1; j < elementos.length; j++) {
            const el2 = elementos[j];
            const rect2 = el2.getBoundingClientRect();
            
            if (rect2.width === 0 || rect2.height === 0 ||
                el2.style.display === 'none' ||
                el2.style.visibility === 'hidden') {
              continue;
            }
            
            // Verificar si se superponen
            if (!(rect1.right < rect2.left || 
                  rect1.left > rect2.right || 
                  rect1.bottom < rect2.top || 
                  rect1.top > rect2.bottom)) {
              superpuestos.push({
                elemento1: el1.tagName + (el1.id ? `#${el1.id}` : ''),
                elemento2: el2.tagName + (el2.id ? `#${el2.id}` : '')
              });
            }
          }
        }
        
        return superpuestos.slice(0, 5); // Limitar a 5
      });
      
      superpuestos.push(...resultado);
    } catch (error) {
      // Ignorar errores en esta detección
    }
    
    return superpuestos;
  }

  /**
   * Detecta texto cortado
   */
  async detectarTextoCortado() {
    const cortados = [];
    
    try {
      const resultado = await this.page.evaluate(() => {
        const elementos = document.querySelectorAll('*');
        const cortados = [];
        
        for (const el of elementos) {
          const style = window.getComputedStyle(el);
          const overflow = style.overflow;
          const textOverflow = style.textOverflow;
          
          if ((overflow === 'hidden' || overflow === 'scroll') && textOverflow === 'ellipsis') {
            const scrollWidth = el.scrollWidth;
            const clientWidth = el.clientWidth;
            
            if (scrollWidth > clientWidth) {
              cortados.push({
                elemento: el.tagName + (el.id ? `#${el.id}` : ''),
                texto: el.textContent?.substring(0, 50)
              });
            }
          }
        }
        
        return cortados.slice(0, 5);
      });
      
      cortados.push(...resultado);
    } catch (error) {
      // Ignorar
    }
    
    return cortados;
  }

  /**
   * Detecta overflow horizontal
   */
  async detectarOverflowHorizontal() {
    try {
      const tieneOverflow = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      return tieneOverflow;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta spinners eternos
   */
  async detectarSpinnersEternos() {
    try {
      // Esperar 3 segundos y verificar si los spinners siguen ahí
      await this.page.waitForTimeout(3000);
      
      const spinners = await this.page.locator(
        '.spinner, .loading, [role="progressbar"], .loader, .loading-spinner'
      ).count();
      
      return spinners;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Detecta modales congelados
   */
  async detectarModalesCongelados() {
    try {
      const modales = await this.page.locator('[role="dialog"], .modal, .modal-open').all();
      
      for (const modal of modales) {
        const esVisible = await modal.isVisible();
        if (!esVisible) continue;
        
        // Verificar si tiene botón de cerrar
        const botonCerrar = await modal.locator('button[aria-label="Close"], button:has-text("Cerrar"), button:has-text("Cancelar")').count();
        
        if (botonCerrar === 0) {
          return true; // Modal sin botón de cerrar
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta errores de consola
   */
  async detectarErroresConsola() {
    const errores = this.evidencia.consoleCapture.getErrores();
    
    // Filtrar solo errores y warnings
    return errores.filter(e => e.type === 'error' || e.type === 'warning');
  }

  /**
   * Detecta errores de red
   */
  async detectarErroresNetwork() {
    return this.evidencia.networkLogger.getErrores();
  }

  /**
   * Valida la experiencia de usuario
   */
  async validarUX() {
    const problemas = [];
    
    try {
      // 1. Verificar tiempo de carga
      const tiempoCarga = await this.medirTiempoCarga();
      if (tiempoCarga > 3000) {
        problemas.push({
          tipo: 'CARGA_LENTA',
          severidad: 'P2',
          descripcion: 'La página tarda más de 3 segundos en cargar',
          detalles: `Tiempo: ${tiempoCarga}ms`
        });
      }

      // 2. Verificar responsive
      const responsive = await this.verificarResponsive();
      if (!responsive) {
        problemas.push({
          tipo: 'NO_RESPONSIVE',
          severidad: 'P3',
          descripcion: 'La página no se adapta correctamente a diferentes tamaños',
          detalles: 'Problemas de layout detectados'
        });
      }

      // 3. Verificar navegación con teclado
      const navegacionTeclado = await this.verificarNavegacionTeclado();
      if (!navegacionTeclado) {
        problemas.push({
          tipo: 'NAVEGACION_TECLADO',
          severidad: 'P3',
          descripcion: 'La navegación con teclado no funciona correctamente',
          detalles: 'Elementos no accesibles con Tab'
        });
      }

    } catch (error) {
      problemas.push({
        tipo: 'ERROR_VALIDACION_UX',
        severidad: 'P2',
        descripcion: 'Error al validar UX',
        detalles: error.message
      });
    }

    return problemas;
  }

  /**
   * Mide el tiempo de carga de la página
   */
  async medirTiempoCarga() {
    const timing = await this.page.evaluate(() => {
      return {
        loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
        domContentLoaded: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart
      };
    });
    
    return timing.loadTime || timing.domContentLoaded || 0;
  }

  /**
   * Verifica que la página es responsive
   */
  async verificarResponsive() {
    // Verificar en diferentes viewports
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Móvil
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(500);
      
      const overflow = await this.detectarOverflowHorizontal();
      if (overflow) {
        return false;
      }
    }
    
    // Restaurar viewport original
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    return true;
  }

  /**
   * Verifica navegación con teclado
   */
  async verificarNavegacionTeclado() {
    try {
      // Presionar Tab varias veces
      for (let i = 0; i < 10; i++) {
        await this.page.keyboard.press('Tab');
      }
      
      // Verificar que hay un elemento enfocado
      const elementoEnfocado = await this.page.evaluate(() => {
        return document.activeElement !== document.body;
      });
      
      return elementoEnfocado;
    } catch (error) {
      return false;
    }
  }

  /**
   * Valida accesibilidad básica
   */
  async validarAccesibilidad() {
    const problemas = [];
    
    try {
      // 1. Verificar que todas las imágenes tienen alt
      const imagenesSinAlt = await this.page.locator('img:not([alt])').count();
      if (imagenesSinAlt > 0) {
        problemas.push({
          tipo: 'IMAGEN_SIN_ALT',
          severidad: 'P3',
          descripcion: 'Hay imágenes sin atributo alt',
          detalles: `${imagenesSinAlt} imágenes sin alt`
        });
      }

      // 2. Verificar que los inputs tienen labels
      const inputsSinLabel = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        let sinLabel = 0;
        
        for (const input of inputs) {
          const id = input.id;
          const hasLabel = id && document.querySelector(`label[for="${id}"]`);
          const hasAriaLabel = input.hasAttribute('aria-label');
          
          if (!hasLabel && !hasAriaLabel) {
            sinLabel++;
          }
        }
        
        return sinLabel;
      });
      
      if (inputsSinLabel > 0) {
        problemas.push({
          tipo: 'INPUT_SIN_LABEL',
          severidad: 'P3',
          descripcion: 'Hay inputs sin label asociado',
          detalles: `${inputsSinLabel} inputs sin label`
        });
      }

      // 3. Verificar contraste de color (básico)
      const contrasteBajo = await this.detectarContrasteBajo();
      if (contrasteBajo.length > 0) {
        problemas.push({
          tipo: 'CONTRASTE_BAJO',
          severidad: 'P3',
          descripcion: 'Hay texto con bajo contraste',
          detalles: contrasteBajo
        });
      }

    } catch (error) {
      problemas.push({
        tipo: 'ERROR_VALIDACION_ACCESIBILIDAD',
        severidad: 'P2',
        descripcion: 'Error al validar accesibilidad',
        detalles: error.message
      });
    }

    return problemas;
  }

  /**
   * Detecta texto con bajo contraste
   */
  async detectarContrasteBajo() {
    // Implementación básica - en producción usar herramienta especializada
    return [];
  }

  /**
   * Genera reporte completo de validación
   */
  async generarReporteValidacion() {
    console.log('   🔍 Ejecutando validación completa...');
    
    const reporte = {
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      
      erroresVisuales: await this.detectarErroresVisuales(),
      erroresConsola: await this.detectarErroresConsola(),
      erroresNetwork: await this.detectarErroresNetwork(),
      problemasUX: await this.validarUX(),
      problemasAccesibilidad: await this.validarAccesibilidad()
    };
    
    // Calcular resumen
    reporte.resumen = {
      totalErrores: reporte.erroresVisuales.length + 
                    reporte.erroresConsola.length + 
                    reporte.erroresNetwork.length +
                    reporte.problemasUX.length +
                    reporte.problemasAccesibilidad.length,
      criticos: reporte.erroresVisuales.filter(e => e.severidad === 'P0').length +
                reporte.erroresNetwork.filter(e => e.severidad === 'P0').length,
      altos: reporte.erroresVisuales.filter(e => e.severidad === 'P1').length +
             reporte.erroresConsola.filter(e => e.severidad === 'P1').length +
             reporte.erroresNetwork.filter(e => e.severidad === 'P1').length
    };
    
    return reporte;
  }
}

// Exportar clase
module.exports = ValidadorComportamiento;