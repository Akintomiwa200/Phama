import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PharmacyPage } from './PharmacyPage';
export default function Page() {
  return <DashboardLayout portal="consumer"><PharmacyPage /></DashboardLayout>;
}
