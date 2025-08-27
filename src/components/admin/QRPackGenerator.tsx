import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, Printer, Grid3x3, FileText } from 'lucide-react';
import { Seat } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface QRPackGeneratorProps {
  seats: Seat[];
  showName: string;
}

type LayoutOption = 'grid_9' | 'grid_6' | 'single_page';

export const QRPackGenerator: React.FC<QRPackGeneratorProps> = ({ seats, showName }) => {
  const [selectedLayout, setSelectedLayout] = useState<LayoutOption>('grid_9');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const layoutOptions = [
    { value: 'grid_9', label: '9 per page (A4 Grid)', icon: Grid3x3 },
    { value: 'grid_6', label: '6 per page (Large)', icon: Grid3x3 },
    { value: 'single_page', label: '1 per page (Full size)', icon: FileText }
  ];

  // Filter seats based on status
  const filteredSeats = seats.filter(seat => 
    filterStatus === 'all' || seat.status === filterStatus
  );

  const generateQRPack = async () => {
    if (filteredSeats.length === 0) {
      toast({
        title: 'No Seats Available',
        description: 'No seats match the current filter criteria.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate HTML for QR pack
      const htmlContent = generateQRPackHTML(filteredSeats, selectedLayout, showName);
      
      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${showName}-qr-pack-${selectedLayout}-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'QR Pack Generated',
        description: `Generated QR pack with ${filteredSeats.length} seats. Open the HTML file and print.`,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate QR pack. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Pack Generator
        </CardTitle>
        <CardDescription>
          Generate printable QR code handouts for workshop sessions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="layout-select">Layout Options</Label>
            <Select value={selectedLayout} onValueChange={(value: LayoutOption) => setSelectedLayout(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                {layoutOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-select">Seat Status Filter</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seats</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="expired">Expired Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold">{filteredSeats.length}</div>
            <div className="text-sm text-muted-foreground">Seats to Print</div>
          </div>
          
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold">
              {selectedLayout === 'grid_9' ? Math.ceil(filteredSeats.length / 9) :
               selectedLayout === 'grid_6' ? Math.ceil(filteredSeats.length / 6) :
               filteredSeats.length}
            </div>
            <div className="text-sm text-muted-foreground">Pages</div>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold">A4</div>
            <div className="text-sm text-muted-foreground">Paper Size</div>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold">PDF</div>
            <div className="text-sm text-muted-foreground">Print Ready</div>
          </div>
        </div>

        {/* Seat Preview */}
        {filteredSeats.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium">Seats to Include:</h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {filteredSeats.slice(0, 20).map(seat => (
                <Badge key={seat.id} variant="outline" className="text-xs">
                  {seat.seat_code.split('-').pop()} • {seat.phone_e164 ? 
                    seat.phone_e164.slice(-4) : 'No phone'}
                </Badge>
              ))}
              {filteredSeats.length > 20 && (
                <Badge variant="secondary">+{filteredSeats.length - 20} more</Badge>
              )}
            </div>
          </div>
        ) : (
          <Alert>
            <QrCode className="h-4 w-4" />
            <AlertDescription>
              No seats available for the selected filter. Try changing the status filter or import seats first.
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Alert>
          <Printer className="h-4 w-4" />
          <AlertDescription>
            <strong>Printing Instructions:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Generate and download the HTML file</li>
              <li>Open the file in your browser</li>
              <li>Print using Ctrl+P or Cmd+P</li>
              <li>Select "More settings" → Background graphics: ON</li>
              <li>Paper size: A4, Margins: None</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button
            onClick={generateQRPack}
            disabled={filteredSeats.length === 0 || isGenerating}
            className="min-w-[200px]"
          >
            {isGenerating ? (
              'Generating...'
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate QR Pack ({filteredSeats.length} seats)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Generate HTML for QR pack
function generateQRPackHTML(seats: Seat[], layout: LayoutOption, showName: string): string {
  const seatsPerPage = layout === 'grid_9' ? 9 : layout === 'grid_6' ? 6 : 1;
  const gridCols = layout === 'grid_9' ? 3 : layout === 'grid_6' ? 2 : 1;
  
  const pages = [];
  for (let i = 0; i < seats.length; i += seatsPerPage) {
    const pageSeats = seats.slice(i, i + seatsPerPage);
    pages.push(pageSeats);
  }

  const generateQRUrl = (seatCode: string) => {
    const message = `seat:${seatCode}`;
    const encodedMessage = encodeURIComponent(message);
    const waLink = `https://wa.me/?text=${encodedMessage}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${encodeURIComponent(waLink)}`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>QR Pack - ${showName}</title>
    <style>
        @page {
            size: A4;
            margin: 0.5cm;
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        
        .page {
            display: grid;
            grid-template-columns: repeat(${gridCols}, 1fr);
            gap: 1cm;
            page-break-after: always;
            min-height: 26cm;
            padding: 1cm;
        }
        
        .page:last-child {
            page-break-after: auto;
        }
        
        .qr-tile {
            border: 2px solid #333;
            border-radius: 8px;
            padding: 1cm;
            text-align: center;
            background: white;
            ${layout === 'single_page' ? 'height: 24cm; display: flex; flex-direction: column; justify-content: center;' : ''}
        }
        
        .qr-image {
            width: ${layout === 'single_page' ? '300px' : '150px'};
            height: ${layout === 'single_page' ? '300px' : '150px'};
            margin: 0 auto 1em;
        }
        
        .seat-code {
            font-size: ${layout === 'single_page' ? '24px' : '14px'};
            font-weight: bold;
            margin-bottom: 0.5em;
            font-family: monospace;
        }
        
        .phone-hint {
            font-size: ${layout === 'single_page' ? '16px' : '10px'};
            color: #666;
            margin-bottom: 0.5em;
        }
        
        .instructions {
            font-size: ${layout === 'single_page' ? '14px' : '8px'};
            color: #888;
            line-height: 1.3;
        }
        
        .show-name {
            font-size: ${layout === 'single_page' ? '18px' : '10px'};
            font-weight: bold;
            margin-bottom: 1em;
            color: #444;
        }
    </style>
</head>
<body>
    ${pages.map(pageSeats => `
        <div class="page">
            ${pageSeats.map(seat => `
                <div class="qr-tile">
                    <div class="show-name">${showName}</div>
                    <img src="${generateQRUrl(seat.seat_code)}" alt="QR Code" class="qr-image">
                    <div class="seat-code">${seat.seat_code}</div>
                    <div class="phone-hint">Phone: ...${seat.phone_e164?.slice(-4) || '????'}</div>
                    <div class="instructions">
                        Scan QR code or tap link to start WhatsApp chat with your AI Physio Twin.
                        Keep this card for reference.
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>
`;
}