import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, BarChart3, Settings as SettingsIcon, Package, Upload, FileText, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SeatManagement } from './SeatManagement';
import { ProfileManagement } from './ProfileManagement';
import { Analytics } from './Analytics';
import { QRPackGenerator } from './QRPackGenerator';
import { CSVImport } from './CSVImport';
import { AuditLog } from './AuditLog';
import { showApi } from '@/services/showApi';
import { Show } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface ProductionDetailProps {
  productionId: string;
  onBack: () => void;
}

export const ProductionDetail = ({ productionId, onBack }: ProductionDetailProps) => {
  const [production, setProduction] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('seats');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProduction();
  }, [productionId]);

  const loadProduction = async () => {
    try {
      setIsLoading(true);
      const show = await showApi.getShow(productionId);
      setProduction(show);
    } catch (error) {
      console.error('Failed to load production:', error);
      toast({
        title: "Error",
        description: "Failed to load production details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProductionStatus = (production: Show) => {
    if (!production.start_at || !production.end_at) {
      return <Badge variant="secondary">Active</Badge>;
    }
    
    const now = new Date();
    const start = new Date(production.start_at);
    const end = new Date(production.end_at);
    
    if (now < start) {
      return <Badge variant="secondary">Upcoming</Badge>;
    } else if (now > end) {
      return <Badge variant="outline">Ended</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  const copyPasscode = async () => {
    if (!production?.passcode_hash) return;
    
    try {
      await navigator.clipboard.writeText(production.passcode_hash);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Registration passcode copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy passcode to clipboard",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading production...</div>
      </div>
    );
  }

  if (!production) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Production Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The requested production could not be found.
        </p>
        <Button onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Productions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Productions
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-foreground">{production.show_name}</h2>
              {getProductionStatus(production)}
            </div>
            <p className="text-muted-foreground">{production.production_house_name}</p>
          </div>
        </div>
      </div>

      {/* Registration Passcode */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Access</CardTitle>
          <CardDescription>
            Participants use this passcode to register for the production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex flex-col">
              <div className="text-sm text-muted-foreground mb-1">Registration Passcode</div>
              <div className="text-2xl font-mono font-bold tracking-wider">
                {production.passcode_hash}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyPasscode}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Production Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Production Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Active Seats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{production.seat_limit}</div>
              <div className="text-sm text-muted-foreground">Total Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{production.default_seat_duration_days}</div>
              <div className="text-sm text-muted-foreground">Days Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0%</div>
              <div className="text-sm text-muted-foreground">Utilization</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            QR Packs
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seat Management</CardTitle>
              <CardDescription>
                Manage seats and access for {production.show_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SeatManagement 
                selectedProduction={productionId}
                onProductionChange={() => {}} // Not needed in this context
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Management</CardTitle>
              <CardDescription>
                View and edit user profiles for {production.show_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Analytics for {production.show_name}</h3>
            <p className="text-muted-foreground">Production-specific usage and engagement metrics</p>
          </div>
          <Analytics />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Import</CardTitle>
              <CardDescription>
                Bulk import user profiles and seat data for {production.show_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CSVImport 
                showId={productionId}
                showName={production.show_name}
                onImportComplete={() => {
                  // Refresh data after import
                  loadProduction();
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Pack Generator</CardTitle>
              <CardDescription>
                Generate QR code packages for {production.show_name} seat distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRPackGenerator 
                seats={[]} // This will need to be populated with actual seat data
                showName={production.show_name}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                View audit trail for {production.show_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLog showId={productionId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};