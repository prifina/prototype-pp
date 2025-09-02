import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertTriangle, Database, Shield, Clock } from 'lucide-react';

export const SystemSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">System Settings</h2>
        <p className="text-muted-foreground">
          Current system configuration and information
        </p>
      </div>

      {/* Security Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Production passcodes are hashed before storage using Supabase Auth. 
          If a passcode is lost, generate a new one through the Productions interface.
        </AlertDescription>
      </Alert>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Current system setup and database information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Database</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Project ID:</span>
                  <span className="font-medium font-mono">fkvtnyvttgjiherassmn</span>
                </div>
                <div className="flex justify-between">
                  <span>Region:</span>
                  <span className="font-medium">US East 1</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-medium">Supabase (PostgreSQL)</span>
                </div>
                <div className="flex justify-between">
                  <span>Row Level Security:</span>
                  <span className="font-medium text-green-600">Enabled</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Application</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>App ID:</span>
                  <span className="font-medium">ai-twin-template</span>
                </div>
                <div className="flex justify-between">
                  <span>Network ID:</span>
                  <span className="font-medium">default</span>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="font-medium">Production</span>
                </div>
                <div className="flex justify-between">
                  <span>CDN:</span>
                  <span className="font-medium">cdn.speak-to.ai</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Authentication
          </CardTitle>
          <CardDescription>
            Current security measures and authentication setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Authentication</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-medium">Supabase Auth</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin Roles:</span>
                  <span className="font-medium text-green-600">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span>Password Hashing:</span>
                  <span className="font-medium">bcrypt (Supabase)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Data Protection</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Row Level Security:</span>
                  <span className="font-medium text-green-600">Active on all tables</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Logging:</span>
                  <span className="font-medium text-green-600">Configured</span>
                </div>
                <div className="flex justify-between">
                  <span>Encryption at Rest:</span>
                  <span className="font-medium">Supabase managed</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Information about data handling and retention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-3">
                <strong>Data Retention:</strong> This application does not implement custom data retention policies. 
                All data is stored according to Supabase's standard data retention and backup policies.
              </p>
              <p className="mb-3">
                <strong>User Data Control:</strong> Users can modify their profile information through the onboarding process. 
                Admins can manage user data through the admin interface with full audit logging.
              </p>
              <p>
                <strong>Compliance:</strong> Data handling follows Supabase's security and compliance standards. 
                For specific compliance requirements, refer to Supabase's documentation and your organization's data policies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};