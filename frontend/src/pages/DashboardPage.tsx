import { motion } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ width: '100%' }}
    >
      <Header title="Dashboard" subtitle="Real-time incident overview" />
      <div className="page-container" style={{ position: 'relative' }}>
        <StatsBar stats={stats} isLoading={statsLoading} />

        <div className="charts-grid" style={{ marginTop: '32px' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <LiveChart stats={stats} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatusDonut stats={stats} />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginTop: '32px' }}
        >
          <IncidentTable
            workItems={workItemsData?.data ?? []}
            isLoading={workItemsLoading}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
