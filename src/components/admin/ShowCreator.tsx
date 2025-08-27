import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, Theater, Building, Calendar as CalendarIconLucide, Users, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { showApi } from '@/services/showApi';
import { Show } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface ShowCreatorProps {
  onShowCreated: (show: Show) => void;
}

const showSchema = z.object({
  show_name: z.string().min(1, 'Show name is required'),
  production_house_name: z.string().min(1, 'Production house is required'),
  passcode: z.string().min(6, 'Passcode must be at least 6 characters'),
  seat_limit: z.number().min(1, 'Must allow at least 1 seat').max(500, 'Maximum 500 seats'),
  default_seat_duration_days: z.number().min(30, 'Minimum 30 days').max(365, 'Maximum 365 days'),
  start_at: z.date(),
  end_at: z.date().optional(),
  contacts: z.object({
    gm: z.string().optional(),
    production_coordinator: z.string().optional(),
    company_manager: z.string().optional(),
  }).optional(),
});

type ShowFormData = z.infer<typeof showSchema>;

export const ShowCreator: React.FC<ShowCreatorProps> = ({ onShowCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const form = useForm<ShowFormData>({
    resolver: zodResolver(showSchema),
    defaultValues: {
      show_name: '',
      production_house_name: '',
      passcode: '',
      seat_limit: 50,
      default_seat_duration_days: 180,
      start_at: new Date(),
      contacts: {
        gm: '',
        production_coordinator: '',
        company_manager: '',
      },
    },
  });

  const generatePasscode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue('passcode', result);
  };

  const handleSubmit = async (data: ShowFormData) => {
    setIsCreating(true);
    try {
      // Hash the passcode for storage
      const encoder = new TextEncoder();
      const passcodeData = encoder.encode(data.passcode);
      const hash = await crypto.subtle.digest('SHA-256', passcodeData);
      const hashedPasscode = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const showData: Omit<Show, 'id' | 'created_at' | 'updated_at'> = {
        show_name: data.show_name,
        production_house_name: data.production_house_name,
        passcode_hash: hashedPasscode,
        seat_limit: data.seat_limit,
        default_seat_duration_days: data.default_seat_duration_days,
        status: 'active',
        start_at: data.start_at.toISOString(),
        end_at: data.end_at?.toISOString(),
        contacts: data.contacts,
      };

      const createdShow = await showApi.createShow(showData);
      
      toast({
        title: 'Show Created',
        description: `${createdShow.show_name} has been created successfully.`,
      });

      onShowCreated(createdShow);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create show. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Show
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Theater className="w-5 h-5" />
            Create New Show
          </DialogTitle>
          <DialogDescription>
            Set up a new production with access controls and seat management
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Theater className="w-4 h-4" />
                Basic Information
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="show_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Lion King" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="production_house_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production House *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Kenny Wax Productions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Access Control */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield className="w-4 h-4" />
                Access Control
              </div>
              
              <FormField
                control={form.control}
                name="passcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Passcode *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Enter or generate passcode" 
                          {...field} 
                          className="font-mono"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={generatePasscode}
                        >
                          Generate
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Participants will need this passcode to access onboarding. Keep it secure.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="seat_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seat Limit *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="500" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of participants for this show
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarIconLucide className="w-4 h-4" />
                Schedule & Duration
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="end_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>No end date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              date < new Date() || 
                              (form.watch('start_at') && date <= form.watch('start_at'))
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Leave empty for ongoing shows
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="default_seat_duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Seat Duration (Days) *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          min="30" 
                          max="365" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 180)}
                        />
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">365 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormDescription>
                      How long each participant has access by default
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="w-4 h-4" />
                Contact Information (Optional)
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="contacts.gm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Manager</FormLabel>
                      <FormControl>
                        <Input placeholder="Name and contact details" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contacts.production_coordinator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Coordinator</FormLabel>
                      <FormControl>
                        <Input placeholder="Name and contact details" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contacts.company_manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Manager</FormLabel>
                      <FormControl>
                        <Input placeholder="Name and contact details" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
                className="min-w-[120px]"
              >
                {isCreating ? 'Creating...' : 'Create Show'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};