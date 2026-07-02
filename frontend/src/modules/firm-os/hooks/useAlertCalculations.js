import { useMemo } from "react";
import { AlertCircle, Users, Calendar, FolderKanban, TrendingUp, CheckCircle2, Clock } from "lucide-react";

export function useAlertCalculations(lawyers = [], cases = [], clients = [], access = null) {
  return useMemo(() => {
    const alerts = [];

    // Casos sin abogado
    const casesWithoutLawyer = cases.filter(c => !c.lawyer_id);
    if (casesWithoutLawyer.length > 0) {
      alerts.push({
        id: 'cases-no-lawyer',
        icon: FolderKanban,
        title: 'Casos sin Abogado',
        description: `${casesWithoutLawyer.length} caso(s) esperando asignación`,
        type: 'critical',
        action: 'Asignar ahora',
      });
    }

    // Abogados sobrecargados
    const overloadedLawyers = lawyers.filter(l => (l.total_cases || 0) > 5);
    if (overloadedLawyers.length > 0) {
      alerts.push({
        id: 'overloaded-lawyers',
        icon: Users,
        title: 'Abogados Sobrecargados',
        description: `${overloadedLawyers.length} abogado(s) con más de 5 casos`,
        type: 'warning',
        action: 'Revisar carga',
      });
    }

    // Audiencias próximas (si hay campo)
    const upcomingHearings = cases.filter(c => 
      c.hearing_date && new Date(c.hearing_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    if (upcomingHearings.length > 0) {
      alerts.push({
        id: 'upcoming-hearings',
        icon: Calendar,
        title: 'Audiencias Próximas',
        description: `${upcomingHearings.length} audiencia(s) en los próximos 7 días`,
        type: 'info',
        action: 'Ver calendario',
      });
    }

    // Capacidad del plan
    const planCapacity = access?.plan?.name === "consolidacion-empresarial" ? 10 : 5;
    const lawyerCount = lawyers.length;
    if (lawyerCount >= planCapacity * 0.8) {
      alerts.push({
        id: 'plan-capacity',
        icon: Zap,
        title: lawyerCount >= planCapacity ? 'Plan Lleno' : 'Capacidad Casi Llena',
        description: `${lawyerCount} de ${planCapacity} abogados contratados`,
        type: lawyerCount >= planCapacity ? 'critical' : 'warning',
        action: 'Actualizar plan',
      });
    }

    // Clientes sin seguimiento
    const clientsNoFollow = clients.filter(c => !c.last_contact_date);
    if (clientsNoFollow.length > 0) {
      alerts.push({
        id: 'clients-no-follow',
        icon: TrendingUp,
        title: 'Clientes sin Seguimiento',
        description: `${clientsNoFollow.length} cliente(s) sin contacto reciente`,
        type: 'warning',
        action: 'Contactar',
      });
    }

    // Documentos pendientes
    const pendingDocs = cases.filter(c => c.pending_documents > 0);
    if (pendingDocs.length > 0) {
      const totalDocs = pendingDocs.reduce((sum, c) => sum + (c.pending_documents || 0), 0);
      alerts.push({
        id: 'pending-docs',
        icon: Clock,
        title: 'Documentos Pendientes',
        description: `${totalDocs} documento(s) aguardando elaboración`,
        type: 'info',
        action: 'Ver documentos',
      });
    }

    // All clear
    if (alerts.length === 0) {
      alerts.push({
        id: 'all-clear',
        icon: CheckCircle2,
        title: 'Todo Bajo Control',
        description: 'No hay alertas. Continuarás siendo notificado de cambios importantes.',
        type: 'success',
      });
    }

    const criticalCount = alerts.filter(a => a.type === 'critical').length;
    const warningCount = alerts.filter(a => a.type === 'warning').length;

    return {
      alerts,
      criticalCount,
      warningCount,
    };
  }, [lawyers, cases, clients, access?.plan?.name]);
}
