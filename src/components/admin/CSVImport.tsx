import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, CheckCircle, AlertCircle, Users, FileText } from 'lucide-react';
import { parseCsvContent, validateCsvData, generateErrorCsv, generatePreviewCsv, CsvValidationResult } from '@/utils/csvImport';
import { seatApi } from '@/services/seatApi';
import { useToast } from '@/hooks/use-toast';

interface CSVImportProps {
  showId: string;
  showName: string;
  onImportComplete: () => void;
}

export const CSVImport: React.FC<CSVImportProps> = ({ showId, showName, onImportComplete }) => {
  const [csvContent, setCsvContent] = useState('');
  const [validationResult, setValidationResult] = useState<CsvValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  };

  const handleValidate = () => {
    if (!csvContent.trim()) {
      toast({
        title: 'No Data',
        description: 'Please upload a CSV file or paste CSV content first.',
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);
    try {
      const rows = parseCsvContent(csvContent);
      const result = validateCsvData(rows);
      setValidationResult(result);
      
      if (result.summary.valid > 0) {
        toast({
          title: 'Validation Complete',
          description: `${result.summary.valid} valid rows, ${result.summary.invalid} errors found.`,
        });
      } else {
        toast({
          title: 'Validation Failed',
          description: 'No valid rows found. Please check the format and data.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Validation Error',
        description: 'Failed to parse CSV. Please check the format.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) {
      toast({
        title: 'No Valid Data',
        description: 'Please validate the CSV and ensure there are valid rows to import.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      await seatApi.importSeats(
        showId,
        validationResult.validRows,
        validationResult.batchId,
        180 // default duration days
      );

      toast({
        title: 'Import Successful',
        description: `Successfully imported ${validationResult.validRows.length} seats.`,
      });

      // Reset state
      setCsvContent('');
      setValidationResult(null);
      onImportComplete();
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import seats. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadErrorCsv = () => {
    if (!validationResult?.errorRows.length) return;
    
    const errorCsv = generateErrorCsv(validationResult.errorRows);
    const blob = new Blob([errorCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${showName}-import-errors.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPreviewCsv = () => {
    if (!validationResult?.validRows.length) return;
    
    const previewCsv = generatePreviewCsv(validationResult.validRows);
    const blob = new Blob([previewCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${showName}-import-preview.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Seats for {showName}
        </CardTitle>
        <CardDescription>
          Upload a CSV file with participant names and phone numbers to create seats
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* CSV Format Instructions */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>CSV Format:</strong> Name, Phone, Notes (optional)
            <br />
            <strong>Example:</strong> "John Smith", "07700 900123", "Lead Actor"
          </AlertDescription>
        </Alert>

        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-1"
            />
          </div>

          <div className="text-center text-muted-foreground">or</div>

          <div>
            <Label htmlFor="csv-content">Paste CSV Content</Label>
            <Textarea
              id="csv-content"
              placeholder="Name,Phone,Notes&#10;John Smith,07700 900123,Lead Actor&#10;Jane Doe,+44 7701 900456,Chorus"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="min-h-[120px] font-mono text-sm mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleValidate}
              disabled={!csvContent.trim() || isValidating}
              variant="outline"
            >
              {isValidating ? 'Validating...' : 'Validate CSV'}
            </Button>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Total Rows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validationResult.totalRows}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Valid Rows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.summary.valid}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Error Rows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {validationResult.summary.invalid}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Tabs */}
            <Tabs defaultValue="valid" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="valid" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Valid Rows ({validationResult.summary.valid})
                </TabsTrigger>
                <TabsTrigger value="errors" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Errors ({validationResult.summary.invalid})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="valid" className="mt-4">
                {validationResult.validRows.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {validationResult.validRows.length} rows ready for import
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPreviewCsv}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Preview
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Original Phone</TableHead>
                          <TableHead>Normalized Phone</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.validRows.slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {row.phoneOriginal}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              <Badge variant="secondary">{row.phoneE164}</Badge>
                            </TableCell>
                            <TableCell>{row.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {validationResult.validRows.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... and {validationResult.validRows.length - 10} more rows
                      </p>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No valid rows found. Please check your CSV format and data.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="errors" className="mt-4">
                {validationResult.errorRows.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {validationResult.errorRows.length} rows with errors
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadErrorCsv}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Errors
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.errorRows.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.rowNumber}</TableCell>
                            <TableCell>{error.name || '-'}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {error.phoneOriginal}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{error.error}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No errors found! All rows are valid.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>

            {/* Import Actions */}
            {validationResult.summary.valid > 0 && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setCsvContent('');
                    setValidationResult(null);
                  }}
                  variant="outline"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="min-w-[120px]"
                >
                  {isImporting ? 'Importing...' : `Import ${validationResult.summary.valid} Seats`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};