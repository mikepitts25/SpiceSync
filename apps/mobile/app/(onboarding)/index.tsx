import React, { useState } from 'react';
import { router } from 'expo-router';
import BrandMomentScreen from './brand';
import ValuePropScreen from './value';
import PrivacyScreen from './privacy';
import ProfileScreen from './profile';
import InviteScreen from './invite';

type OnboardingStep = 'brand' | 'value' | 'privacy' | 'profile' | 'invite';

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('brand');

  const goToNext = () => {
    switch (currentStep) {
      case 'brand':
        setCurrentStep('value');
        break;
      case 'value':
        setCurrentStep('privacy');
        break;
      case 'privacy':
        setCurrentStep('profile');
        break;
      case 'profile':
        setCurrentStep('invite');
        break;
      case 'invite':
        // Onboarding complete - navigate to main app
        router.replace('/(tabs)');
        break;
    }
  };

  // Render current step
  switch (currentStep) {
    case 'brand':
      return <BrandMomentScreen onComplete={goToNext} />;
    case 'value':
      return <ValuePropScreen onNext={goToNext} />;
    case 'privacy':
      return <PrivacyScreen onNext={goToNext} />;
    case 'profile':
      return <ProfileScreen onNext={goToNext} />;
    case 'invite':
      return <InviteScreen onComplete={goToNext} />;
    default:
      return null;
  }
}
