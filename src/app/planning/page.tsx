import { notFound } from 'next/navigation';
import PlanningWorkspace from '@/components/planning/PlanningWorkspaceV2';

export default function PlanningPage() {
  if (process.env.NODE_ENV === 'production' && process.env.PLANNING_WORKSPACE_V1 !== 'true') {
    notFound();
  }
  return <PlanningWorkspace />;
}
