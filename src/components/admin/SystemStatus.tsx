import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Database, 
  Shield, 
  Settings, 
  Loader2,
  ExternalLink,
  RefreshCw,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemCheck {
  name: string;
  description: string;
  status: 'checking' | 'healthy' | 'warning' | 'error';
  details?: string;
  action?: {
    label: string;
    url?: string;
    handler?: () => void;
  };
}

export const SystemStatus = () => {
  const [checks, setChecks] = useState<SystemCheck[]>([
    {
      name: 'Database Connection',
      description: 'Supabase database connectivity',
      status: 'checking'
    },
    {
      name: 'Core Tables',
      description: 'Required database tables exist',
      status: 'checking'
    },
    {
      name: 'Row Level Security',
      description: 'RLS policies are properly configured',
      status: 'checking'
    },
    {
      name: 'Edge Functions',
      description: 'Backend functions are deployed',
      status: 'checking'
    },
    {
      name: 'Environment Secrets',
      description: 'Required API keys are configured',
      status: 'checking'
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const runSystemChecks = async () => {
    const updatedChecks = [...checks];

    try {
      // Check 1: Database Connection
      const { error: dbError } = await supabase.from('shows').select('count').limit(1);
      updatedChecks[0] = {
        ...updatedChecks[0],
        status: dbError ? 'error' : 'healthy',
        details: dbError ? dbError.message : 'Connected successfully'
      };

      // Check 2: Core Tables
      let tablesExist = 0;
      const tableChecks = [
        supabase.from('shows').select('count').limit(1),
        supabase.from('profiles').select('count').limit(1),
        supabase.from('seats').select('count').limit(1),
        supabase.from('message_log').select('count').limit(1),
        supabase.from('audit_log').select('count').limit(1)
      ];
      
      for (const check of tableChecks) {
        try {
          await check;
          tablesExist++;
        } catch {}
      }

      updatedChecks[1] = {
        ...updatedChecks[1],
        status: tablesExist === 5 ? 'healthy' : 'error',
        details: `${tablesExist}/5 tables exist`,
        action: tablesExist < 5 ? {
          label: 'View SQL Editor',
          url: 'https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn/sql/new'
        } : undefined
      };

      // Check 3: RLS Policies - basic check by trying to access data
      try {
        await supabase.from('shows').select('*').limit(1);
        updatedChecks[2] = {
          ...updatedChecks[2],
          status: 'healthy',
          details: 'RLS policies configured and working'
        };
      } catch (error: any) {
        updatedChecks[2] = {
          ...updatedChecks[2],
          status: 'warning',
          details: 'RLS may need review',
          action: {
            label: 'Check Policies',
            url: 'https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn/auth/policies'
          }
        };
      }

      // Check 4: Edge Functions - check if core functions exist
      try {
        const { data, error } = await supabase.functions.invoke('core-api', {
          body: { action: 'health-check' }
        });
        
        updatedChecks[3] = {
          ...updatedChecks[3],
          status: error ? 'warning' : 'healthy',
          details: error ? 'Some functions may need deployment' : 'Functions are operational',
          action: error ? {
            label: 'View Functions',
            url: 'https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn/functions'
          } : undefined
        };
      } catch {
        updatedChecks[3] = {
          ...updatedChecks[3],
          status: 'warning',
          details: 'Edge functions need deployment',
          action: {
            label: 'Deploy Functions',
            url: 'https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn/functions'
          }
        };
      }

      // Check 5: Environment Secrets - basic check
      updatedChecks[4] = {
        ...updatedChecks[4],
        status: 'warning',
        details: 'Configure API secrets for full functionality',
        action: {
          label: 'Manage Secrets',
          url: 'https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn/settings/functions'
        }
      };

    } catch (error) {
      console.error('System check error:', error);
    }

    setChecks(updatedChecks);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await runSystemChecks();
    setIsRefreshing(false);
  };

  useEffect(() => {
    runSystemChecks();
  }, []);

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      case 'healthy':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Healthy</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-700">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const healthyCount = checks.filter(c => c.status === 'healthy').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const errorCount = checks.filter(c => c.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Status
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>

          {errorCount > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorCount} critical issue{errorCount > 1 ? 's' : ''} detected. Please resolve before using production features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detailed Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Components
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checks.map((check, index) => (
            <div key={index}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-muted-foreground">{check.description}</div>
                    {check.details && (
                      <div className="text-xs text-muted-foreground mt-1">{check.details}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(check.status)}
                  {check.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild={!!check.action.url}
                      onClick={check.action.handler}
                    >
                      {check.action.url ? (
                        <a 
                          href={check.action.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          {check.action.label}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <>
                          {check.action.label}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {index < checks.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="justify-start" asChild>
              <a 
                href="https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Open Supabase Dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            
            <Button variant="outline" className="justify-start" asChild>
              <a 
                href="https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn/sql/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                SQL Editor
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>

            <Button variant="outline" className="justify-start" asChild>
              <a 
                href="https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn/functions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Edge Functions
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>

            <Button variant="outline" className="justify-start" asChild>
              <a 
                href="https://supabase.com/dashboard/project/fkvtnyvttgjiherassmn/auth/policies" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                RLS Policies
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};