import React from "react";

export default function FirmsSection({ onOpen }) {
  return (
    <section id="firmas" className="py-20 bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Firmas, Bufetes y Despachos
        </h2>

        <p className="text-gray-400 mb-8">
          Gestiona tu oficina jurídica dentro de Punto Cero Legal
        </p>

        <button
          onClick={onOpen}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold"
        >
          Registrar Mi Firma
        </button>
      </div>
    </section>
  );
}
