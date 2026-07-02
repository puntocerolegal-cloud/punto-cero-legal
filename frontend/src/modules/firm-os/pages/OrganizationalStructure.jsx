import React from "react";
import { Building2, Users, User, ChevronDown } from "lucide-react";

const StructureLevel = ({ title, members, icon: Icon, level }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <Icon className="h-6 w-6 text-blue-400" />
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/70">
        {members.length} {members.length === 1 ? "persona" : "personas"}
      </span>
    </div>
    
    <div className={`grid grid-cols-1 gap-3 ${level === 0 ? "md:grid-cols-1" : level === 1 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
      {members.map((member, idx) => (
        <div key={idx} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
            <div className="flex-1">
              <p className="font-medium text-white">{member.name}</p>
              <p className="text-xs text-white/60">{member.role}</p>
            </div>
          </div>
          {member.details && (
            <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs text-white/50">
              <p>📁 {member.details.cases} casos</p>
              <p>👥 {member.details.team} equipo</p>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const HierarchyArrow = () => (
  <div className="flex justify-center py-4">
    <ChevronDown className="h-6 w-6 text-white/20" />
  </div>
);

export function OrganizationalStructure() {
  // Datos de ejemplo de estructura organizacional
  const structure = {
    firma: [
      {
        name: "Firma Jurídica XYZ",
        role: "Entidad Legal",
      },
    ],
    socioDirector: [
      {
        name: "Carlos Rodríguez",
        role: "Socio Director",
        details: { cases: 15, team: 10 },
      },
    ],
    directorJuridico: [
      {
        name: "María López",
        role: "Directora Jurídica",
        details: { cases: 12, team: 8 },
      },
      {
        name: "Juan Martínez",
        role: "Director Comercial",
        details: { cases: 8, team: 5 },
      },
    ],
    coordinadores: [
      {
        name: "Ana García",
        role: "Coordinadora Civil",
        details: { cases: 20, team: 4 },
      },
      {
        name: "Roberto Pérez",
        role: "Coordinador Laboral",
        details: { cases: 15, team: 3 },
      },
      {
        name: "Sofía Ruiz",
        role: "Coordinadora Corporativo",
        details: { cases: 10, team: 3 },
      },
    ],
    abogados: [
      {
        name: "Luis Fernández",
        role: "Abogado Senior Civil",
        details: { cases: 8, team: 0 },
      },
      {
        name: "Patricia Gómez",
        role: "Abogada Laboral",
        details: { cases: 5, team: 0 },
      },
      {
        name: "Miguel Sánchez",
        role: "Abogado Corporativo",
        details: { cases: 6, team: 0 },
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Estructura Organizacional</h1>
        <p className="mt-2 text-white/60">Jerarquía y cadena de mando de la firma</p>
      </div>

      {/* Estructura visual */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
        <div className="space-y-8">
          {/* Nivel 1: Firma */}
          <StructureLevel
            title="Entidad"
            members={structure.firma}
            icon={Building2}
            level={0}
          />

          <HierarchyArrow />

          {/* Nivel 2: Socio Director */}
          <StructureLevel
            title="Dirección"
            members={structure.socioDirector}
            icon={Users}
            level={1}
          />

          <HierarchyArrow />

          {/* Nivel 3: Directores */}
          <StructureLevel
            title="Gerencia"
            members={structure.directorJuridico}
            icon={Users}
            level={1}
          />

          <HierarchyArrow />

          {/* Nivel 4: Coordinadores */}
          <StructureLevel
            title="Coordinación"
            members={structure.coordinadores}
            icon={Users}
            level={2}
          />

          <HierarchyArrow />

          {/* Nivel 5: Abogados */}
          <StructureLevel
            title="Equipo Jurídico"
            members={structure.abogados}
            icon={User}
            level={2}
          />
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
        <div className="space-y-2">
          <p className="font-medium text-blue-300">Arquitectura Escalable</p>
          <p className="text-sm text-blue-200/70">
            La estructura organizacional puede ser modificada directamente desde el módulo "Equipo Jurídico".
            Arrastrar y soltar disponible en futuras versiones.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrganizationalStructure;
