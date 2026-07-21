/**
 * A.F.I. - Interactor Universal
 * Interactúa con la interfaz como un usuario humano real
 * 
 * @author Sistema AFI
 * @version 1.0.0
 */

class InteractorUniversal {
  constructor(page, evidencia) {
    this.page = page;
    this.evidencia = evidencia;
    this.timeout = 30000;
  }

  /**
   * Prueba un botón - hace clic y valida que algo ocurra
   */
  async probarBoton(selector, opciones = {}) {
    const {
      nombre = 'Botón',
      esperarNavegacion = false,
      urlEsperada = null,
      esperarModal = false,
      esperarToast = false,
      timeout = 5000
    } = opciones;

    console.log(`      🖱️  Probando botón: ${nombre}`);
    
    const resultado = {
      exitoso: false,
      esperado: 'El botón debe ejecutar una acción',
      obtenido: 'No ocurrió ninguna acción',
      detalles: [],
      severidad: 'P2'
    };

    try {
      // 1. Verificar que el botón existe
      const boton = this.page.locator(selector).first();
      const existe = await boton.count() > 0;
      
      if (!existe) {
        resultado.detalles.push('Botón no encontrado en el DOM');
        resultado.severidad = 'P1';
        return resultado;
      }

      // 2. Verificar que está visible
      const esVisible = await boton.isVisible();
      if (!esVisible) {
        resultado.detalles.push('Botón existe pero no está visible');
        resultado.severidad = 'P3';
        return resultado;
      }

      // 3. Verificar que está habilitado
      const estaHabilitado = await boton.isEnabled();
      if (!estaHabilitado) {
        resultado.detalles.push('Botón está deshabilitado');
        resultado.obtenido = 'Botón deshabilitado';
        return resultado;
      }

      // 4. Capturar screenshot antes del clic
      await this.evidencia.capturarScreenshot(`boton-antes-${nombre.replace(/\s+/g, '-').toLowerCase()}`);

      // 5. Obtener estado antes del clic
      const estadoAntes = await this.capturarEstadoActual();

      // 6. Hacer clic
      await boton.click();
      console.log(`         ✅ Clic ejecutado`);

      // 7. Esperar un momento para que ocurra la acción
      await this.page.waitForTimeout(1000);

      // 8. Capturar screenshot después del clic
      await this.evidencia.capturarScreenshot(`boton-despues-${nombre.replace(/\s+/g, '-').toLowerCase()}`);

      // 9. Obtener estado después del clic
      const estadoDespues = await this.capturarEstadoActual();

      // 10. Verificar qué cambió
      const cambios = this.detectarCambios(estadoAntes, estadoDespues);

      if (cambios.hayCambios) {
        resultado.exitoso = true;
        resultado.obtenido = `Acción ejecutada: ${cambios.descripcion}`;
        resultado.detalles = cambios.detalles;
        console.log(`         ✅ Cambio detectado: ${cambios.descripcion}`);
      } else {
        // No hubo cambios visibles
        resultado.obtenido = 'No se detectaron cambios después del clic';
        resultado.detalles.push('No hubo navegación, modal, toast, ni cambio visual');
        
        // Verificar si hay errores en consola
        const erroresConsola = this.evidencia.consoleCapture.getErroresRecientes();
        if (erroresConsola.length > 0) {
          resultado.detalles.push(`Errores de consola: ${erroresConsola.join(', ')}`);
          resultado.severidad = 'P1';
        }
      }

      // 11. Verificar navegación si se esperaba
      if (esperarNavegacion) {
        const urlActual = this.page.url();
        if (urlEsperada && !urlActual.includes(urlEsperada)) {
          resultado.exitoso = false;
          resultado.obtenido = `No navegó a ${urlEsperada}. URL actual: ${urlActual}`;
          resultado.severidad = 'P1';
        }
      }

      // 12. Verificar modal si se esperaba
      if (esperarModal) {
        const modalVisible = await this.page.locator('[role="dialog"], .modal, .modal-open').count() > 0;
        if (!modalVisible) {
          resultado.exitoso = false;
          resultado.obtenido = 'No se abrió el modal esperado';
          resultado.severidad = 'P2';
        }
      }

    } catch (error) {
      resultado.detalles.push(`Error: ${error.message}`);
      resultado.severidad = 'P1';
    }

    return resultado;
  }

  /**
   * Llena un campo de formulario
   */
  async llenarCampo(selector, valor) {
    console.log(`      📝 Llenando campo: ${selector}`);
    
    try {
      const campo = this.page.locator(selector).first();
      
      // Verificar que existe
      if (await campo.count() === 0) {
        throw new Error(`Campo no encontrado: ${selector}`);
      }

      // Limpiar campo
      await campo.clear();
      
      // Llenar con el valor
      await campo.fill(valor);
      
      // Verificar que se llenó correctamente
      const valorIngresado = await campo.inputValue();
      
      if (valorIngresado !== valor) {
        console.log(`         ⚠️  Valor esperado: ${valor}, obtenido: ${valorIngresado}`);
      } else {
        console.log(`         ✅ Campo llenado correctamente`);
      }

      // Pequeña pausa para simular humano
      await this.page.waitForTimeout(300);

    } catch (error) {
      console.log(`         ❌ Error llenando campo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Prueba un formulario completo
   */
  async probarFormulario(formulario, opciones = {}) {
    const {
      nombre = 'Formulario',
      datosPrueba = {},
      esperarExito = true
    } = opciones;

    console.log(`      📝 Probando formulario: ${nombre}`);

    try {
      // 1. Capturar estado inicial
      await this.evidencia.capturarScreenshot(`form-${nombre.replace(/\s+/g, '-').toLowerCase()}-inicial`);

      // 2. Llenar campos
      const campos = await formulario.locator('input, select, textarea').all();
      
      for (const campo of campos) {
        const name = await campo.getAttribute('name');
        const type = await campo.getAttribute('type');
        const placeholder = await campo.getAttribute('placeholder');

        // Determinar qué valor usar
        let valor = datosPrueba[name] || this.generarValorPorDefecto(name, type, placeholder);
        
        // Llenar campo
        await this.llenarCampo(campo, valor);
      }

      // 3. Capturar estado con datos llenados
      await this.evidencia.capturarScreenshot(`form-${nombre.replace(/\s+/g, '-').toLowerCase()}-lleno`);

      // 4. Intentar enviar vacío primero (si hay botón submit)
      const botonSubmit = formulario.locator('button[type="submit"], input[type="submit"]');
      if (await botonSubmit.count() > 0) {
        console.log(`         🧪 Probando envío vacío...`);
        
        // Limpiar campos
        for (const campo of campos) {
          await campo.clear();
        }
        
        // Intentar enviar
        await botonSubmit.click();
        await this.page.waitForTimeout(1000);
        
        // Verificar si hay mensajes de validación
        const mensajesValidacion = await formulario.locator('.error, .invalid, [role="alert"]').all();
        if (mensajesValidacion.length > 0) {
          console.log(`         ✅ Validación detectada (${mensajesValidacion.length} mensajes)`);
        } else {
          console.log(`         ⚠️  No se detectaron validaciones al enviar vacío`);
        }
      }

      // 5. Llenar con datos válidos y enviar
      for (const campo of campos) {
        const name = await campo.getAttribute('name');
        const type = await campo.getAttribute('type');
        const placeholder = await campo.getAttribute('placeholder');
        
        let valor = datosPrueba[name] || this.generarValorPorDefecto(name, type, placeholder);
        await this.llenarCampo(campo, valor);
      }

      // 6. Enviar formulario
      if (await botonSubmit.count() > 0) {
        await this.evidencia.capturarScreenshot(`form-${nombre.replace(/\s+/g, '-').toLowerCase()}-pre-envio`);
        await botonSubmit.click();
        console.log(`         ✅ Formulario enviado`);
      }

      // 7. Esperar y verificar resultado
      await this.page.waitForTimeout(2000);
      await this.evidencia.capturarScreenshot(`form-${nombre.replace(/\s+/g, '-').toLowerCase()}-post-envio`);

      // 8. Verificar éxito
      if (esperarExito) {
        const hayExito = await this.detectarMensajeExito();
        if (hayExito) {
          console.log(`         ✅ Formulario guardado exitosamente`);
        } else {
          console.log(`         ⚠️  No se confirmó éxito del formulario`);
        }
      }

    } catch (error) {
      console.log(`         ❌ Error en formulario: ${error.message}`);
      await this.evidencia.capturarScreenshot(`form-${nombre.replace(/\s+/g, '-').toLowerCase()}-error`);
    }
  }

  /**
   * Prueba una tabla - paginación, ordenamiento, filtros
   */
  async probarTabla(tabla, opciones = {}) {
    const {
      nombre = 'Tabla'
    } = opciones;

    console.log(`      📊 Probando tabla: ${nombre}`);

    try {
      // 1. Verificar que la tabla tiene datos
      const filas = await tabla.locator('tr, tbody tr').all();
      const tieneDatos = filas.length > 1; // Más que el header

      if (!tieneDatos) {
        console.log(`         ⚠️  Tabla vacía`);
        return;
      }

      console.log(`         📈 ${filas.length} filas encontradas`);

      // 2. Probar ordenamiento (si hay headers clickeables)
      const headers = await tabla.locator('th, [role="columnheader"]').all();
      for (const header of headers.slice(0, 3)) { // Probar primeros 3 headers
        try {
          await header.click();
          await this.page.waitForTimeout(500);
          console.log(`         ✅ Ordenamiento probado`);
        } catch (error) {
          // Ignorar
        }
      }

      // 3. Probar paginación (si existe)
      const paginacion = await this.page.locator('.pagination, [role="navigation"]').count();
      if (paginacion > 0) {
        console.log(`         📄 Probando paginación...`);
        const botonesPagina = await this.page.locator('.pagination button, .pagination a').all();
        
        for (const boton of botonesPagina.slice(0, 2)) { // Probar primeras 2 páginas
          try {
            await boton.click();
            await this.page.waitForTimeout(1000);
            console.log(`         ✅ Página cambiada`);
          } catch (error) {
            // Ignorar
          }
        }
      }

      // 4. Probar búsqueda (si existe input de búsqueda)
      const searchInput = await this.page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"]').first();
      if (await searchInput.count() > 0) {
        console.log(`         🔍 Probando búsqueda...`);
        await searchInput.fill('test');
        await this.page.waitForTimeout(1000);
        console.log(`         ✅ Búsqueda ejecutada`);
        
        // Limpiar búsqueda
        await searchInput.clear();
      }

      // 5. Probar acciones de fila (si hay botones de acción)
      const botonesAccion = await tabla.locator('button, a').all();
      for (const boton of botonesAccion.slice(0, 2)) { // Probar primeras 2 acciones
        try {
          await boton.click();
          await this.page.waitForTimeout(500);
          console.log(`         ✅ Acción de fila ejecutada`);
        } catch (error) {
          // Ignorar
        }
      }

    } catch (error) {
      console.log(`         ❌ Error en tabla: ${error.message}`);
    }
  }

  /**
   * Abre un modal y prueba sus acciones
   */
  async probarModal(selectorApertura, opciones = {}) {
    const {
      nombre = 'Modal',
      esperarCierre = true
    } = opciones;

    console.log(`      🪟 Probando modal: ${nombre}`);

    try {
      // 1. Abrir modal
      const botonApertura = this.page.locator(selectorApertura).first();
      await botonApertura.click();
      await this.page.waitForTimeout(500);

      // 2. Verificar que el modal está visible
      const modal = await this.page.locator('[role="dialog"], .modal, .modal-open').first();
      const modalVisible = await modal.isVisible();

      if (!modalVisible) {
        console.log(`         ❌ Modal no se abrió`);
        return;
      }

      console.log(`         ✅ Modal abierto`);

      // 3. Probar botón cancelar/cerrar
      const botonCerrar = modal.locator('button:has-text("Cancelar"), button:has-text("Cerrar"), button[aria-label="Close"]');
      if (await botonCerrar.count() > 0) {
        await botonCerrar.first().click();
        await this.page.waitForTimeout(500);
        
        // Verificar que se cerró
        const sigueVisible = await modal.isVisible();
        if (!sigueVisible) {
          console.log(`         ✅ Modal cerrado correctamente`);
        } else {
          console.log(`         ⚠️  Modal no se cerró`);
        }
      }

    } catch (error) {
      console.log(`         ❌ Error en modal: ${error.message}`);
    }
  }

  /**
   * Genera un valor por defecto para un campo
   */
  generarValorPorDefecto(name, type, placeholder) {
    const nameLower = (name || '').toLowerCase();
    const placeholderLower = (placeholder || '').toLowerCase();

    if (type === 'email') return 'test@example.com';
    if (type === 'tel') return '+573000000000';
    if (type === 'number') return '123';
    if (type === 'password') return 'Test123!';
    if (type === 'url') return 'https://example.com';
    if (type === 'date') return '2026-07-18';
    if (nameLower.includes('nombre') || nameLower.includes('name')) return 'Usuario Prueba';
    if (nameLower.includes('email')) return 'test@example.com';
    if (nameLower.includes('telefono') || nameLower.includes('phone')) return '+573000000000';
    if (nameLower.includes('direccion') || nameLower.includes('address')) return 'Calle 123';
    if (nameLower.includes('ciudad') || nameLower.includes('city')) return 'Bogotá';
    if (nameLower.includes('pais') || nameLower.includes('country')) return 'Colombia';
    
    return 'Valor de prueba';
  }

  /**
   * Captura el estado actual de la página
   */
  async capturarEstadoActual() {
    return {
      url: this.page.url(),
      titulo: await this.page.title(),
      hayModales: await this.page.locator('[role="dialog"], .modal').count() > 0,
      hayToasts: await this.page.locator('.toast, .notification, [role="alert"]').count() > 0
    };
  }

  /**
   * Detecta cambios entre dos estados
   */
  detectarCambios(estadoAntes, estadoDespues) {
    const cambios = {
      hayCambios: false,
      descripcion: 'Sin cambios',
      detalles: []
    };

    // Cambio de URL
    if (estadoAntes.url !== estadoDespues.url) {
      cambios.hayCambios = true;
      cambios.descripcion = 'Navegación a nueva página';
      cambios.detalles.push(`URL: ${estadoAntes.url} → ${estadoDespues.url}`);
    }

    // Apertura de modal
    if (!estadoAntes.hayModales && estadoDespues.hayModales) {
      cambios.hayCambios = true;
      cambios.descripcion = 'Modal abierto';
      cambios.detalles.push('Se abrió un modal');
    }

    // Cierre de modal
    if (estadoAntes.hayModales && !estadoDespues.hayModales) {
      cambios.hayCambios = true;
      cambios.descripcion = 'Modal cerrado';
      cambios.detalles.push('Se cerró un modal');
    }

    // Aparición de toast
    if (!estadoAntes.hayToasts && estadoDespues.hayToasts) {
      cambios.hayCambios = true;
      cambios.descripcion = 'Toast/notificación apareció';
      cambios.detalles.push('Apareció una notificación');
    }

    return cambios;
  }

  /**
   * Detecta si hay un mensaje de éxito en la página
   */
  async detectarMensajeExito() {
    const selectoresExito = [
      '.success',
      '.alert-success',
      '[role="alert"]:has-text("éxito")',
      '[role="alert"]:has-text("exitoso")',
      '[role="alert"]:has-text("guardado")',
      'text=Guardado correctamente',
      'text=Operación exitosa'
    ];

    for (const selector of selectoresExito) {
      const elemento = await this.page.locator(selector).first();
      if (await elemento.count() > 0 && await elemento.isVisible()) {
        return true;
      }
    }

    return false;
  }
}

// Exportar clase
module.exports = InteractorUniversal;