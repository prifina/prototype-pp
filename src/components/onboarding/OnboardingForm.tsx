import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, User, Utensils, Bed, Target } from 'lucide-react';
import { OnboardingFormData } from '@/types/database';

interface OnboardingFormProps {
  productionName: string;
  onSubmit: (data: OnboardingFormData) => void;
}

const formSchema = z.object({
  // Personal Info
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  show_name: z.string().min(1, 'Show name is required'),
  tour_or_resident: z.enum(['tour', 'resident']),
  
  // Phone Number - NEW FIELD
  phone_number: z.string().min(1, 'Phone number is required'),
  
  // Health Context
  sleep_environment: z.enum(['hotel', 'home', 'other']),
  noise_level: z.enum(['quiet', 'moderate', 'noisy']),
  light_control: z.enum(['good', 'limited', 'poor']),
  sleep_notes: z.string().optional(),
  
  // Food Constraints
  allergies: z.array(z.string()).default([]),
  intolerances: z.array(z.string()).default([]),
  dietary_preferences: z.array(z.string()).default([]),
  food_notes: z.string().optional(),
  
  // Health & Goals
  injuries_notes: z.string().optional(),
  goals: z.string().optional(),
  
  // Consent
  privacy_policy: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  terms_of_service: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
  whatsapp_opt_in: z.boolean().refine(val => val === true, 'WhatsApp consent is required for this service'),
  data_processing: z.boolean().refine(val => val === true, 'Data processing consent is required'),
});

type FormData = z.infer<typeof formSchema>;

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ productionName, onSubmit }) => {
  const [customAllergy, setCustomAllergy] = React.useState('');
  const [customIntolerance, setCustomIntolerance] = React.useState('');
  const [customDietPref, setCustomDietPref] = React.useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      role: '',
      show_name: productionName,
      tour_or_resident: 'tour',
      phone_number: '',
      sleep_environment: 'hotel',
      noise_level: 'moderate',
      light_control: 'good',
      sleep_notes: '',
      allergies: [],
      intolerances: [],
      dietary_preferences: [],
      food_notes: '',
      injuries_notes: '',
      goals: '',
      privacy_policy: false,
      terms_of_service: false,
      whatsapp_opt_in: false,
      data_processing: false,
    },
  });

  const commonAllergies = ['Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Gluten'];
  const commonIntolerances = ['Lactose', 'Gluten', 'Fructose', 'Histamine'];
  const commonDietPrefs = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Low-carb', 'Keto'];

  const addToArray = (fieldName: 'allergies' | 'intolerances' | 'dietary_preferences', value: string) => {
    if (!value.trim()) return;
    
    const currentValues = form.getValues(fieldName);
    if (!currentValues.includes(value)) {
      form.setValue(fieldName, [...currentValues, value]);
    }
  };

  const removeFromArray = (fieldName: 'allergies' | 'intolerances' | 'dietary_preferences', value: string) => {
    const currentValues = form.getValues(fieldName);
    form.setValue(fieldName, currentValues.filter(item => item !== value));
  };

  const handleSubmit = (data: FormData) => {
    onSubmit(data as OnboardingFormData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-6 h-6" />
          AI Performance Assistant by Production Physiotherapy
        </CardTitle>
        <CardDescription>
          Tell us about yourself<br/>
          This is where we personalise your AI Performance Assistant. All this information is secured and not shared with production. It's only use is to help personalise the information I give you and help me filter my knowledge base to your specific needs.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            
            {/* Personal Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="w-5 h-5" />
                Personal Information
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role in Production *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lead Actor, Chorus, Crew" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tour_or_resident"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tour">Touring Production</SelectItem>
                          <SelectItem value="resident">Resident Production</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* NEW PHONE FIELD */}
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Mobile Number *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 07700 900123 or +44 7700 900123" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Enter your UK mobile number. This must match your pre-registered number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Sleep Environment Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Bed className="w-5 h-5" />
                Sleep Environment
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="sleep_environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Where are you staying? *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hotel">Hotel/Accommodation</SelectItem>
                          <SelectItem value="home">At Home</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="noise_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Noise Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="quiet">Quiet</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="noisy">Noisy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="light_control"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Light Control *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="good">Good Control</SelectItem>
                          <SelectItem value="limited">Limited Control</SelectItem>
                          <SelectItem value="poor">Poor Control</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="sleep_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Sleep Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any specific sleep challenges or requirements?"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Food Constraints Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Utensils className="w-5 h-5" />
                Dietary Information
              </div>
              
              {/* Allergies */}
              <div>
                <Label className="text-base font-medium">Food Allergies</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {commonAllergies.map(allergy => (
                    <Badge
                      key={allergy}
                      variant={form.watch('allergies')?.includes(allergy) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (form.watch('allergies')?.includes(allergy)) {
                          removeFromArray('allergies', allergy);
                        } else {
                          addToArray('allergies', allergy);
                        }
                      }}
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Add custom allergy"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('allergies', customAllergy);
                        setCustomAllergy('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addToArray('allergies', customAllergy);
                      setCustomAllergy('');
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              {/* Intolerances */}
              <div>
                <Label className="text-base font-medium">Food Intolerances</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {commonIntolerances.map(intolerance => (
                    <Badge
                      key={intolerance}
                      variant={form.watch('intolerances')?.includes(intolerance) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (form.watch('intolerances')?.includes(intolerance)) {
                          removeFromArray('intolerances', intolerance);
                        } else {
                          addToArray('intolerances', intolerance);
                        }
                      }}
                    >
                      {intolerance}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Add custom intolerance"
                    value={customIntolerance}
                    onChange={(e) => setCustomIntolerance(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('intolerances', customIntolerance);
                        setCustomIntolerance('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addToArray('intolerances', customIntolerance);
                      setCustomIntolerance('');
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              {/* Dietary Preferences */}
              <div>
                <Label className="text-base font-medium">Dietary Preferences</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {commonDietPrefs.map(pref => (
                    <Badge
                      key={pref}
                      variant={form.watch('dietary_preferences')?.includes(pref) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (form.watch('dietary_preferences')?.includes(pref)) {
                          removeFromArray('dietary_preferences', pref);
                        } else {
                          addToArray('dietary_preferences', pref);
                        }
                      }}
                    >
                      {pref}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Add custom preference"
                    value={customDietPref}
                    onChange={(e) => setCustomDietPref(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('dietary_preferences', customDietPref);
                        setCustomDietPref('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      addToArray('dietary_preferences', customDietPref);
                      setCustomDietPref('');
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="food_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Food Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any other dietary requirements or notes?"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Health & Goals Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Target className="w-5 h-5" />
                Health & Goals
              </div>
              
              <FormField
                control={form.control}
                name="injuries_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Injuries or Physical Concerns</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe any current injuries, pain, or physical limitations..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This information helps provide appropriate guidance. For urgent issues, always seek immediate medical attention.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performance Goals</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What are your physical performance goals for this production?"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Consent Section */}
            <div className="space-y-6">
              <div className="text-lg font-semibold">Consent & Terms</div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="privacy_policy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I have read and accept the <a href="#" className="text-primary underline">Privacy Policy</a> *
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="terms_of_service"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I accept the <a href="#" className="text-primary underline">Terms of Service</a> *
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="whatsapp_opt_in"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                         <FormLabel className="text-sm font-normal">
                           I consent to receive WhatsApp messages from my AI Performance Assistant *
                         </FormLabel>
                         <FormDescription className="text-xs">
                           We deliver information from your AI Performance Assistant to you via WhatsApp messenger. You can opt out at any time by sending STOP.
                         </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="data_processing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                         <FormLabel className="text-sm font-normal">
                           I consent to the processing of my health and personal data for AI Performance Assistant guidance *
                         </FormLabel>
                        <FormDescription className="text-xs">
                          Data will be processed securely and used only to provide personalized guidance
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button type="submit" size="lg" className="min-w-[200px]">
                Complete Profile Setup
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};