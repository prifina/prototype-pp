import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Phone, Trash2 } from 'lucide-react';
import { seatApi } from '@/services/seatApi';
import { normalizePhoneNumber } from '@/utils/phoneNormalization';
import { useToast } from '@/hooks/use-toast';

interface ManualSeatEntryProps {
  showId: string;
  showName: string;
  onSeatsCreated: () => void;
}

interface PhoneEntry {
  id: string;
  phoneNumber: string;
  isValid: boolean;
  error?: string;
}

export const ManualSeatEntry: React.FC<ManualSeatEntryProps> = ({
  showId,
  showName,
  onSeatsCreated
}) => {
  const [phoneEntries, setPhoneEntries] = useState<PhoneEntry[]>([
    { id: '1', phoneNumber: '', isValid: false }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const addPhoneEntry = () => {
    const newId = Date.now().toString();
    setPhoneEntries([...phoneEntries, { id: newId, phoneNumber: '', isValid: false }]);
  };

  const removePhoneEntry = (id: string) => {
    if (phoneEntries.length > 1) {
      setPhoneEntries(phoneEntries.filter(entry => entry.id !== id));
    }
  };

  const updatePhoneEntry = (id: string, phoneNumber: string) => {
    const phoneResult = normalizePhoneNumber(phoneNumber);
    
    setPhoneEntries(phoneEntries.map(entry => 
      entry.id === id 
        ? {
            ...entry,
            phoneNumber,
            isValid: phoneResult.isValid,
            error: phoneResult.isValid ? undefined : phoneResult.error
          }
        : entry
    ));
  };

  const handleCreateSeats = async () => {
    const validEntries = phoneEntries.filter(entry => entry.isValid && entry.phoneNumber.trim());
    
    if (validEntries.length === 0) {
      toast({
        title: 'No Valid Entries',
        description: 'Please enter at least one valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const createdSeats = await Promise.all(
        validEntries.map(entry => 
          seatApi.createSeat(showId, entry.phoneNumber)
        )
      );

      toast({
        title: 'Seats Created',
        description: `Successfully created ${createdSeats.length} seats.`,
      });

      // Reset form
      setPhoneEntries([{ id: '1', phoneNumber: '', isValid: false }]);
      onSeatsCreated();
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create seats. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const validEntries = phoneEntries.filter(entry => entry.isValid);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Manual Seat Entry
        </CardTitle>
        <CardDescription>
          Add individual phone numbers to create seats for {showName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <Phone className="h-4 w-4" />
          <AlertDescription>
            Enter phone numbers in any format (e.g., "07700 900123", "+44 7700 900123").
            They will be automatically normalized and validated.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Label>Phone Numbers</Label>
          
          {phoneEntries.map((entry, index) => (
            <div key={entry.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Enter phone number..."
                  value={entry.phoneNumber}
                  onChange={(e) => updatePhoneEntry(entry.id, e.target.value)}
                  className={entry.phoneNumber && !entry.isValid ? 'border-red-500' : ''}
                />
                {entry.error && (
                  <p className="text-sm text-red-600 mt-1">{entry.error}</p>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => removePhoneEntry(entry.id)}
                disabled={phoneEntries.length === 1}
                className="mt-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addPhoneEntry}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Phone Number
          </Button>
        </div>

        {validEntries.length > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Ready to create:</p>
            <ul className="text-sm space-y-1">
              {validEntries.map((entry, index) => (
                <li key={entry.id} className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    ✓
                  </span>
                  <span className="font-mono">{normalizePhoneNumber(entry.phoneNumber).e164}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleCreateSeats}
            disabled={validEntries.length === 0 || isCreating}
            className="min-w-[120px]"
          >
            {isCreating ? 'Creating...' : `Create ${validEntries.length} Seats`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};