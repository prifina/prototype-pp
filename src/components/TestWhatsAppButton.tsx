import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testWhatsAppPipeline } from '@/utils/testPipeline';
import { Loader2, TestTube } from 'lucide-react';

export const TestWhatsAppButton = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      const testResults = await testWhatsAppPipeline();
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
      setResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          WhatsApp Pipeline Diagnostic
        </CardTitle>
        <CardDescription>
          Test the entire WhatsApp AI Twin pipeline to identify issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing Pipeline...
            </>
          ) : (
            'Run Pipeline Test'
          )}
        </Button>
        
        {results && (
          <div className="space-y-4">
            <h3 className="font-semibold">Test Results:</h3>
            
            {results.error ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">Error: {results.error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <TestResult 
                  name="Simple Function Test"
                  result={results.simpleTest}
                />
                <TestResult 
                  name="Webhook Direct Test"
                  result={results.webhookTest}
                />
                <TestResult 
                  name="AI Twin Chat Test"
                  result={results.aiTest}
                />
                <TestResult 
                  name="WhatsApp Send Test"
                  result={results.whatsappTest}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TestResult = ({ name, result }: { name: string; result: any }) => {
  const hasError = result.error;
  const hasData = result.data;
  
  return (
    <div className={`p-3 border rounded-lg ${
      hasError ? 'bg-destructive/10 border-destructive/20' : 
      hasData ? 'bg-green-50 border-green-200' : 
      'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{name}</span>
        <span className={`text-sm px-2 py-1 rounded ${
          hasError ? 'bg-destructive text-destructive-foreground' :
          hasData ? 'bg-green-600 text-white' :
          'bg-yellow-600 text-white'
        }`}>
          {hasError ? 'FAILED' : hasData ? 'PASSED' : 'NO RESPONSE'}
        </span>
      </div>
      
      {hasError && (
        <p className="text-sm text-destructive mt-2">
          {result.error.message || result.error}
        </p>
      )}
      
      {hasData && typeof result.data === 'object' && (
        <details className="mt-2">
          <summary className="text-sm cursor-pointer">Show Response</summary>
          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};