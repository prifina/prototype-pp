import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Edit, MessageSquare, Save, AlertCircle } from 'lucide-react';

// Mock data
const mockProfiles = [
  {
    id: '1',
    seat_id: 'seat-1',
    name: 'John Doe',
    role: 'Lead Actor',
    show_name: 'Phantom of the Opera',
    tour_or_resident: 'tour' as const,
    goals: 'Improve sleep quality during tour',
    injuries_notes: 'Previous ankle sprain in 2023',
    sleep_env: { environment: 'hotel', noise_level: 'moderate', light_control: 'limited' },
    food_constraints: { allergies: ['nuts'], intolerances: ['lactose'], dietary_preferences: ['vegetarian'] },
    created_at: '2024-01-15T10:00:00Z',
    last_active: '2024-01-20T14:30:00Z'
  }
];

const mockAdminNotes = [
  {
    id: '1',
    seat_id: 'seat-1',
    note: 'User mentioned recurring back pain during last chat. Recommended stretching routine.',
    created_by: 'admin@production.com',
    created_at: '2024-01-18T09:15:00Z'
  }
];

export const ProfileManagement = () => {
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newNote, setNewNote] = useState('');

  const handleEditProfile = (profileId: string) => {
    const profile = mockProfiles.find(p => p.id === profileId);
    if (profile) {
      setEditData(profile);
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveProfile = () => {
    console.log('Saving profile:', editData);
    setIsEditDialogOpen(false);
    // TODO: API call to save profile
  };

  const handleAddNote = () => {
    console.log('Adding note:', newNote);
    setNewNote('');
    setIsNoteDialogOpen(false);
    // TODO: API call to add note
  };

  const formatConstraints = (constraints: any) => {
    if (!constraints) return 'None specified';
    
    const parts = [];
    if (constraints.allergies?.length) parts.push(`Allergies: ${constraints.allergies.join(', ')}`);
    if (constraints.intolerances?.length) parts.push(`Intolerances: ${constraints.intolerances.join(', ')}`);
    if (constraints.dietary_preferences?.length) parts.push(`Preferences: ${constraints.dietary_preferences.join(', ')}`);
    
    return parts.length ? parts.join(' | ') : 'None specified';
  };

  return (
    <div className="space-y-6">
      {/* Profile Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="min-w-[250px]">
            <Label htmlFor="profile-select">Select Profile</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a profile to manage" />
              </SelectTrigger>
              <SelectContent>
                {mockProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name} - {profile.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProfile && (
          <div className="flex space-x-2">
            <Button onClick={() => handleEditProfile(selectedProfile)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Admin Note</DialogTitle>
                  <DialogDescription>
                    Add a note about this user for other administrators
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note..."
                    rows={4}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                      Add Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {selectedProfile ? (
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="notes">Admin Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            {mockProfiles
              .filter(profile => profile.id === selectedProfile)
              .map(profile => (
                <div key={profile.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                          <p className="font-medium">{profile.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                          <p className="font-medium">{profile.role}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Show</Label>
                          <p className="font-medium">{profile.show_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                          <Badge variant={profile.tour_or_resident === 'tour' ? 'default' : 'secondary'}>
                            {profile.tour_or_resident === 'tour' ? 'Touring' : 'Resident'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Goals</Label>
                        <p className="text-sm mt-1">{profile.goals}</p>
                      </div>
                      
                      {profile.injuries_notes && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Injury Notes
                          </Label>
                          <p className="text-sm mt-1 text-amber-700">{profile.injuries_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Health Context */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Health Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Sleep Environment</Label>
                        <div className="text-sm mt-1">
                          <p><strong>Location:</strong> {profile.sleep_env?.environment}</p>
                          <p><strong>Noise:</strong> {profile.sleep_env?.noise_level}</p>
                          <p><strong>Light Control:</strong> {profile.sleep_env?.light_control}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Food Constraints</Label>
                        <p className="text-sm mt-1">{formatConstraints(profile.food_constraints)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Summary */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Activity Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">127</div>
                          <p className="text-sm text-muted-foreground">Total Messages</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">18</div>
                          <p className="text-sm text-muted-foreground">Active Days</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">34</div>
                          <p className="text-sm text-muted-foreground">Sleep Guidance</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">23</div>
                          <p className="text-sm text-muted-foreground">Nutrition Help</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Administrator Notes</CardTitle>
                <CardDescription>
                  Internal notes and observations about this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAdminNotes.map((note) => (
                    <div key={note.id} className="border-l-4 border-primary pl-4 py-2">
                      <p className="text-sm">{note.note}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>By: {note.created_by}</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  {mockAdminNotes.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No admin notes yet. Add the first note using the button above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Select a profile to view and manage details</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update the editable fields for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={editData.role || ''}
                  onChange={(e) => setEditData({...editData, role: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-goals">Goals</Label>
              <Textarea
                id="edit-goals"
                value={editData.goals || ''}
                onChange={(e) => setEditData({...editData, goals: e.target.value})}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-injuries">Injury Notes</Label>
              <Textarea
                id="edit-injuries"
                value={editData.injuries_notes || ''}
                onChange={(e) => setEditData({...editData, injuries_notes: e.target.value})}
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};