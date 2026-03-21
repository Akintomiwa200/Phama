import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RetailerAnalytics } from './RetailerAnalytics';
export default function Page() {
  return <DashboardLayout portal="retailer"><RetailerAnalytics /></DashboardLayout>;
}
