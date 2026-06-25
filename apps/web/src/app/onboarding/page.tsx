import { redirect } from 'next/navigation';
import { isDemoMode } from '../../lib/features';
import { DemoOnboardingForm } from './demo-onboarding-form';

export default function OnboardingPage() {
  if (!isDemoMode()) {
    redirect('/dashboard');
  }

  return <DemoOnboardingForm />;
}
