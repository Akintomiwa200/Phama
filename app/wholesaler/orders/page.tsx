import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WholesalerOrders } from './WholesalerOrders';
export default function Page() {
  return <DashboardLayout portal="wholesaler"><WholesalerOrders /></DashboardLayout>;
}
