import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminDrugsPage } from './AdminDrugsPage';
export default function Page() {
  return <DashboardLayout portal="admin"><AdminDrugsPage /></DashboardLayout>;
}
