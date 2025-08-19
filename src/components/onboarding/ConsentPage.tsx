import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OnboardingFormData } from '@/types/database';

interface ConsentPageProps {
  formData: OnboardingFormData;
  onAccept: () => void;
  onBack: () => void;
}

export const ConsentPage: React.FC<ConsentPageProps> = ({ 
  formData, 
  onAccept, 
  onBack 
}) => {
  const [consents, setConsents] = useState({
    privacy_policy: false,
    terms_of_service: false,
    data_processing: false
  });

  const handleConsentChange = (field: keyof typeof consents, checked: boolean) => {
    setConsents(prev => ({ ...prev, [field]: checked }));
  };

  const allConsentsGiven = Object.values(consents).every(Boolean);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Privacy & Consent</CardTitle>
        <CardDescription>
          Please review and accept our terms to continue
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary of collected data */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Data Summary</h3>
          <p className="text-sm text-muted-foreground mb-2">
            We will collect and process the following information:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Personal details: {formData.name}, {formData.role}</li>
            <li>• Show information: {formData.show_name}</li>
            <li>• Health context: Sleep environment, food constraints, goals</li>
            {formData.whatsapp_opt_in && <li>• WhatsApp messages for AI physio guidance</li>}
            {formData.injuries_notes && <li>• Health notes you provided</li>}
          </ul>
        </div>

        {/* Privacy Policy */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Privacy Policy</h3>
          <ScrollArea className="h-32 w-full rounded border p-3 text-sm">
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Data Collection:</strong> We collect personal information you provide during onboarding to deliver personalized AI physio guidance.</p>
              
              <p><strong>Data Use:</strong> Your data is used to provide AI-powered physiotherapy guidance, track your progress, and improve our services.</p>
              
              <p><strong>Data Sharing:</strong> We do not sell your personal data. We may share anonymized, aggregated data for research purposes.</p>
              
              <p><strong>Data Security:</strong> We implement industry-standard security measures to protect your data, including encryption at rest and in transit.</p>
              
              <p><strong>Data Retention:</strong> Personal data is retained for 12 months after your seat expires unless you request deletion sooner.</p>
              
              <p><strong>Your Rights:</strong> You have the right to access, correct, or delete your personal data. Contact us to exercise these rights.</p>
              
              <p><strong>WhatsApp Communications:</strong> If you opt in, we'll send you messages via WhatsApp. You can opt out by sending "STOP" at any time.</p>
            </div>
          </ScrollArea>
          
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="privacy_policy"
              checked={consents.privacy_policy}
              onCheckedChange={(checked) => handleConsentChange('privacy_policy', !!checked)}
            />
            <Label htmlFor="privacy_policy" className="text-sm">
              I have read and accept the Privacy Policy
            </Label>
          </div>
        </div>

        {/* Terms of Service */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Terms of Service</h3>
          <ScrollArea className="h-32 w-full rounded border p-3 text-sm">
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Service Description:</strong> This AI physio twin provides general wellness guidance and is not a substitute for professional medical advice.</p>
              
              <p><strong>Medical Disclaimer:</strong> The AI assistant cannot diagnose conditions, prescribe medications, or provide emergency medical care.</p>
              
              <p><strong>User Responsibilities:</strong> You must seek professional medical attention for injuries, serious symptoms, or emergencies.</p>
              
              <p><strong>Service Availability:</strong> The service is provided "as is" and we cannot guarantee 100% uptime or response times.</p>
              
              <p><strong>Prohibited Use:</strong> Do not use the service for medical emergencies or to replace professional healthcare.</p>
              
              <p><strong>Limitation of Liability:</strong> We are not liable for any health outcomes resulting from use of our AI guidance.</p>
              
              <p><strong>Termination:</strong> We may terminate access for misuse or violation of these terms.</p>
            </div>
          </ScrollArea>
          
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms_of_service"
              checked={consents.terms_of_service}
              onCheckedChange={(checked) => handleConsentChange('terms_of_service', !!checked)}
            />
            <Label htmlFor="terms_of_service" className="text-sm">
              I have read and accept the Terms of Service
            </Label>
          </div>
        </div>

        {/* Data Processing Consent */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="data_processing"
              checked={consents.data_processing}
              onCheckedChange={(checked) => handleConsentChange('data_processing', !!checked)}
            />
            <Label htmlFor="data_processing" className="text-sm">
              I consent to the processing of my personal data as described in the Privacy Policy, 
              including the use of AI systems to analyze my information and provide personalized guidance.
            </Label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back to Form
          </Button>
          <Button 
            onClick={onAccept} 
            disabled={!allConsentsGiven}
            className="flex-1"
          >
            Accept & Continue
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          By accepting, you confirm that you are authorized to provide this information 
          and consent on behalf of the specified production.
        </div>
      </CardContent>
    </Card>
  );
};