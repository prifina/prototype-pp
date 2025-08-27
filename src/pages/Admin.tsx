import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Settings, Users, BarChart3, FileText, Package, Upload } from 'lucide-react';
import { SeatManagement } from '@/components/admin/SeatManagement';
import { ProfileManagement } from '@/components/admin/ProfileManagement';
import { Analytics } from '@/components/admin/Analytics';
import { ProductionSettings } from '@/components/admin/ProductionSettings';
import { AuditLog } from '@/components/admin/AuditLog';
import { QRPackGenerator } from '@/components/admin/QRPackGenerator';
import { CSVImport } from '@/components/admin/CSVImport';
import DatabaseSetupGuide from '@/components/admin/DatabaseSetupGuide';

export const Admin = () => {
  const [selectedProduction, setSelectedProduction] = useState<string>('');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Console
          </h1>
          <p className="text-muted-foreground">
            Manage productions, seats, and view analytics for your AI Twin system
          </p>
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="seats" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Seats
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              QR Packs
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            <DatabaseSetupGuide />
          </TabsContent>

          <TabsContent value="seats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seat Management</CardTitle>
                <CardDescription>
                  Create, assign, revoke, and manage seats for productions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SeatManagement 
                  selectedProduction={selectedProduction}
                  onProductionChange={setSelectedProduction}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Management</CardTitle>
                <CardDescription>
                  Edit user profiles and view admin notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Analytics />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  View system events and administrative actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLog showId={selectedProduction} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Pack Generator</CardTitle>
                <CardDescription>
                  Generate QR code packages for seat distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QRPackGenerator 
                  seats={[]}
                  showName={selectedProduction || 'Select a production'}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>CSV Import</CardTitle>
                <CardDescription>
                  Bulk import user profiles and seat data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSVImport 
                  showId={selectedProduction}
                  showName={selectedProduction || 'Select a production'}
                  onImportComplete={() => {
                    // Refresh data after import
                    window.location.reload();
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Settings</CardTitle>
                <CardDescription>
                  Configure productions, passcodes, and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductionSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};