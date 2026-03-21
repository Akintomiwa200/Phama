import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AccountingPage } from './AccountingPage';
export default function Page() {
  return <DashboardLayout portal="wholesaler"><AccountingPage /></DashboardLayout>;
}
