import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConsumerOrdersPage } from './ConsumerOrdersPage';
export default function Page() {
  return <DashboardLayout portal="consumer"><ConsumerOrdersPage /></DashboardLayout>;
}
