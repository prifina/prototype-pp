import { useState } from 'react';
import { onboardingApi } from '@/services/onboardingApi';
import { OnboardingFormData, OnboardingResponse } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useOnboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const verifyPasscode = async (passcode: string): Promise<{ id: string; name: string } | null> => {
    setIsLoading(true);
    try {
      const result = await onboardingApi.verifyPasscode(passcode);
      toast({
        title: "Access Granted",
        description: `Welcome to ${result.name}`,
      });
      return result;
    } catch (error) {
      toast({
        title: "Invalid Passcode",
        description: "Please check your passcode and try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const submitOnboarding = async (
    productionId: string, 
    formData: OnboardingFormData
  ): Promise<OnboardingResponse | null> => {
    setIsLoading(true);
    try {
      console.log('Starting onboarding for phone:', formData.phone_number);
      const result = await onboardingApi.submitOnboarding(productionId, formData);
      console.log('Onboarding successful:', result);
      toast({
        title: "Onboarding Complete!",
        description: "Your AI Twin access has been set up successfully.",
      });
      return result;
    } catch (error) {
      console.error('Onboarding error in hook:', error);
      const errorMessage = error instanceof Error ? error.message : "There was an error setting up your account. Please try again.";
      toast({
        title: "Onboarding Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    verifyPasscode,
    submitOnboarding
  };
};