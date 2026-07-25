'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileUp, Loader2 } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@learnova/ui';
import { AuthShell } from '@/components/auth-shell';
import { ApiRequestError, apiFetch } from '@/lib/api';
import { uploadFileToImageKit } from '@/lib/imagekit-upload';

function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;
  return score;
}

const STRENGTH = ['Too weak', 'Weak', 'Okay', 'Strong', 'Solid'] as const;

export default function InstructorRegisterPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [motivation, setMotivation] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUsername, setLinkedinUsername] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [certificateFileName, setCertificateFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);

  async function onCertFile(file: File) {
    const okTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!okTypes.includes(file.type)) {
      setError('Upload a PDF or image of your teaching credential.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Credential file must be under 10 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFileToImageKit(file, '/learnova/instructor-certs');
      setCertificateUrl(url);
      setCertificateFileName(file.name);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/auth/register-instructor', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          headline: headline.trim() || undefined,
          bio: bio.trim() || undefined,
          expertise: expertise.trim(),
          motivation: motivation.trim(),
          experienceYears: experienceYears ? Number(experienceYears) : undefined,
          portfolioUrl: portfolioUrl.trim() || undefined,
          linkedinUrl: linkedinUsername.trim() || undefined,
          certificateUrl: certificateUrl || undefined,
          certificateFileName: certificateFileName || undefined,
        },
        skipAuthRefresh: true,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : (err as Error).message);
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell mode="register">
        <div className="text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
          <h1 className="mt-4 font-display text-2xl font-semibold text-[#0B0D12] dark:text-white">
            Application received
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5C6578] dark:text-slate-400">
            Thanks for signing up to teach on Learnova. Please wait for our approval — we&apos;ve
            emailed <strong>{email}</strong> with next steps. You won&apos;t be able to sign in until
            an admin reviews your application.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button className="rounded-none">Back to login</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell mode="register">
      <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-[#0B0D12] dark:text-white sm:text-3xl">
        Teach on Learnova
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5C6578] dark:text-slate-400">
        Create an instructor account. We&apos;ll review your application before you can sign in.
      </p>

      <form className="mt-8 space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {password ? (
            <p className="mt-1 text-xs text-slate-500">
              Strength: {STRENGTH[score]}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="headline">Professional headline</Label>
          <Input
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior engineer & course author"
          />
        </div>
        <div>
          <Label htmlFor="expertise">What will you teach?</Label>
          <Textarea
            id="expertise"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            required
            minLength={10}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="motivation">Why teach on Learnova?</Label>
          <Textarea
            id="motivation"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            required
            minLength={20}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="bio">About you (optional)</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={2} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="years">Years of experience</Label>
            <Input
              id="years"
              type="number"
              min={0}
              max={60}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="portfolio">Portfolio URL</Label>
            <Input
              id="portfolio"
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="linkedin">LinkedIn (optional)</Label>
          <div className="grid grid-cols-[max-content_minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-slate-700">
            <span className="flex items-center bg-slate-50 py-0 pl-3 pr-0 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              linkedin.com/in/
            </span>
            <Input
              id="linkedin"
              className="min-w-0 rounded-none border-0 pl-0 focus-visible:ring-0"
              value={linkedinUsername}
              onChange={(e) =>
                setLinkedinUsername(
                  e.target.value
                    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')
                    .replace(/^@+/, '')
                    .replace(/\/.*$/, '')
                    .replace(/[^a-zA-Z0-9-]/g, ''),
                )
              }
              placeholder="your-username"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
        <div>
          <Label>Teaching credential (optional)</Label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              {certificateUrl ? 'Replace file' : 'Upload PDF or image'}
            </Button>
            {certificateFileName ? (
              <span className="text-xs text-slate-500">{certificateFileName}</span>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onCertFile(file);
              e.target.value = '';
            }}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full rounded-none" disabled={loading || uploading || score < 2}>
          {loading ? 'Submitting…' : 'Submit instructor application'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#5C6578] dark:text-slate-400">
        Want to learn instead?{' '}
        <Link href="/register" className="font-medium text-[#0057FF] hover:underline">
          Student signup
        </Link>
      </p>
    </AuthShell>
  );
}
