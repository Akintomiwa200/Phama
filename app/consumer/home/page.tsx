import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConsumerHome } from './ConsumerHome';

export default function ConsumerHomePage() {
  return (
    <DashboardLayout portal="consumer">
      <ConsumerHome />
    </DashboardLayout>
  );
}
