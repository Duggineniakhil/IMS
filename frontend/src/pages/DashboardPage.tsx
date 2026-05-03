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
      <div className="page-container" style={{ position: 'relative' }}>
        
        {/* Hero Section matching aesthetic */}
        <div style={{ textAlign: 'center', margin: '40px 0 60px 0', padding: '0 20px' }}>
          <h1 style={{ 
            fontSize: 'clamp(36px, 5vw, 56px)', 
            fontWeight: 800, 
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: '24px',
            color: 'var(--text-primary)'
          }}>
            Proactive On-Call And <br/> Incident Handling
          </h1>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '12px 28px' }} onClick={() => window.location.href = '/incidents'}>
              View Active Incidents
            </button>
            <button className="btn" style={{ 
              background: 'white', 
              color: 'var(--brand)', 
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              padding: '12px 28px',
              fontWeight: 600
            }} onClick={() => window.location.href = '/simulate'}>
              ⚡ Run Simulation
            </button>
          </div>
        </div>

        <StatsBar stats={stats} isLoading={statsLoading} />

        <div className="charts-grid" style={{ marginTop: '32px' }}>
          <LiveChart stats={stats} />
          <StatusDonut stats={stats} />
        </div>

        <div style={{ marginTop: '32px' }}>
          <IncidentTable
            workItems={workItemsData?.data ?? []}
            isLoading={workItemsLoading}
          />
        </div>
      </div>
    </>
  );
}
