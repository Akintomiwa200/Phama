import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RetailersPage } from './RetailersPage';
export default function Page() {
  return <DashboardLayout portal="wholesaler"><RetailersPage /></DashboardLayout>;
}
