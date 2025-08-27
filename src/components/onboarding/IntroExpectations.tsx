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
        <CardTitle className="text-2xl">AI Performance Assistant<br/><span className="text-lg text-muted-foreground">by Production Physiotherapy</span></CardTitle>
        <CardDescription>
          Welcome to your AI Performance Assistant from Production Physiotherapy brought to you by {productionName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Work in Progress:</strong> This AI Performance Assistant is continually improving. 
            Your questions and feedback helps us provide better support for not only yourself but the community.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">What I need from you:</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We need to collect some information about you as a performing athlete, what you struggle with when it comes to your performing life, your injury history and what you might want to work on. Rest assured that this information is not shared with Production or anyone else, it creates your context that allows us to filter the knowledge base we have specifically to you and your needs.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">What I can Help with:</h3>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Upgrade your knowledge for all things sleep, nutrition and exercise</li>
                <li>• Give you recipes used in elite sports like Formula One and Premier League Football</li>
                <li>• Help you plan and establish new habits</li>
                <li>• Set up reminders to help you establish new habits</li>
                <li>• Help you build your warm up to make it appropriate for your context</li>
                <li>• Give you tools and strategies to improve sleep</li>
                <li>• Prepare you for touring and its unique challenges</li>
                <li>• And so much more</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Important Boundaries</h3>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• I cannot diagnose medical conditions or injuries</li>
                <li>• I do not provide medication advice</li>
                <li>• For injuries or health concerns, I'll direct you to appropriate medical professionals</li>
                <li>• All guidance should complement professional medical care and not replace it</li>
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