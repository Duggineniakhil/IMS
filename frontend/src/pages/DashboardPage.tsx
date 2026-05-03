import { Header } from '../components/layout/Header';
import { StatsBar } from '../components/dashboard/StatsBar';
import { LiveChart } from '../components/dashboard/LiveChart';
import { StatusDonut } from '../components/dashboard/StatusDonut';
import { IncidentTable } from '../components/incidents/IncidentTable';
import { useDashboard } from '../hooks/useDashboard';
import { useWorkItems } from '../hooks/useWorkItems';

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboard();
  const { data: workItemsData, isLoading: workItemsLoading } = useWorkItems({ limit: 20 });

  return (
    <>
      <Header title="Dashboard" subtitle="Real-time incident overview" />
      <div className="page-container">
        <StatsBar stats={stats} isLoading={statsLoading} />

        <div className="charts-grid">
          <LiveChart stats={stats} />
          <StatusDonut stats={stats} />
        </div>

        <IncidentTable
          workItems={workItemsData?.data ?? []}
          isLoading={workItemsLoading}
        />
      </div>
    </>
  );
}
