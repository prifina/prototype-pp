import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Theater, Users, Calendar, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { showApi } from '@/services/showApi';
import { Show } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface ProductionListProps {
  onSelectProduction: (productionId: string) => void;
}

export const ProductionList = ({ onSelectProduction }: ProductionListProps) => {
  const [productions, setProductions] = useState<Show[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    show_name: '',
    production_house_name: '',
    passcode: '',
    seat_limit: 50,
    default_seat_duration_days: 90,
    start_at: '',
    end_at: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProductions();
  }, []);

  const loadProductions = async () => {
    try {
      setIsLoading(true);
      const shows = await showApi.listShows();
      setProductions(shows);
    } catch (error) {
      console.error('Failed to load productions:', error);
      toast({
        title: "Error",
        description: "Failed to load productions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduction = async () => {
    try {
      const newShow = await showApi.createShow({
        show_name: formData.show_name,
        production_house_name: formData.production_house_name,
        passcode_hash: formData.passcode, // Will be hashed by the API
        seat_limit: formData.seat_limit,
        default_seat_duration_days: formData.default_seat_duration_days,
        status: 'active' as const,
        start_at: formData.start_at || new Date().toISOString(),
        end_at: formData.end_at ? new Date(formData.end_at).toISOString() : undefined
      });
      
      setProductions([...productions, newShow]);
      setIsCreateDialogOpen(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Production created successfully"
      });
    } catch (error) {
      console.error('Failed to create production:', error);
      toast({
        title: "Error",
        description: "Failed to create production",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      show_name: '',
      production_house_name: '',
      passcode: '',
      seat_limit: 50,
      default_seat_duration_days: 90,
      start_at: '',
      end_at: ''
    });
  };

  const generatePasscode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData({ ...formData, passcode: result });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading productions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Productions</h2>
          <p className="text-muted-foreground">
            Manage your AI Performance Assistant productions and access controls
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Production
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Production</DialogTitle>
              <DialogDescription>
                Set up a new production with access controls and seat limits
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="show-name">Production Name</Label>
                <Input
                  id="show-name"
                  value={formData.show_name}
                  onChange={(e) => setFormData({ ...formData, show_name: e.target.value })}
                  placeholder="e.g., The Lion King"
                />
              </div>
              
              <div>
                <Label htmlFor="production-house">Production House</Label>
                <Input
                  id="production-house"
                  value={formData.production_house_name}
                  onChange={(e) => setFormData({ ...formData, production_house_name: e.target.value })}
                  placeholder="e.g., Disney Theatrical Group"
                />
              </div>
              
              <div>
                <Label htmlFor="seat-limit">Seat Limit</Label>
                <Input
                  id="seat-limit"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.seat_limit}
                  onChange={(e) => setFormData({ ...formData, seat_limit: parseInt(e.target.value) || 50 })}
                />
              </div>
              
              <div>
                <Label htmlFor="duration">Default Seat Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="30"
                  max="365"
                  value={formData.default_seat_duration_days}
                  onChange={(e) => setFormData({ ...formData, default_seat_duration_days: parseInt(e.target.value) || 90 })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date (optional)</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.start_at}
                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date (optional)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.end_at}
                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="passcode">Access Passcode</Label>
                <div className="flex space-x-2">
                  <Input
                    id="passcode"
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
                <Button 
                  onClick={handleCreateProduction} 
                  disabled={!formData.show_name || !formData.production_house_name || !formData.passcode}
                >
                  Create Production
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Productions Grid */}
      {productions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Theater className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Productions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first production to start managing AI Performance Assistant access
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Production
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productions.map((production) => (
            <Card 
              key={production.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectProduction(production.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{production.show_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {production.production_house_name}
                    </CardDescription>
                  </div>
                  {getProductionStatus(production)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      Seats
                    </div>
                    <span className="font-medium">0/{production.seat_limit}</span>
                  </div>
                  
                  {production.start_at && production.end_at && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="truncate">
                        {new Date(production.start_at).toLocaleDateString()} - {new Date(production.end_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="text-sm font-medium">{production.default_seat_duration_days} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};