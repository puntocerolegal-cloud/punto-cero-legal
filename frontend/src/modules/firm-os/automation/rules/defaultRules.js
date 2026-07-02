// Default automation rules for Firm OS
// All rules are evaluated client-side using pure functions

export const AUTOMATION_RULES = [
  {
    id: 'rule_01_overloaded_lawyers',
    name: 'Abogados Sobrecargados',
    description: 'Detecta cuando un abogado tiene más de 45 casos activos',
    enabled: true,
    level: 'high',
    category: 'capacity',
    condition: `context.lawyers.some(l => 
      context.cases.filter(c => c.assignedLawyer === l.id && c.status !== 'closed').length > 45
    )`,
    actions: ['alert', 'recommend_redistribution'],
    frequency: 'realtime',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule_02_unassigned_cases',
    name: 'Casos Sin Asignar',
    description: 'Detecta cuando hay casos sin asignar a un abogado',
    enabled: true,
    level: 'high',
    category: 'assignment',
    condition: `context.cases.some(c => !c.assignedLawyer || c.assignedLawyer === null)`,
    actions: ['alert', 'recommend_assignment'],
    frequency: 'realtime',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule_03_inactive_cases',
    name: 'Casos Inactivos',
    description: 'Detecta casos que llevan más de 30 días sin movimiento',
    enabled: true,
    level: 'medium',
    category: 'monitoring',
    condition: `context.cases.some(c => {
      const lastUpdate = new Date(c.updatedAt || c.createdAt);
      const daysSince = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);
      return daysSince > 30 && c.status !== 'closed';
    })`,
    actions: ['alert', 'notify_responsible'],
    frequency: 'daily',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule_04_high_capacity_department',
    name: 'Departamento con Alta Capacidad',
    description: 'Detecta cuando un departamento supera 85% de capacidad',
    enabled: true,
    level: 'medium',
    category: 'capacity',
    condition: `context.departments.some(d => {
      const deptLawyers = context.lawyers.filter(l => l.department === d.name);
      const deptCases = context.cases.filter(c => {
        const cl = deptLawyers.find(l => l.id === c.assignedLawyer);
        return !!cl;
      });
      const capacity = (deptCases.length / (deptLawyers.length * 50)) * 100;
      return capacity > 85;
    })`,
    actions: ['alert', 'recommend_hiring'],
    frequency: 'daily',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule_05_idle_lawyers',
    name: 'Abogados Disponibles',
    description: 'Detecta abogados activos sin casos asignados',
    enabled: true,
    level: 'low',
    category: 'capacity',
    condition: `context.lawyers.some(l => 
      l.status === 'activo' && context.cases.filter(c => c.assignedLawyer === l.id && c.status !== 'closed').length === 0
    )`,
    actions: ['recommend_assignment'],
    frequency: 'realtime',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule_06_firm_capacity',
    name: 'Capacidad Total de Firma',
    description: 'Detecta cuando la firma opera a más del 90% de capacidad',
    enabled: true,
    level: 'critical',
    category: 'capacity',
    condition: `(context.cases.length / (context.lawyers.length * 50)) * 100 > 90`,
    actions: ['alert', 'recommend_hiring', 'escalate'],
    frequency: 'daily',
    createdAt: new Date().toISOString(),
  },
];

export const RULE_CATEGORIES = {
  capacity: {
    label: 'Capacidad',
    color: 'blue',
    icon: 'Zap',
  },
  assignment: {
    label: 'Asignación',
    color: 'purple',
    icon: 'Users',
  },
  monitoring: {
    label: 'Monitoreo',
    color: 'amber',
    icon: 'AlertCircle',
  },
  performance: {
    label: 'Rendimiento',
    color: 'emerald',
    icon: 'TrendingUp',
  },
  risk: {
    label: 'Riesgo',
    color: 'red',
    icon: 'AlertTriangle',
  },
};

export const AUTOMATION_ACTIONS = {
  alert: {
    label: 'Generar Alerta',
    description: 'Notificar a usuarios sobre la condición',
  },
  recommend_redistribution: {
    label: 'Redistribución',
    description: 'Recomendación de redistribuir casos',
  },
  recommend_assignment: {
    label: 'Asignación',
    description: 'Recomendación de asignar casos',
  },
  recommend_hiring: {
    label: 'Contratación',
    description: 'Recomendación de contratar',
  },
  notify_responsible: {
    label: 'Notificar',
    description: 'Notificar al responsable',
  },
  escalate: {
    label: 'Escalar',
    description: 'Escalar a nivel ejecutivo',
  },
};
