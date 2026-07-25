'use client';

import { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { AlertCircle, Loader2, PlayCircle } from 'lucide-react';
import { apiFetch, ApiRequestError } from '@/lib/api';

interface PlaybackPayload {
  provider: string;
  playbackId: string;
  token: string | null;
  devMode?: boolean;
}

interface MuxLessonPlayerProps {
  lessonId: string | null;
  title?: string;
  /** Course cover used as the player poster (not per-lesson). */
  posterUrl?: string | null;
}

/**
 * Fetches a signed Mux playback token and mounts the official Mux web player.
 */
export function MuxLessonPlayer({ lessonId, title, posterUrl }: MuxLessonPlayerProps) {
  const [playback, setPlayback] = useState<PlaybackPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lessonId) {
      setPlayback(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlayback(null);

    apiFetch<PlaybackPayload>(`/videos/${lessonId}/playback`)
      .then((data) => {
        if (cancelled) return;
        if (data.devMode || data.playbackId === 'dev-placeholder') {
          setError('Video playback isn’t available in local mock mode. Upload a real Mux video for this lesson.');
          return;
        }
        setPlayback(data);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiRequestError && e.status === 404) {
          setError('No video uploaded for this lesson yet.');
        } else if (e instanceof ApiRequestError && e.status === 403) {
          setError(e.message || 'You need to enroll to watch this lesson.');
        } else {
          setError((e as Error).message || 'Failed to load video.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  if (!lessonId) {
    return (
      <PlayerShell>
        <PlayCircle size={48} className="text-white/50" />
        <p className="mt-3 text-sm text-white/60">Select a lesson to start watching.</p>
      </PlayerShell>
    );
  }

  if (loading) {
    return (
      <PlayerShell>
        <Loader2 size={36} className="animate-spin text-white/70" />
        <p className="mt-3 text-sm text-white/60">Loading secure playback…</p>
      </PlayerShell>
    );
  }

  if (error) {
    return (
      <PlayerShell>
        <AlertCircle size={40} className="text-amber-400" />
        <p className="mt-3 max-w-md text-sm text-white/70">{error}</p>
      </PlayerShell>
    );
  }

  if (!playback) return <PlayerShell />;

  return (
    <div className="aspect-video w-full overflow-hidden bg-black">
      <MuxPlayer
        key={playback.playbackId + (playback.token ?? '')}
        playbackId={playback.playbackId}
        tokens={playback.token ? { playback: playback.token } : undefined}
        poster={posterUrl ?? undefined}
        streamType="on-demand"
        metadata={{ video_title: title }}
        accentColor="#4f46e5"
        className="h-full w-full"
        style={{ width: '100%', height: '100%', aspectRatio: '16 / 9' }}
      />
    </div>
  );
}

function PlayerShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center bg-slate-900 text-center text-white">
      {children}
    </div>
  );
}
