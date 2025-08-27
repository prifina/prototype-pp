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
          Global configuration and security settings for the AI Performance Assistant
        </p>
      </div>

      {/* Security Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Passcodes are hashed before storage and cannot be recovered. 
          If a passcode is lost, you must generate a new one and update your teams.
        </AlertDescription>
      </Alert>

      {/* Access Control Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Access Control
          </CardTitle>
          <CardDescription>
            Authentication and authorization settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Authentication Settings</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Passcode Attempts:</span>
                  <span className="font-medium">3 attempts</span>
                </div>
                <div className="flex justify-between">
                  <span>Lockout Duration:</span>
                  <span className="font-medium">10 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Session Duration:</span>
                  <span className="font-medium">24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Passcode Length:</span>
                  <span className="font-medium">6-12 characters</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Security Features</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Rate Limiting:</span>
                  <span className="font-medium">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span>IP Tracking:</span>
                  <span className="font-medium">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span>Audit Logging:</span>
                  <span className="font-medium">Full</span>
                </div>
                <div className="flex justify-between">
                  <span>Encryption:</span>
                  <span className="font-medium">AES-256</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Data Retention
          </CardTitle>
          <CardDescription>
            How long different types of data are stored in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">User Data</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Profile Data:</span>
                  <span className="font-medium">12 months post-expiry</span>
                </div>
                <div className="flex justify-between">
                  <span>Chat Messages:</span>
                  <span className="font-medium">180 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Health Context:</span>
                  <span className="font-medium">12 months post-expiry</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact Information:</span>
                  <span className="font-medium">12 months post-expiry</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">System Data</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Audit Logs:</span>
                  <span className="font-medium">24 months</span>
                </div>
                <div className="flex justify-between">
                  <span>Analytics Data:</span>
                  <span className="font-medium">12 months</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Logs:</span>
                  <span className="font-medium">90 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance Metrics:</span>
                  <span className="font-medium">6 months</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Configuration
          </CardTitle>
          <CardDescription>
            Database connection and performance settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Connection Settings</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Connection Pool:</span>
                  <span className="font-medium">20 connections</span>
                </div>
                <div className="flex justify-between">
                  <span>Query Timeout:</span>
                  <span className="font-medium">30 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>Backup Frequency:</span>
                  <span className="font-medium">Daily at 2 AM</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Performance</h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Query Cache:</span>
                  <span className="font-medium">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span>Index Optimization:</span>
                  <span className="font-medium">Weekly</span>
                </div>
                <div className="flex justify-between">
                  <span>Compression:</span>
                  <span className="font-medium">GZIP</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Compliance
          </CardTitle>
          <CardDescription>
            Data protection and regulatory compliance settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">GDPR Compliant</h4>
                <p className="text-sm text-muted-foreground">
                  Data processing follows EU General Data Protection Regulation guidelines
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">HIPAA Ready</h4>
                <p className="text-sm text-muted-foreground">
                  Health information handling meets HIPAA security requirements
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">SOC 2 Type II</h4>
                <p className="text-sm text-muted-foreground">
                  Infrastructure meets SOC 2 security and availability standards
                </p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Data Processing:</strong> All personal data is processed in accordance with 
                applicable privacy laws. Users maintain full control over their data and can request 
                deletion at any time through the support portal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};