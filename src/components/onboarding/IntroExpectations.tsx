import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Shield, AlertTriangle, ArrowRight } from 'lucide-react';

interface IntroExpectationsProps {
  productionName: string;
  onContinue: () => void;
}

export const IntroExpectations: React.FC<IntroExpectationsProps> = ({ 
  productionName, 
  onContinue 
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Your AI Physio Twin</CardTitle>
        <CardDescription>
          Get personalized support for {productionName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Work in Progress:</strong> This AI assistant is continuously improving. 
            Your feedback helps us provide better support for performers like you.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">What I Can Help With</h3>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Sleep optimization for show schedules</li>
                <li>• Nutrition guidance for touring and resident performers</li>
                <li>• Warm-up and recovery routines</li>
                <li>• Managing performance-related challenges</li>
                <li>• Adapting to hotel and venue environments</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Important Boundaries</h3>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• I cannot diagnose medical conditions</li>
                <li>• I don't provide medication advice</li>
                <li>• For injuries or health concerns, I'll direct you to appropriate medical professionals</li>
                <li>• All guidance is general and should complement professional medical care</li>
              </ul>
            </div>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong>Red Flag Policy:</strong> If you describe symptoms that suggest serious injury 
            (like suspected concussion, severe pain, or other concerning signs), I'll immediately 
            direct you to seek proper medical attention.
          </AlertDescription>
        </Alert>

        <div className="pt-4">
          <Button onClick={onContinue} className="w-full" size="lg">
            I Understand - Let's Begin
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          By continuing, you acknowledge that this AI assistant provides general guidance only 
          and is not a substitute for professional medical advice.
        </div>
      </CardContent>
    </Card>
  );
};