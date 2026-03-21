import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StockPage } from './StockPage';
export default function Page() {
  return <DashboardLayout portal="retailer"><StockPage /></DashboardLayout>;
}
