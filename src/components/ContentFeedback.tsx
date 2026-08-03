import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { derivePageContext, toPublicPagePath, trackFirstPartyEvent } from '../utils/analytics';

type ContentFeedbackProps = {
  captureEvent?: (event: string, properties?: Record<string, unknown>) => void;
};

function redactFeedbackText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const redactedEmail = trimmed.replace(
    /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi,
    '[redacted-email]'
  );
  const redactedPhone = redactedEmail.replace(
    /(\+?\d[\d\s().-]{7,}\d)/g,
    '[redacted-phone]'
  );
  return redactedPhone;
}

export function ContentFeedback({
  captureEvent = trackFirstPartyEvent,
}: ContentFeedbackProps = {}) {
  const location = useLocation();
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'comment-open' | 'submitting' | 'success' | 'failure'>('idle');
  const [needsVote, setNeedsVote] = useState(false);

  const context = useMemo(() => derivePageContext(location.pathname), [location.pathname]);

  const commonProps = useMemo(
    () => ({
      page_type: context.pageType,
      page_category: context.pageCategory,
      city_slug: context.citySlug,
      appraiser_slug: context.appraiserSlug,
      page_path: toPublicPagePath(location.pathname),
      location: 'content_feedback',
    }),
    [context, location.pathname]
  );
  const isFinished = status === 'success';
  const submitUnavailable = status === 'submitting' || isFinished;

  const onVote = (value: boolean) => {
    if (isFinished) return;
    setHelpful(value);
    setNeedsVote(false);
    setStatus('comment-open');

    captureEvent('seo_content_feedback_vote', {
      ...commonProps,
      helpful: value,
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isFinished || status === 'submitting') return;
    if (helpful === null) {
      setNeedsVote(true);
      return;
    }

    const redacted = redactFeedbackText(comment).slice(0, 800);

    setStatus('submitting');
    try {
      captureEvent('seo_content_feedback_submitted', {
        ...commonProps,
        helpful,
        comment: redacted,
        comment_length: redacted.length,
      });
      setStatus('success');
    } catch {
      setStatus('failure');
    }
  };

  return (
    <section className="w-full border-t border-border/60 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Was this page helpful?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional: tell us what was missing (please don’t include personal info).
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onVote(true)}
              disabled={isFinished || status === 'submitting'}
              className={[
                'rounded-full border px-6 py-3 min-h-[44px] text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                helpful === true
                  ? 'border-blue-500/60 bg-blue-500/10 text-foreground'
                  : 'border-border bg-background hover:bg-muted/40 text-foreground',
                isFinished || status === 'submitting' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onVote(false)}
              disabled={isFinished || status === 'submitting'}
              className={[
                'rounded-full border px-6 py-3 min-h-[44px] text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                helpful === false
                  ? 'border-blue-500/60 bg-blue-500/10 text-foreground'
                  : 'border-border bg-background hover:bg-muted/40 text-foreground',
                isFinished || status === 'submitting' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              No
            </button>
          </div>
          {needsVote ? (
            <p id="content-feedback-vote-hint" role="alert" className="mt-2 text-sm text-amber-700">
              Select Yes or No before sending feedback.
            </p>
          ) : null}

          {status === 'success' ? (
            <p className="mt-4 text-sm font-medium text-foreground">
              Thanks — this helps us improve the directory.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-4">
              <textarea
                className="w-full min-h-24 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="What could we improve on this page?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={status === 'idle' || status === 'submitting'}
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="submit"
                  aria-disabled={submitUnavailable}
                  disabled={submitUnavailable}
                  aria-describedby={needsVote ? 'content-feedback-vote-hint' : undefined}
                  className={[
                    'rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    submitUnavailable
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:bg-gray-800 cursor-pointer',
                  ].join(' ')}
                >
                  {status === 'submitting' ? 'Sending…' : 'Send feedback'}
                </button>
                <span className="text-xs text-muted-foreground">We redact emails/phone numbers client-side.</span>
              </div>
            </form>
          )}
          {status === 'failure' ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              We couldn’t send that feedback. Please try again.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
