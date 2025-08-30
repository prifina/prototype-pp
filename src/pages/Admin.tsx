import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, BarChart3, Theater, TestTube } from 'lucide-react';
import { ProductionList } from '@/components/admin/ProductionList';
import { ProductionDetail } from '@/components/admin/ProductionDetail';
import { Analytics } from '@/components/admin/Analytics';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { TestWhatsAppButton } from '@/components/TestWhatsAppButton';

export const Admin = () => {
  const [selectedProduction, setSelectedProduction] = useState<string>('');
  const [currentView, setCurrentView] = useState<'main' | 'production-detail'>('main');

  const handleSelectProduction = (productionId: string) => {
    setSelectedProduction(productionId);
    setCurrentView('production-detail');
  };

  const handleBackToProductions = () => {
    setCurrentView('main');
    setSelectedProduction('');
  };

  if (currentView === 'production-detail' && selectedProduction) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <ProductionDetail 
            productionId={selectedProduction}
            onBack={handleBackToProductions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Manage productions, seats, and view analytics for your AI Performance Assistant
          </p>
        </div>

        <Tabs defaultValue="productions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="productions" className="flex items-center gap-2">
              <Theater className="h-4 w-4" />
              Productions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="productions" className="space-y-6">
            <ProductionList onSelectProduction={handleSelectProduction} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Global Analytics</h3>
              <p className="text-muted-foreground">Aggregate usage and engagement metrics across all productions</p>
            </div>
            <Analytics />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">WhatsApp Pipeline Diagnostics</h3>
              <p className="text-muted-foreground">Test and debug the WhatsApp AI Twin integration</p>
            </div>
            <TestWhatsAppButton />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};