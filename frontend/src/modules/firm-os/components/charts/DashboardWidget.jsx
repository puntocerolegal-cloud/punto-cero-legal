import React from 'react';
import { TrendingUp, Users, FolderKanban, AlertCircle } from 'lucide-react';
import { LineChartCard } from './LineChartCard';
import { BarChartCard } from './BarChartCard';
import { PieChartCard } from './PieChartCard';
import { AreaChartCard } from './AreaChartCard';
import { ExecutiveKPIs } from './ExecutiveKPIs';

const ICON_MAP = {
  TrendingUp: TrendingUp,
  Users: Users,
  FolderKanban: FolderKanban,
  AlertCircle: AlertCircle,
};

export function DashboardWidget({ widget }) {
  if (!widget) {
    return null;
  }

  const icon = ICON_MAP[widget.icon];

  switch (widget.type) {
    case 'kpis':
      return <ExecutiveKPIs kpis={widget.data} />;

    case 'lineChart':
      return (
        <LineChartCard
          title={widget.title}
          data={widget.data}
          xDataKey={widget.xDataKey}
          lines={widget.lines}
          icon={icon}
          subtitle={widget.subtitle}
        />
      );

    case 'barChart':
      return (
        <BarChartCard
          title={widget.title}
          data={widget.data}
          xDataKey={widget.xDataKey}
          bars={widget.bars}
          icon={icon}
          subtitle={widget.subtitle}
        />
      );

    case 'pieChart':
      return (
        <PieChartCard
          title={widget.title}
          data={widget.data}
          icon={icon}
          subtitle={widget.subtitle}
        />
      );

    case 'areaChart':
      return (
        <AreaChartCard
          title={widget.title}
          data={widget.data}
          xDataKey={widget.xDataKey}
          areas={widget.areas}
          icon={icon}
          subtitle={widget.subtitle}
        />
      );

    default:
      return null;
  }
}
