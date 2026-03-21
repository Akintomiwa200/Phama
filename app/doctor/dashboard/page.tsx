import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DoctorDashboard } from './DoctorDashboard';
export default function Page() {
  return <DashboardLayout portal="admin"><DoctorDashboard /></DashboardLayout>;
}
