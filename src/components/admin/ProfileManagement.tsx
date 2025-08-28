import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

export const ProfileManagement = () => {
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newNote, setNewNote] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
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
                {loading ? (
                  <SelectItem value="loading" disabled>Loading profiles...</SelectItem>
                ) : profiles.length === 0 ? (
                  <SelectItem value="no-profiles" disabled>No profiles found</SelectItem>
                ) : (
                  profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.first_name} {profile.last_name} - {profile.email}
                    </SelectItem>
                  ))
                )}
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
            {loading ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading profile...</p>
                </CardContent>
              </Card>
            ) : profiles.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No profiles found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Profiles will appear here once users complete onboarding
                  </p>
                </CardContent>
              </Card>
            ) : (
              profiles
                .filter(profile => profile.id === selectedProfile)
                .map(profile => (
                  <Card key={profile.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                          <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                          <p className="font-medium">{profile.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                          <p className="font-medium">{profile.phone_number}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                          <p className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
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
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No admin notes yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add the first note using the button above
                  </p>
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