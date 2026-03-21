import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RetailerDashboard } from './RetailerDashboard';
export default function Page() {
  return <DashboardLayout portal="retailer"><RetailerDashboard /></DashboardLayout>;
}
