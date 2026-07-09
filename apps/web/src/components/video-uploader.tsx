'use client';

import { useCallback, useRef, useState } from 'react';
import { Film, Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge, Button, Card, CardBody } from '@learnova/ui';
import { apiFetch } from '@/lib/api';

type UploadPhase = 'idle' | 'uploading' | 'processing' | 'ready' | 'failed' | 'error';

interface VideoUploaderProps {
  lessonId: string;
  lessonTitle: string;
  initialStatus?: string | null;
  onStatusChange?: (status: string) => void;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration) || 0);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

function uploadFile(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
}

export function VideoUploader({
  lessonId,
  lessonTitle,
  initialStatus,
  onStatusChange,
}: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>(() => {
    if (initialStatus === 'ready') return 'ready';
    if (initialStatus === 'failed') return 'failed';
    if (initialStatus === 'processing' || initialStatus === 'uploading') return 'processing';
    return 'idle';
  });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pollStatus = useCallback(async () => {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await apiFetch<{ status: string; providerStatus?: string }>(
        `/videos/${lessonId}/status`,
      ).catch(() => null);
      if (!res) continue;
      onStatusChange?.(res.status);
      if (res.status === 'ready') {
        setPhase('ready');
        return;
      }
      if (res.status === 'failed') {
        setPhase('failed');
        return;
      }
    }
    setPhase('processing');
  }, [lessonId, onStatusChange]);

  async function handleFile(file: File) {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file (MP4, MOV, WebM).');
      return;
    }
    setError(null);
    setPhase('uploading');
    setProgress(0);

    try {
      const init = await apiFetch<{
        uploadUrl?: string;
        devMode?: boolean;
        message?: string;
      }>(`/videos/${lessonId}/upload-init`, {
        method: 'POST',
        body: { title: lessonTitle },
      });

      if (init.devMode) {
        setPhase('ready');
        onStatusChange?.('ready');
        return;
      }

      if (!init.uploadUrl) throw new Error('No upload URL returned from server');

      await uploadFile(init.uploadUrl, file, setProgress);
      const duration = await getVideoDuration(file);
      await apiFetch(`/videos/${lessonId}/complete`, {
        method: 'POST',
        body: { durationSeconds: duration },
      });

      setPhase('processing');
      onStatusChange?.('processing');
      await pollStatus();
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  }

  const statusBadge = () => {
    if (phase === 'ready') return <Badge variant="success">Ready</Badge>;
    if (phase === 'processing' || phase === 'uploading')
      return <Badge variant="warning">Processing</Badge>;
    if (phase === 'failed' || phase === 'error') return <Badge variant="warning">Failed</Badge>;
    return <Badge>Pending</Badge>;
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-indigo-600" />
            <h4 className="font-semibold text-slate-900 dark:text-white">Lesson video</h4>
          </div>
          {statusBadge()}
        </div>

        {phase === 'uploading' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Uploading to Mux…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {phase === 'processing' ? (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <Loader2 size={16} className="animate-spin" />
            Mux is encoding your video. This usually takes a few minutes.
          </div>
        ) : null}

        {phase === 'ready' ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 size={16} />
            Video is ready for students to watch.
          </div>
        ) : null}

        {(phase === 'idle' || phase === 'error' || phase === 'failed' || phase === 'ready') && (
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-600"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <Upload size={28} className="text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              {phase === 'ready' ? 'Replace video' : 'Drop a video or click to upload'}
            </p>
            <p className="mt-1 text-xs text-slate-500">MP4, MOV, WebM — uploaded directly to Mux</p>
          </div>
        )}

        {error ? (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />

        {phase === 'processing' ? (
          <Button size="sm" variant="outline" onClick={() => void pollStatus()}>
            Check status
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
