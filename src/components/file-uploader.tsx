
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from './ui/progress';
import type { Task } from '@/types';

interface FileUploaderProps {
  crn: string;
  task: Task;
  onUploadSuccess: (url: string) => void;
}

export function FileUploader({ crn, task, onUploadSuccess }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    setError(null);
    setUploadedUrl(null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    
    setUploading(true);
    setError(null);
    setProgress(0);

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const newFileName = `${crn}_${task}_${sanitizedFileName}`;
    const fullFilePath = `${crn}/${newFileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('commercial-files')
        .upload(fullFilePath, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite file if it exists
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('commercial-files')
        .getPublicUrl(fullFilePath);

      if (!data.publicUrl) {
          throw new Error("Could not get public URL for the uploaded file.");
      }

      setUploadedUrl(data.publicUrl);
      onUploadSuccess(data.publicUrl);
      toast({
        title: 'Success',
        description: 'File uploaded successfully!',
        variant: 'default',
      });
    } catch (err: any) {
      console.error('Upload Error:', err);
      const errorMessage = err.message || 'An unknown error occurred during upload.';
      setError(`Upload failed: ${errorMessage}`);
      toast({
        title: 'Upload Error',
        description: `Upload failed: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="flex-grow"
        />
        <Button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {uploading ? `Uploading...` : 'Upload'}
        </Button>
      </div>
      
      {uploading && (
        <Progress value={progress} className="w-full" />
      )}
      
      {error && (
        <div className="flex items-center text-sm text-destructive">
          <AlertCircle className="mr-2 h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {uploadedUrl && (
        <div className="flex items-center text-sm text-green-600">
           <CheckCircle className="mr-2 h-4 w-4" />
           <p>
            File uploaded. You can view it{' '}
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                here
            </a>.
           </p>
        </div>
      )}
    </div>
  );
}
