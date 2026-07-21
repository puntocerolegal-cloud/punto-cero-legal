/**
 * ESCENARIO DE PRUEBA PARA VALIDACIÓN DEL AUDITOR AUTOMÁTICO
 * 
 * Este componente contiene intencionalmente múltiples tipos de errores
 * para validar que el sistema de auditoría los detecta correctamente.
 * 
 * ERRORES INTRODUCIDOS:
 * 1. Botón sin evento onClick
 * 2. Botón que ejecuta función con error
 * 3. Llamada a API inexistente (404)
 * 4. Formulario con validación incorrecta
 * 5. Campo obligatorio que permite enviarse vacío
 * 6. Modal que no cierra correctamente
 * 7. Enlace roto
 * 8. Componente con warning de React
 * 9. Módulo con datos vacíos sin manejo
 * 10. Console.error sin manejo
 */

import React, { useState, useEffect } from 'react';

// ERROR 8: Componente que produce warning de React (key faltante en lista)
const ListaSinKey = ({ items }) => {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};

// ERROR 3: Llamada a API inexistente
const fetchDataFromInvalidEndpoint = async () => {
  try {
    const response = await fetch('/api/endpoint-que-no-existe-404');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error en API inexistente:', error);
    throw error;
  }
};

// ERROR 2: Función que lanza error en consola
const funcionConError = () => {
  console.error('ERROR INTENCIONAL: Esta función debería manejar este error');
  const obj = undefined;
  // Esto causará un error en runtime
  return obj.propiedadQueNoExiste;
};

// ERROR 6: Modal que no cierra correctamente
const ModalQueNoCierra = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md">
        <h2 className="text-xl font-bold mb-4">Modal de Prueba</h2>
        <p className="mb-4">Este modal tiene un botón que NO cierra correctamente.</p>
        
        {/* ERROR: Botón sin onClick o con onClick vacío */}
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Cerrar (no funciona)
        </button>
        
        {/* Este botón sí funciona para comparación */}
        <button 
          onClick={onClose}
          className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cerrar (funciona)
        </button>
      </div>
    </div>
  );
};

const TestAuditScenario = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [datos, setDatos] = useState(null);
  const [errorConsole, setErrorConsole] = useState(false);

  // ERROR 9: Módulo con datos vacíos sin manejo
  const datosVacios = {
    usuarios: [],
    casos: [],
    documentos: []
  };

  // ERROR 4 y 5: Formulario con validación incorrecta
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ERROR 5: Campo obligatorio que permite enviarse vacío
    // No hay validación de campos requeridos
    console.log('Formulario enviado sin validación:', formData);
    alert('Formulario enviado (sin validación)');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ERROR 1: Botón sin evento onClick
  const handleBotonInutil = () => {
    // Esta función no hace nada
  };

  // ERROR 7: Enlace roto
  const handleEnlaceRoto = () => {
    window.location.href = '/pagina-que-no-existe-404';
  };

  // ERROR 10: Console.error sin manejo
  const triggerErrorEnConsola = () => {
    setErrorConsole(true);
    console.error('ERROR INTENCIONAL PARA AUDITORÍA: Este error debe ser detectado');
    console.error('Stack trace simulado:', new Error('Error de prueba para auditoría').stack);
  };

  // ERROR 3: Llamada a API inexistente
  const handleLlamadaAPI404 = async () => {
    try {
      await fetchDataFromInvalidEndpoint();
    } catch (error) {
      alert(`Error capturado: ${error.message}`);
    }
  };

  // ERROR 2: Ejecutar función con error
  const handleFuncionConError = () => {
    try {
      funcionConError();
    } catch (error) {
      console.error('Error en función:', error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-red-600">
        ⚠️ Escenario de Prueba - Auditor Automático
      </h1>
      <p className="mb-6 text-gray-600">
        Este componente contiene errores intencionales para validar el sistema de auditoría.
      </p>

      {/* SECCIÓN 1: Botón sin onClick */}
      <section className="mb-8 p-6 border-2 border-red-300 rounded-lg bg-red-50">
        <h2 className="text-xl font-bold mb-4 text-red-700">
          ❌ Error 1: Botón sin evento onClick
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Este botón es visible pero no tiene ninguna funcionalidad.
        </p>
        <button 
          className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
          onClick={handleBotonInutil}
        >
          Botón Inútil (sin acción)
        </button>
      </section>

      {/* SECCIÓN 2: Botón que lanza error */}
      <section className="mb-8 p-6 border-2 border-orange-300 rounded-lg bg-orange-50">
        <h2 className="text-xl font-bold mb-4 text-orange-700">
          ❌ Error 2: Función que lanza error en consola
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Al hacer clic, se ejecuta código que produce un error.
        </p>
        <button 
          onClick={handleFuncionConError}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          Ejecutar Función con Error
        </button>
      </section>

      {/* SECCIÓN 3: Llamada a API 404 */}
      <section className="mb-8 p-6 border-2 border-yellow-300 rounded-lg bg-yellow-50">
        <h2 className="text-xl font-bold mb-4 text-yellow-700">
          ❌ Error 3: Llamada a API inexistente (404)
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Intenta hacer una petición a un endpoint que no existe.
        </p>
        <button 
          onClick={handleLlamadaAPI404}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Llamar API Inexistente
        </button>
      </section>

      {/* SECCIÓN 4: Formulario con validación incorrecta */}
      <section className="mb-8 p-6 border-2 border-purple-300 rounded-lg bg-purple-50">
        <h2 className="text-xl font-bold mb-4 text-purple-700">
          ❌ Error 4 y 5: Formulario sin validación
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Los campos obligatorios pueden enviarse vacíos sin validación.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre (obligatorio)
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Campo obligatorio sin validación"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (obligatorio)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="email@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono (obligatorio)
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="+57 300 000 0000"
            />
          </div>
          <button 
            type="submit"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Enviar (sin validación)
          </button>
        </form>
      </section>

      {/* SECCIÓN 5: Modal que no cierra */}
      <section className="mb-8 p-6 border-2 border-pink-300 rounded-lg bg-pink-50">
        <h2 className="text-xl font-bold mb-4 text-pink-700">
          ❌ Error 6: Modal que no cierra correctamente
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Uno de los botones del modal no tiene la funcionalidad de cierre.
        </p>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
        >
          Abrir Modal
        </button>
        <ModalQueNoCierra 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
        />
      </section>

      {/* SECCIÓN 6: Enlace roto */}
      <section className="mb-8 p-6 border-2 border-indigo-300 rounded-lg bg-indigo-50">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">
          ❌ Error 7: Enlace roto
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Este enlace apunta a una página que no existe (404).
        </p>
        <button 
          onClick={handleEnlaceRoto}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
        >
          Ir a Página Inexistente
        </button>
      </section>

      {/* SECCIÓN 7: Error en consola */}
      <section className="mb-8 p-6 border-2 border-red-300 rounded-lg bg-red-50">
        <h2 className="text-xl font-bold mb-4 text-red-700">
          ❌ Error 10: Error en consola sin manejo
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Este botón genera un error en la consola del navegador.
        </p>
        <button 
          onClick={triggerErrorEnConsola}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Generar Error en Consola
        </button>
        {errorConsole && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <p className="text-sm text-red-700">
              ⚠️ Revisa la consola del navegador (F12) para ver el error
            </p>
          </div>
        )}
      </section>

      {/* SECCIÓN 8: Lista sin key único (Warning React) */}
      <section className="mb-8 p-6 border-2 border-amber-300 rounded-lg bg-amber-50">
        <h2 className="text-xl font-bold mb-4 text-amber-700">
          ⚠️ Error 8: Warning de React (key faltante)
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Esta lista usa el índice del array como key, lo que causa un warning de React.
        </p>
        <ListaSinKey items={['Item 1', 'Item 2', 'Item 3']} />
        <p className="mt-2 text-xs text-gray-600">
          (Revisa la consola para ver el warning de React)
        </p>
      </section>

      {/* SECCIÓN 9: Datos vacíos sin manejo */}
      <section className="mb-8 p-6 border-2 border-gray-300 rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold mb-4 text-gray-700">
          ⚠️ Error 9: Datos vacíos sin manejo
        </h2>
        <p className="mb-4 text-sm text-gray-700">
          Este módulo tiene datos vacíos pero no muestra un estado vacío apropiado.
        </p>
        <div className="border border-gray-200 rounded p-4 bg-white">
          <h3 className="font-semibold mb-2">Módulo de Datos</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(datosVacios, null, 2)}
          </pre>
          <p className="mt-2 text-sm text-gray-600">
            No hay mensaje de "Sin datos" ni estado vacío amigable.
          </p>
        </div>
      </section>

      {/* Información del escenario */}
      <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-blue-700">
          📋 Información del Escenario de Prueba
        </h2>
        <div className="space-y-2 text-sm">
          <p><strong>Total de errores intencionales:</strong> 10</p>
          <p><strong>Objetivo:</strong> Validar que el auditor automático detecta el 100% de los errores</p>
          <p><strong>Componente:</strong> TestAuditScenario.jsx</p>
          <p><strong>Ruta:</strong> /modules/admin/pages/TestAuditScenario.jsx</p>
        </div>
      </div>
    </div>
  );
};

export default TestAuditScenario;