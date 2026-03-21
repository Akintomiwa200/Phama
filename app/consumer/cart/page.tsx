import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CartPage } from './CartPage';
export default function Page() {
  return <DashboardLayout portal="consumer"><CartPage /></DashboardLayout>;
}
