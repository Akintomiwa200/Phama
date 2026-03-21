import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { POSPage } from './POSPage';
export default function Page() {
  return <DashboardLayout portal="retailer"><POSPage /></DashboardLayout>;
}
