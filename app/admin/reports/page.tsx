import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ReportsPage } from './ReportsPage';
export default function Page() {
  return <DashboardLayout portal="admin"><ReportsPage /></DashboardLayout>;
}
