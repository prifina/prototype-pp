import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatManagement } from '@/components/admin/SeatManagement';
import { ProfileManagement } from '@/components/admin/ProfileManagement';
import { Analytics } from '@/components/admin/Analytics';
import { ProductionSettings } from '@/components/admin/ProductionSettings';

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

        <Tabs defaultValue="seats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="seats">Seat Management</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

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