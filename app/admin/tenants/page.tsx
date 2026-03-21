import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TenantsPage } from './TenantsPage';
export default function Page() {
  return <DashboardLayout portal="admin"><TenantsPage /></DashboardLayout>;
}
