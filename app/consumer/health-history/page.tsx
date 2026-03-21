import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { HealthHistoryPage } from './HealthHistoryPage';
export default function Page() {
  return <DashboardLayout portal="consumer"><HealthHistoryPage /></DashboardLayout>;
}
