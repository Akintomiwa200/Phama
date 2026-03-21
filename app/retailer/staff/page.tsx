import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StaffPage } from './StaffPage';
export default function Page() {
  return <DashboardLayout portal="retailer"><StaffPage /></DashboardLayout>;
}
