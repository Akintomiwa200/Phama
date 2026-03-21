import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConsultationBookingPage } from './ConsultationBookingPage';
export default function Page() {
  return <DashboardLayout portal="consumer"><ConsultationBookingPage /></DashboardLayout>;
}
