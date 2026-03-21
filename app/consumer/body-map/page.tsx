import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BodyMapPage } from './BodyMapPage';

export default function Page() {
  return (
    <DashboardLayout portal="consumer">
      <BodyMapPage />
    </DashboardLayout>
  );
}
