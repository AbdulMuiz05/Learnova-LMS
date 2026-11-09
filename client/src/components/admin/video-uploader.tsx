'use client';

import * as React from 'react';
import { CheckCircle2, CloudUpload, Film, Loader2, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGetUploadSignatureMutation } from '@/services/uploadApi';
import type { LessonVideo } from '@/types';
import { cn } from '@/utils/cn';

const MAX_VIDEO_MB = 500;

export function VideoUploader({
  value,
  onChange,
  onClearMeta,
}: {
  value?: LessonVideo | null;
  onChange: (video: LessonVideo) => void;
  onClearMeta?: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const xhrRef = React.useRef<XMLHttpRequest | null>(null);
  const [getSignature] = useGetUploadSignatureMutation();
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const uploading = progress !== null;

  React.useEffect(() => {
    return () => {
      xhrRef.current?.abort();
    };
  }, []);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Choose a valid video file (MP4, WebM or MOV).');
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setError(`Videos must be smaller than ${MAX_VIDEO_MB} MB.`);
      return;
    }

    try {
      setProgress(0);
      const signature = await getSignature({ resourceType: 'video', folder: 'videos' }).unwrap();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.apiKey);
      formData.append('timestamp', String(signature.timestamp));
      formData.append('signature', signature.signature);
      formData.append('folder', signature.folder);
      formData.append('type', signature.type);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open('POST', signature.uploadUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        setProgress(null);
        xhrRef.current = null;
        try {
          const body = JSON.parse(xhr.responseText) as {
            secure_url?: string;
            public_id?: string;
            duration?: number;
            error?: { message?: string };
          };
          if (xhr.status >= 200 && xhr.status < 300 && body.secure_url && body.public_id) {
            onChange({
              provider: 'cloudinary',
              type: 'authenticated',
              publicId: body.public_id,
              url: body.secure_url,
              duration: Math.round(body.duration ?? 0),
            });
            toast.success('Video uploaded to Cloudinary');
          } else {
            setError(body.error?.message ?? 'Cloudinary rejected this upload.');
          }
        } catch {
          setError('Cloudinary returned an unreadable response.');
        }
      };

      xhr.onerror = () => {
        setProgress(null);
        xhrRef.current = null;
        setError('Network error while uploading to Cloudinary.');
      };

      xhr.onabort = () => {
        setProgress(null);
        xhrRef.current = null;
      };

      xhr.send(formData);
    } catch (uploadError) {
      setProgress(null);
      const message =
        (uploadError as { data?: { message?: string } })?.data?.message ??
        'Cloudinary is not available. Add credentials on the server or use an external video URL.';
      setError(message);
    }
  };

  const clear = () => {
    xhrRef.current?.abort();
    setProgress(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onClearMeta?.();
  };

  const ready = value?.publicId && value.provider === 'cloudinary';

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Film className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Protected video upload</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Uploaded as an authenticated Cloudinary asset. Playback URLs are signed by the API and only
            issued to enrolled students or admins.
          </p>

          {uploading ? (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading to Cloudinary
                </span>
                <span className="font-semibold tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress ?? 0} />
              {progress === 100 ? (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Processing the uploaded file…
                </p>
              ) : null}
            </div>
          ) : ready ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-success/25 bg-success/5 px-3 py-2 text-xs text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-mono">{value?.publicId}</span>
              <Button variant="ghost" size="icon-sm" onClick={clear} aria-label="Remove video">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <CloudUpload className="h-4 w-4" />
                Choose video
              </Button>
              <span className="text-[11px] text-muted-foreground">MP4, WebM or MOV · max {MAX_VIDEO_MB} MB</span>
            </div>
          )}

          {error ? (
            <p
              className={cn(
                'mt-2 flex items-start gap-1.5 rounded-lg bg-destructive/8 px-2.5 py-2 text-[11px] text-destructive'
              )}
            >
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
