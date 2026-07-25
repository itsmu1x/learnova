'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@learnova/ui';
import { uploadImageToImageKit } from '@/lib/imagekit-upload';

interface ThumbnailUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  aspectClassName?: string;
}

export function ThumbnailUpload({
  value,
  onChange,
  folder = '/learnova/course-thumbs',
  label = 'Course thumbnail',
  hint = 'JPG, PNG, or WebP · recommended 1280×720',
  aspectClassName = 'aspect-video',
}: ThumbnailUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8 MB.');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const url = await uploadImageToImageKit(file, folder);
      onChange(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
      ) : null}

      <div
        className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 ${aspectClassName}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[10rem] flex-col items-center justify-center gap-2 px-4 text-center text-slate-500">
            <ImagePlus size={28} className="opacity-60" />
            <p className="text-sm">No thumbnail yet</p>
          </div>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={14} />
          {value ? 'Replace image' : 'Upload image'}
        </Button>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={uploading}
            onClick={() => onChange('')}
          >
            <Trash2 size={14} />
            Remove
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">{hint}</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
