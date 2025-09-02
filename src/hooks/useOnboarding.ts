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
      console.log('Starting unauthenticated onboarding for phone:', formData.phone_number);
      const result = await onboardingApi.submitOnboarding(productionId, formData);
      console.log('Unauthenticated onboarding successful:', result);
      toast({
        title: "Onboarding Complete!",
        description: "Your AI Twin access has been set up successfully. You can now sign up for your account.",
      });
      return result;
    } catch (error) {
      console.error('Onboarding error in hook:', error);
      
      // Provide specific error messages for common issues
      let errorMessage = "There was an error setting up your account. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('RLS policy')) {
          errorMessage = "Authentication error during setup. Please refresh the page and try again.";
        } else if (error.message.includes('phone number')) {
          errorMessage = error.message; // Use the specific phone validation error
        } else {
          errorMessage = error.message;
        }
      }
      
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