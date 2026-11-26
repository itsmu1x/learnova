'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { CreditCard, ExternalLink, KeyRound, Monitor, Moon, Palette, Sun, UserRound } from 'lucide-react';
import { formatPrice } from '@learnova/shared';
import { Badge, Button, Container, Input, Label, Spinner, Textarea, cn } from '@learnova/ui';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { FormError } from '@/components/form-error';
import { Protected } from '@/components/protected';
import { ThumbnailUpload } from '@/components/thumbnail-upload';

interface Me {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  provider: 'local' | 'google' | 'github';
}

const SECTIONS = [
  ['profile', 'Profile', UserRound],
  ['password', 'Password', KeyRound],
  ['billing', 'Pro & billing', CreditCard],
  ['appearance', 'Appearance', Palette],
] as const;

export default function SettingsPage() {
  return (
    <Protected>
      <Settings />
    </Protected>
  );
}

function Settings() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Me>('/users/me')
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <Container className="py-12 md:py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-paper-ink md:text-5xl dark:text-white">Settings</h1>
      <p className="mt-2 text-lg text-paper-mute">Your account, password, subscription and how Learnova looks.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Settings sections" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:px-0">
          {SECTIONS.map(([id, label, Icon]) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold text-paper-mute transition-colors hover:bg-paper-elev hover:text-paper-ink dark:hover:text-white"
            >
              <Icon size={17} />
              {label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 max-w-2xl space-y-8">
          {!me ? (
            error ? <FormError message={error} /> : <Spinner className="h-8 w-8" />
          ) : (
            <>
              <ProfileSection me={me} onSaved={setMe} />
              <PasswordSection me={me} />
              <BillingSection />
              <AppearanceSection />
            </>
          )}
        </div>
      </div>
    </Container>
  );
}

function Panel({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-4xl border border-paper-line bg-paper-elev p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-paper-ink dark:text-white">{title}</h2>
      <p className="mt-1 text-paper-mute">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Saved({ show, text = 'Saved' }: { show: boolean; text?: string }) {
  return show ? (
    <span role="status" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
      {text}
    </span>
  ) : null;
}

/* ---------------- Profile ---------------- */

function ProfileSection({ me, onSaved }: { me: Me; onSaved: (m: Me) => void }) {
  const { refresh, can } = useAuth();
  const isInstructor = can('VIEW_INSTRUCTOR_PANEL');
  const [name, setName] = useState(me.name);
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ?? '');
  const [headline, setHeadline] = useState(me.headline ?? '');
  const [bio, setBio] = useState(me.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await apiFetch<Me>('/users/me', {
        method: 'PATCH',
        body: {
          name: name.trim(),
          ...(avatarUrl ? { avatarUrl } : {}),
          ...(isInstructor ? { headline: headline.trim(), bio: bio.trim() } : {}),
        },
      });
      onSaved({ ...me, ...updated });
      await refresh(); // name/avatar in the navbar
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      id="profile"
      title="Profile"
      description={isInstructor ? 'Shown on your courses and your public instructor page.' : 'How you appear on reviews and certificates.'}
    >
      <form onSubmit={save} className="space-y-5">
        <ThumbnailUpload
          value={avatarUrl}
          onChange={setAvatarUrl}
          folder="/learnova/avatars"
          label="Profile photo"
          hint="A square photo works best (at least 400×400)."
          aspectClassName="aspect-square max-w-[160px] rounded-full"
        />
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={160} required autoComplete="name" />
          <p className="mt-1 text-xs text-paper-mute">New certificates use this name. Certificates you already earned keep the old one.</p>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={me.email} readOnly disabled />
          <p className="mt-1 text-xs text-paper-mute">To change your email, contact support@learnova.dev.</p>
        </div>
        {isInstructor ? (
          <>
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={200}
                placeholder="e.g. Senior frontend engineer, 10 years building design systems"
              />
            </div>
            <div>
              <Label htmlFor="bio">About you</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={2000}
                rows={6}
                placeholder="What you’ve worked on, what you teach, and why learners should trust you on it."
              />
              <p className="mt-1 text-xs text-paper-mute">{bio.length} / 2,000</p>
            </div>
          </>
        ) : null}
        {error ? <FormError message={error} /> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
          {isInstructor ? (
            <Link href={`/instructors/${me.id}`} target="_blank">
              <Button type="button" variant="ghost">
                <ExternalLink size={16} /> View public profile
              </Button>
            </Link>
          ) : null}
          <Saved show={saved} />
        </div>
      </form>
    </Panel>
  );
}

/* ---------------- Password ---------------- */

function PasswordSection({ me }: { me: Me }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (me.provider !== 'local') {
    return (
      <Panel id="password" title="Password" description={`You sign in with ${me.provider === 'google' ? 'Google' : 'GitHub'}.`}>
        <p className="text-paper-mute">
          Your account doesn&apos;t have a password yet. To add one so you can also sign in with your email,{' '}
          <Link href="/forgot-password" className="font-semibold text-signal hover:underline dark:text-signal-bright">
            request a password link
          </Link>
          .
        </p>
      </Panel>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setError('The new passwords don’t match.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/auth/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      // Every session (this one included) was signed out by the server.
      await logout();
      router.push('/login?password=changed');
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Panel id="password" title="Password" description="After changing it you’ll be signed out everywhere, including here.">
      <form onSubmit={save} className="space-y-4">
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
        </div>
        <p className="text-xs text-paper-mute">At least 8 characters, with upper and lower case letters and a number.</p>
        {error ? <FormError message={error} /> : null}
        <Button type="submit" disabled={saving}>
          {saving ? 'Changing…' : 'Change password'}
        </Button>
      </form>
    </Panel>
  );
}

/* ---------------- Pro & billing ---------------- */

interface Subscription {
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: string | null;
}
interface HistoryRow {
  purchase: { id: string; type: 'course' | 'subscription'; amountCents: number; status: string; createdAt: string };
  course: { title: string; slug: string } | null;
}

function BillingSection() {
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [history, setHistory] = useState<HistoryRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function load() {
    apiFetch<Subscription | null>('/payments/subscription').then(setSub).catch(() => setSub(null));
    apiFetch<HistoryRow[]>('/payments/history').then(setHistory).catch(() => setHistory([]));
  }
  useEffect(load, []);

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null);
  const active = sub?.status === 'active';
  const endsOn = fmt(sub?.cancelAtPeriodEnd ?? null);
  const renewsOn = fmt(sub?.currentPeriodEnd ?? null);

  async function cancel() {
    const until = renewsOn ? ` You keep Pro until ${renewsOn}.` : '';
    if (!confirm(`Cancel Learnova Pro? You won’t be charged again.${until}`)) return;
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch('/payments/subscription/cancel', { method: 'POST' });
      setMessage({ ok: true, text: 'Pro cancelled. You won’t be charged again.' });
      load();
    } catch (err) {
      setMessage({ ok: false, text: `Couldn’t cancel Pro: ${(err as Error).message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel id="billing" title="Pro & billing" description="Your subscription and everything you’ve paid for.">
      {sub === undefined ? (
        <Spinner />
      ) : active ? (
        <div className="flex flex-col gap-4 rounded-3xl bg-paper-ink p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-display text-lg font-semibold">
              Learnova Pro <span className="rounded-full bg-marigold px-2 py-0.5 text-xs font-bold text-paper-ink">Active</span>
            </p>
            <p className="text-sm text-white/65">
              {endsOn ? `Cancelled. Pro ends on ${endsOn}.` : renewsOn ? `Renews on ${renewsOn}.` : 'Renews monthly.'}
            </p>
          </div>
          {!endsOn ? (
            <Button variant="outline" className="border-white/30 text-white hover:border-white" disabled={busy} onClick={() => void cancel()}>
              {busy ? 'Cancelling…' : 'Cancel Pro'}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-3xl border border-paper-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-paper-ink dark:text-white">You&apos;re on the free plan</p>
            <p className="text-sm text-paper-mute">Pro unlocks every Pro course for $19 a month.</p>
          </div>
          <Link href="/pricing">
            <Button>See Pro</Button>
          </Link>
        </div>
      )}
      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={cn('mt-3 text-sm font-medium', message.ok ? 'text-emerald-600' : 'text-red-600')}>
          {message.text}
        </p>
      ) : null}

      <h3 className="mt-8 font-display text-lg font-semibold text-paper-ink dark:text-white">Purchase history</h3>
      {history === null ? (
        <Spinner className="mt-3" />
      ) : history.length === 0 ? (
        <p className="mt-2 text-paper-mute">No purchases yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-paper-line rounded-3xl border border-paper-line">
          {history.map(({ purchase, course }) => (
            <li key={purchase.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-paper-ink dark:text-white">
                  {purchase.type === 'subscription' ? 'Learnova Pro' : course ? (
                    <Link href={`/courses/${course.slug}`} className="hover:underline">
                      {course.title}
                    </Link>
                  ) : (
                    'Course (removed)'
                  )}
                </p>
                <p className="text-sm text-paper-mute">{fmt(purchase.createdAt)}</p>
              </div>
              {purchase.status !== 'succeeded' ? (
                <Badge variant={purchase.status === 'pending' ? 'warning' : 'default'} className="capitalize">
                  {purchase.status}
                </Badge>
              ) : null}
              <span className={cn('font-semibold text-paper-ink dark:text-white', purchase.status === 'refunded' && 'line-through opacity-60')}>
                {formatPrice(purchase.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ---------------- Appearance ---------------- */

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const options = [
    ['system', 'Match device', Monitor],
    ['light', 'Light', Sun],
    ['dark', 'Dark', Moon],
  ] as const;

  return (
    <Panel id="appearance" title="Appearance" description="Saved on this browser.">
      <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
        {options.map(([value, label, Icon]) => {
          const selected = mounted && (theme ?? 'system') === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left font-semibold transition-colors',
                selected
                  ? 'border-paper-ink bg-paper-ink text-white dark:border-white dark:bg-white dark:text-paper-ink'
                  : 'border-paper-line text-paper-ink hover:border-paper-ink dark:text-white dark:hover:border-slate-300',
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
