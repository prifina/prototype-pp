import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Key, Calendar, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const ProductionSettings = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<any>(null);
  const [productions, setProductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    seat_limit: 50,
    start_at: '',
    end_at: '',
    passcode: ''
  });

  useEffect(() => {
    loadProductions();
  }, []);

  const loadProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductions(data || []);
    } catch (error) {
      console.error('Error loading productions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduction = () => {
    console.log('Creating production:', formData);
    setIsCreateDialogOpen(false);
    setFormData({ name: '', seat_limit: 50, start_at: '', end_at: '', passcode: '' });
    // TODO: API call to create production
  };

  const handleEditProduction = (production: any) => {
    setEditingProduction(production);
    setFormData({
      name: production.name,
      seat_limit: production.seat_limit,
      start_at: production.start_at.split('T')[0],
      end_at: production.end_at.split('T')[0],
      passcode: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduction = () => {
    console.log('Updating production:', editingProduction.id, formData);
    setIsEditDialogOpen(false);
    setEditingProduction(null);
    // TODO: API call to update production
  };

  const handleDeleteProduction = (productionId: string) => {
    if (confirm('Are you sure you want to delete this production? This action cannot be undone.')) {
      console.log('Deleting production:', productionId);
      // TODO: API call to delete production
    }
  };

  const generatePasscode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData({ ...formData, passcode: result });
  };

  const getStatusBadge = (production: any) => {
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

  return (
    <div className="space-y-6">
      {/* Create Production Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Productions</h3>
          <p className="text-sm text-muted-foreground">
            Manage productions, passcodes, and access controls
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Production
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Production</DialogTitle>
              <DialogDescription>
                Set up a new production with access controls and seat limits
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-name">Production Name</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter production name"
                />
              </div>
              
              <div>
                <Label htmlFor="create-seat-limit">Seat Limit</Label>
                <Input
                  id="create-seat-limit"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.seat_limit}
                  onChange={(e) => setFormData({ ...formData, seat_limit: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-start">Start Date</Label>
                  <Input
                    id="create-start"
                    type="date"
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="create-end">End Date</Label>
                  <Input
                    id="create-end"
                    type="date"
                    value={formData.end_at}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="create-passcode">Access Passcode</Label>
                <div className="flex space-x-2">
                  <Input
                    id="create-passcode"
                    value={formData.passcode}
                    onChange={(e) => setFormData({ ...formData, passcode: e.target.value.toUpperCase() })}
                    placeholder="Enter or generate passcode"
                    maxLength={12}
                  />
                  <Button type="button" variant="outline" onClick={generatePasscode}>
                    Generate
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProduction} disabled={!formData.name || !formData.passcode}>
                  Create Production
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Productions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Productions</CardTitle>
          <CardDescription>
            Active and scheduled productions with their access controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                      Loading productions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : productions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No productions found. Create your first production to get started.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                productions.map((production) => (
                  <TableRow key={production.id}>
                    <TableCell className="font-medium">
                      {production.name}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(production)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                        0/{production.seat_limit}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(production.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(production.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditProduction(production)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteProduction(production.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Global configuration and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Passcodes are hashed before storage and cannot be recovered. 
              If a passcode is lost, you must generate a new one and update your teams.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Access Control
              </h4>
              <div className="text-sm space-y-2">
                <p><strong>Passcode Attempts:</strong> 3 attempts before 10-minute lockout</p>
                <p><strong>Session Duration:</strong> 24 hours</p>
                <p><strong>Passcode Length:</strong> 6-12 characters</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Data Retention</h4>
              <div className="text-sm space-y-2">
                <p><strong>Message Logs:</strong> 180 days</p>
                <p><strong>Profile Data:</strong> 12 months post-expiry</p>
                <p><strong>Audit Logs:</strong> 24 months</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Production Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Production</DialogTitle>
            <DialogDescription>
              Update production settings and access controls
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Production Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-seat-limit">Seat Limit</Label>
              <Input
                id="edit-seat-limit"
                type="number"
                min="1"
                max="500"
                value={formData.seat_limit}
                onChange={(e) => setFormData({ ...formData, seat_limit: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start">Start Date</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-end">End Date</Label>
                <Input
                  id="edit-end"
                  type="date"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-passcode">New Passcode (leave empty to keep current)</Label>
              <div className="flex space-x-2">
                <Input
                  id="edit-passcode"
                  value={formData.passcode}
                  onChange={(e) => setFormData({ ...formData, passcode: e.target.value.toUpperCase() })}
                  placeholder="Enter new passcode or leave empty"
                  maxLength={12}
                />
                <Button type="button" variant="outline" onClick={generatePasscode}>
                  Generate
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProduction}>
                Update Production
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};