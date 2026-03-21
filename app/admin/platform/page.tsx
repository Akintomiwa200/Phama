import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminPlatform } from './AdminPlatform';
export default function Page() {
  return <DashboardLayout portal="admin"><AdminPlatform /></DashboardLayout>;
}
