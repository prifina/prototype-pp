import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, MoreHorizontal, QrCode, Link, Ban, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SeatManagementProps {
  selectedProduction: string;
  onProductionChange: (productionId: string) => void;
}

// Mock data - replace with actual API calls
const mockSeats = [
  {
    id: '1',
    seat_code: 'SC-DEMO-ABC12345-X',
    status: 'active' as const,
    profile_name: 'John Doe',
    role: 'Lead Actor',
    phone_e164: '+1234567890',
    created_at: '2024-01-15T10:00:00Z',
    last_active: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    seat_code: 'SC-DEMO-DEF67890-Y',
    status: 'pending' as const,
    profile_name: null,
    role: null,
    phone_e164: null,
    created_at: '2024-01-16T09:00:00Z',
    last_active: null
  }
];

const mockProductions = [
  { id: 'demo-1', name: 'Demo Production' },
  { id: 'phantom-2024', name: 'Phantom of the Opera 2024' }
];

export const SeatManagement: React.FC<SeatManagementProps> = ({
  selectedProduction,
  onProductionChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const handleSeatAction = (action: string, seatId: string) => {
    console.log(`${action} seat ${seatId}`);
    // TODO: Implement actual API calls
  };

  return (
    <div className="space-y-6">
      {/* Production Selector & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="min-w-[200px]">
            <Label htmlFor="production-select">Production</Label>
            <Select value={selectedProduction} onValueChange={onProductionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select production" />
              </SelectTrigger>
              <SelectContent>
                {mockProductions.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id}>
                    {prod.name}
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

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Seats
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Seats</DialogTitle>
              <DialogDescription>
                Generate new seats for the selected production
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="seat-count">Number of Seats</Label>
                <Input
                  id="seat-count"
                  type="number"
                  min="1"
                  max="50"
                  defaultValue="1"
                  placeholder="How many seats to create"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create Seats
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">18</div>
            <p className="text-xs text-muted-foreground">75% utilization</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">4</div>
            <p className="text-xs text-muted-foreground">Awaiting binding</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">First Chat Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground">+5% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Seats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Seats</CardTitle>
          <CardDescription>
            Manage and monitor seat assignments for the selected production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seat Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSeats.map((seat) => (
                <TableRow key={seat.id}>
                  <TableCell className="font-mono text-sm">
                    {seat.seat_code}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(seat.status)}
                  </TableCell>
                  <TableCell>
                    {seat.profile_name || (
                      <span className="text-muted-foreground italic">No profile</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {seat.role || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {seat.phone_e164 || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(seat.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {seat.last_active 
                      ? new Date(seat.last_active).toLocaleDateString()
                      : 'Never'
                    }
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
                          Resend QR/Link
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
        </CardContent>
      </Card>
    </div>
  );
};