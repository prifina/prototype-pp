import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, MessageCircle, Smartphone, Copy, Check } from 'lucide-react';
import { OnboardingResponse } from '@/types/database';
import { useState } from 'react';

interface ConfirmationPageProps {
  result: OnboardingResponse;
  productionName: string;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ 
  result, 
  productionName 
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleWhatsAppClick = () => {
    window.open(result.wa_link, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-700">AI Performance Assistant<br/><span className="text-lg text-muted-foreground">by Production Physiotherapy</span></CardTitle>
        <CardDescription>
          You're all set<br/>
          Welcome to your AI Performance Assistant
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <MessageCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Next step:</strong> Start chatting with your AI Performance Assistant on WhatsApp. 
            Use one of the methods below to begin your conversation.
          </AlertDescription>
        </Alert>

        {/* QR Code Method */}
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center justify-center">
            <QrCode className="w-5 h-5 mr-2" />
            Method 1: Scan QR Code
          </h3>
          
          <div className="bg-white p-4 rounded-lg inline-block border">
            <img 
              src={result.qr_url} 
              alt="WhatsApp QR Code" 
              className="w-48 h-48 mx-auto"
              onError={(e) => {
                // Fallback to a placeholder or generate QR code
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UVIgQ29kZTwvdGV4dD48L3N2Zz4=';
              }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Open your phone's camera or WhatsApp and scan this QR code
          </p>
        </div>

        {/* Direct Link Method */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Method 2: Direct Link
          </h3>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleWhatsAppClick}
              className="flex-1"
              size="lg"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open WhatsApp
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => copyToClipboard(result.wa_link)}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Click "Open WhatsApp" or copy the link to share with others
          </p>
        </div>

        {/* Fallback Instructions */}
        <Alert>
          <AlertDescription>
            <strong>Don't have WhatsApp?</strong>
            <div className="mt-2 text-sm">
              <p>1. Download WhatsApp from your app store</p>
              <p>2. Set up your account with your phone number</p>
              <p>3. Come back and use one of the methods above</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* What to Expect */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">What to Expect</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• A greeting from your AI Performance Assistant</li>
            <li>• You can lead the conversation with your first question or stating your initial goal</li>
            <li>• Get your personalised advice based on your question, our knowledge base and your specific profile</li>
            <li>• Ask follow-up questions in your own time, anytime whilst you're with the production</li>
          </ul>
        </div>

        {/* Support Information */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Need help? Contact Production Physiotherapy or production</p>
          <p className="mt-1">
            <strong>Seat ID:</strong> <code className="bg-muted px-1 rounded">{result.seat_id}</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};