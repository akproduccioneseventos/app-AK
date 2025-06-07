'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { extractReceiptData, type ExtractReceiptDataOutput } from '@/ai/flows/extract-receipt-data';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export function ReceiptProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractReceiptDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a receipt image to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        if (!base64data) {
            setError('Could not read file.');
            setIsLoading(false);
            return;
        }
        const result = await extractReceiptData({ receiptDataUri: base64data });
        setExtractedData(result);
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setIsLoading(false);
      };
    } catch (e: any) {
      console.error('Error extracting receipt data:', e);
      setError(e.message || 'An unexpected error occurred during extraction.');
    } finally {
      // Wait for onloadend or onerror to complete
      // setIsLoading(false); // This is now handled in onloadend/onerror
    }
  };
  
  // Effect to set loading to false when data is extracted or error occurs
  useState(() => {
    if (extractedData || error) setIsLoading(false);
  });


  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="font-headline">Receipt Auto-Fill</CardTitle>
        <CardDescription>Upload a receipt image, and we&apos;ll try to extract the details.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt-upload">Upload Receipt Image</Label>
            <Input id="receipt-upload" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          {previewUrl && (
            <div className="mt-4">
              <img src={previewUrl} alt="Receipt preview" className="max-w-full h-auto rounded-md border" data-ai-hint="receipt scan" />
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="ml-2">Processing receipt...</p>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {extractedData && !isLoading && (
            <Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Extraction Successful!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Vendor:</strong> {extractedData.vendor}</li>
                  <li><strong>Date:</strong> {new Date(extractedData.date).toLocaleDateString()}</li>
                  <li><strong>Amount:</strong> {extractedData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !file}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract Information'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
