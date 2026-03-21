import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WholesalerDashboard } from './WholesalerDashboard';
export default function Page() {
  return <DashboardLayout portal="wholesaler"><WholesalerDashboard /></DashboardLayout>;
}
