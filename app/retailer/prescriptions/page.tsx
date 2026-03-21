import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrescriptionsPage } from './PrescriptionsPage';
export default function Page() {
  return <DashboardLayout portal="retailer"><PrescriptionsPage /></DashboardLayout>;
}
