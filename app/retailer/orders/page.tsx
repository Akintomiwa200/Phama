import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RetailerOrders } from './RetailerOrders';
export default function Page() {
  return <DashboardLayout portal="retailer"><RetailerOrders /></DashboardLayout>;
}
