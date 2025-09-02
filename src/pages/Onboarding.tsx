import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/hooks/useOnboarding';
import { PasscodeGate } from '@/components/onboarding/PasscodeGate';
import { IntroExpectations } from '@/components/onboarding/IntroExpectations';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { ConsentPage } from '@/components/onboarding/ConsentPage';
import { ConfirmationPage } from '@/components/onboarding/ConfirmationPage';
import { OnboardingFormData, OnboardingResponse } from '@/types/database';
import logoImage from '@/assets/production-physiotherapy-logo.png';

type OnboardingStep = 'passcode' | 'intro' | 'form' | 'consent' | 'confirmation';

export const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('passcode');
  const [productionData, setProductionData] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData | null>(null);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResponse | null>(null);
  const navigate = useNavigate();
  const { verifyPasscode, submitOnboarding, isLoading } = useOnboarding();

    const handlePasscodeSuccess = async (passcode: string) => {
      const production = await verifyPasscode(passcode);
      if (production) {
        setProductionData(production);
        setCurrentStep('intro');
      }
    };

  const handleIntroComplete = () => {
    setCurrentStep('form');
  };

  const handleFormComplete = (data: OnboardingFormData) => {
    setFormData(data);
    setCurrentStep('consent');
  };

  const handleConsentComplete = async () => {
    if (!productionData || !formData) return;
    
    const result = await submitOnboarding(productionData.id, formData);
    if (result) {
      setOnboardingResult(result);
      setCurrentStep('confirmation');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'passcode':
        return <PasscodeGate onSuccess={handlePasscodeSuccess} isLoading={isLoading} />;
      
      case 'intro':
        return (
          <IntroExpectations 
            productionName={productionData?.name || 'Production'}
            onContinue={handleIntroComplete}
          />
        );
      
      case 'form':
        return (
          <OnboardingForm 
            productionName={productionData?.name || 'Production'}
            onSubmit={handleFormComplete}
            initialData={formData || undefined}
          />
        );
      
      case 'consent':
        return (
          <ConsentPage 
            formData={formData!}
            onAccept={handleConsentComplete}
            onBack={() => setCurrentStep('form')}
          />
        );
      
      case 'confirmation':
        return (
          <ConfirmationPage 
            result={onboardingResult!}
            productionName={productionData?.name || 'Production'}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/f4b250ea-3fb1-453f-a9aa-f4b41cabede3.png" 
              alt="Production Physiotherapy Logo" 
              className="h-16 w-16"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Performance Assistant<br/>
            <span className="text-xl text-muted-foreground">by Production Physiotherapy</span>
          </h1>
          <p className="text-muted-foreground">
            Welcome to Production Physiotherapy's Personal Performance Coach. We are continually consolidating everything we know to improve and refine our services to you, and that has led us to developing this tool for you. What this tool gives you is access to that ever growing knowledge base whenever you need it.
          </p>
          <p className="text-muted-foreground mt-2">
            Your Production has seen the value and also believe that this could be a game changing tool for how our Performing Athletes are cared for.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mt-4">
              <div className={`w-3 h-3 rounded-full ${['intro', 'form', 'consent', 'confirmation'].includes(currentStep) ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${['form', 'consent', 'confirmation'].includes(currentStep) ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${['consent', 'confirmation'].includes(currentStep) ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-3 h-3 rounded-full ${currentStep === 'confirmation' ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </div>
          
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};