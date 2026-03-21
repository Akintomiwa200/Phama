import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ScannerPage } from './ScannerPage';
export default function Page() {
  return <DashboardLayout portal="consumer"><ScannerPage /></DashboardLayout>;
}
