import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, MoreHorizontal, QrCode, Link, Ban, RotateCcw, Upload, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CSVImport } from './CSVImport';
import { QRPackGenerator } from './QRPackGenerator';
import { AuditLog } from './AuditLog';
import { seatApi } from '@/services/seatApi';
import { showApi } from '@/services/showApi';
import { Seat, Show, SeatStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneForDisplay } from '@/utils/phoneNormalization';

interface SeatManagementProps {
  selectedProduction: string;
  onProductionChange: (productionId: string) => void;
}

export const SeatManagement: React.FC<SeatManagementProps> = ({
  selectedProduction,
  onProductionChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('seats');
  const { toast } = useToast();

  // Load shows and seats
  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    if (selectedProduction) {
      loadSeats();
      loadCurrentShow();
    }
  }, [selectedProduction, statusFilter, searchQuery]);

  const loadShows = async () => {
    try {
      const showsList = await showApi.listShows();
      setShows(showsList);
    } catch (error) {
      toast({
        title: 'Failed to Load Shows',
        description: 'Could not load the list of shows.',
        variant: 'destructive',
      });
    }
  };

  const loadCurrentShow = async () => {
    if (!selectedProduction) return;
    
    try {
      const show = await showApi.getShow(selectedProduction);
      setCurrentShow(show);
    } catch (error) {
      console.error('Failed to load show:', error);
    }
  };

  const loadSeats = async () => {
    if (!selectedProduction) return;
    
    setIsLoading(true);
    try {
      const seatsData = await seatApi.getSeats(selectedProduction, {
        status: statusFilter === 'all' ? undefined : statusFilter as SeatStatus,
        search: searchQuery || undefined
      });
      setSeats(seatsData);
    } catch (error) {
      toast({
        title: 'Failed to Load Seats',
        description: 'Could not load seats for the selected show.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportComplete = () => {
    loadSeats(); // Refresh seats after import
    toast({
      title: 'Import Complete',
      description: 'Seats have been imported successfully.',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      pending: 'secondary',
      expired: 'destructive',
      revoked: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleSeatAction = async (action: string, seatId: string) => {
    try {
      switch (action) {
        case 'qr':
          // TODO: Show QR code dialog
          break;
        case 'link':
          // TODO: Copy WhatsApp link
          break;
        case 'revoke':
          await seatApi.updateSeatStatus(seatId, 'revoked');
          loadSeats();
          toast({
            title: 'Seat Revoked',
            description: 'The seat has been revoked successfully.',
          });
          break;
        default:
          console.log(`${action} seat ${seatId}`);
      }
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: 'Failed to perform the requested action.',
        variant: 'destructive',
      });
    }
  };

  // Calculate statistics
  const stats = {
    total: seats.length,
    active: seats.filter(s => s.status === 'active').length,
    pending: seats.filter(s => s.status === 'pending').length,
    expired: seats.filter(s => s.status === 'expired').length,
  };

  if (!selectedProduction) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">Select a Show</h3>
          <p className="text-muted-foreground">Choose a show from the dropdown above to manage seats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show Selector & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="min-w-[200px]">
            <Label htmlFor="production-select">Show</Label>
            <Select value={selectedProduction} onValueChange={onProductionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select show" />
              </SelectTrigger>
              <SelectContent>
                {shows.map((show) => (
                  <SelectItem key={show.id} value={show.id}>
                    {show.show_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search seats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {currentShow?.show_name || 'Current show'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% utilization
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting binding</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Access ended</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="seats" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Seats ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            CSV Import
          </TabsTrigger>
          <TabsTrigger value="qr-pack" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Pack
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seats</CardTitle>
              <CardDescription>
                Manage and monitor seat assignments for {currentShow?.show_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Loading seats...</div>
                </div>
              ) : seats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 space-y-2">
                  <div className="text-muted-foreground">No seats found</div>
                  <p className="text-sm text-muted-foreground">
                    {statusFilter === 'all' 
                      ? 'Import seats using the CSV Import tab'
                      : `No seats with status: ${statusFilter}`}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seat Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seats.map((seat) => (
                      <TableRow key={seat.id}>
                        <TableCell className="font-mono text-sm">
                          {seat.seat_code}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(seat.status)}
                        </TableCell>
                        <TableCell>
                          {seat.phone_e164 ? (
                            <div>
                              <div className="font-mono text-sm">{formatPhoneForDisplay(seat.phone_e164)}</div>
                              {seat.phone_original_input !== seat.phone_e164 && (
                                <div className="text-xs text-muted-foreground">
                                  Original: {seat.phone_original_input}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(seat.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {seat.expires_at 
                            ? new Date(seat.expires_at).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {seat.license_batch_id ? seat.license_batch_id.slice(0, 8) + '...' : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSeatAction('qr', seat.id)}>
                                <QrCode className="w-4 h-4 mr-2" />
                                View QR Code
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSeatAction('link', seat.id)}>
                                <Link className="w-4 h-4 mr-2" />
                                Copy WhatsApp Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSeatAction('resend', seat.id)}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Regenerate QR
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSeatAction('revoke', seat.id)}
                                className="text-destructive"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Revoke Seat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <CSVImport 
            showId={selectedProduction}
            showName={currentShow?.show_name || 'Unknown Show'}
            onImportComplete={handleImportComplete}
          />
        </TabsContent>

        <TabsContent value="qr-pack" className="space-y-4">
          <QRPackGenerator 
            seats={seats}
            showName={currentShow?.show_name || 'Unknown Show'}
          />
        </TabsContent>

        <TabsContent value="audit-log" className="space-y-4">
          <AuditLog showId={selectedProduction} />
        </TabsContent>
      </Tabs>
    </div>
  );
};