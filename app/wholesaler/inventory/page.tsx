import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WholesalerInventory } from './WholesalerInventory';
export default function Page() {
  return <DashboardLayout portal="wholesaler"><WholesalerInventory /></DashboardLayout>;
}
