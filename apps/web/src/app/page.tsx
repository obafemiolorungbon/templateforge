import { redirect } from 'next/navigation';
import { isDemoMode } from '../lib/features';
import { DemoLanding } from './demo-landing';

export default function IndexPage() {
  if (!isDemoMode()) {
    redirect('/dashboard');
  }

  return <DemoLanding />;
}
