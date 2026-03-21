import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SymptomsPage } from './SymptomsPage';
export default function Page() {
  return <DashboardLayout portal="consumer"><SymptomsPage /></DashboardLayout>;
}
