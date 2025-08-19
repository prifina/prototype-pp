import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { OnboardingFormData } from '@/types/database';

interface OnboardingFormProps {
  productionName: string;
  onSubmit: (data: OnboardingFormData) => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ 
  productionName, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({
    allergies: [],
    intolerances: [],
    dietary_preferences: []
  });
  
  const [newAllergy, setNewAllergy] = useState('');
  const [newIntolerance, setNewIntolerance] = useState('');
  const [newDietaryPref, setNewDietaryPref] = useState('');

  const handleInputChange = (field: keyof OnboardingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: 'allergies' | 'intolerances' | 'dietary_preferences', value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      const currentArray = formData[field] || [];
      handleInputChange(field, [...currentArray, value.trim()]);
      setValue('');
    }
  };

  const removeFromArray = (field: 'allergies' | 'intolerances' | 'dietary_preferences', index: number) => {
    const currentArray = formData[field] || [];
    handleInputChange(field, currentArray.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFields = ['name', 'role', 'show_name', 'tour_or_resident'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof OnboardingFormData]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    onSubmit(formData as OnboardingFormData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tell Us About Yourself</CardTitle>
        <CardDescription>
          Help us personalize your AI physio experience for {productionName}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">About You</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  value={formData.role || ''}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  placeholder="e.g., Lead Actor, Dancer, Musician"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="show_name">Show Name *</Label>
                <Input
                  id="show_name"
                  value={formData.show_name || ''}
                  onChange={(e) => handleInputChange('show_name', e.target.value)}
                  placeholder="Name of your show/production"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tour_or_resident">Performance Type *</Label>
                <Select onValueChange={(value) => handleInputChange('tour_or_resident', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tour">Touring Production</SelectItem>
                    <SelectItem value="resident">Resident Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sleep Environment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Sleep Environment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primary Sleep Location</Label>
                <Select onValueChange={(value) => handleInputChange('sleep_environment', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Noise Level</Label>
                <Select onValueChange={(value) => handleInputChange('noise_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiet">Quiet</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="noisy">Noisy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Light Control</Label>
                <Select onValueChange={(value) => handleInputChange('light_control', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select control" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good Control</SelectItem>
                    <SelectItem value="limited">Limited Control</SelectItem>
                    <SelectItem value="poor">Poor Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sleep_notes">Sleep Notes (Optional)</Label>
              <Textarea
                id="sleep_notes"
                value={formData.sleep_notes || ''}
                onChange={(e) => handleInputChange('sleep_notes', e.target.value)}
                placeholder="Any specific sleep challenges or preferences..."
                rows={2}
              />
            </div>
          </div>

          {/* Food Constraints */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Food & Nutrition</h3>
            
            {/* Allergies */}
            <div className="space-y-2">
              <Label>Food Allergies</Label>
              <div className="flex space-x-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add an allergy"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('allergies', newAllergy, setNewAllergy))}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => addToArray('allergies', newAllergy, setNewAllergy)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.allergies || []).map((allergy, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {allergy}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeFromArray('allergies', index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Similar sections for intolerances and dietary preferences */}
            <div className="space-y-2">
              <Label>Food Intolerances</Label>
              <div className="flex space-x-2">
                <Input
                  value={newIntolerance}
                  onChange={(e) => setNewIntolerance(e.target.value)}
                  placeholder="Add an intolerance"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('intolerances', newIntolerance, setNewIntolerance))}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => addToArray('intolerances', newIntolerance, setNewIntolerance)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.intolerances || []).map((intolerance, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {intolerance}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeFromArray('intolerances', index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Health & Goals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Health & Goals</h3>
            
            <div className="space-y-2">
              <Label htmlFor="injuries_notes">Past Injuries (Optional)</Label>
              <Textarea
                id="injuries_notes"
                value={formData.injuries_notes || ''}
                onChange={(e) => handleInputChange('injuries_notes', e.target.value)}
                placeholder="Brief notes about any past injuries relevant to your performance..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goals">Your Goals</Label>
              <Textarea
                id="goals"
                value={formData.goals || ''}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="What would you like to achieve with your AI physio twin? (e.g., better sleep, injury prevention, performance optimization)"
                rows={3}
              />
            </div>
          </div>

          {/* WhatsApp Opt-in */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Communication Preferences</h3>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="whatsapp_opt_in"
                checked={formData.whatsapp_opt_in || false}
                onCheckedChange={(checked) => handleInputChange('whatsapp_opt_in', checked)}
              />
              <div className="space-y-1">
                <Label htmlFor="whatsapp_opt_in" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I consent to receive WhatsApp messages from the AI physio twin
                </Label>
                <p className="text-xs text-muted-foreground">
                  You'll receive personalized guidance and can chat with your AI physio assistant via WhatsApp. 
                  You can opt out at any time by sending "STOP".
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Continue to Consent
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};