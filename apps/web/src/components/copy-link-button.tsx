'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@learnova/ui';

/** Copies the current page URL. */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context): fall back to the browser prompt.
      window.prompt('Copy this link', window.location.href);
    }
  }

  return (
    <Button variant="outline" onClick={() => void copy()} aria-live="polite">
      {copied ? <Check size={16} /> : <Link2 size={16} />}
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
}
