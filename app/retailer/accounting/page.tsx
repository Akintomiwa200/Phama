import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AccountingPage } from '../../wholesaler/accounting/AccountingPage';
export default function Page() {
  return <DashboardLayout portal="retailer"><AccountingPage /></DashboardLayout>;
}
