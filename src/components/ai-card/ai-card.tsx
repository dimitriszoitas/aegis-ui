import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ConfidenceBadge, type ConfidenceLevel } from '@/components/confidence-badge';
import { IconButton } from '@/components/icon-button';
import { cn } from '@/lib/utils';
import './ai-card.css';

export type AiLabelProps = ComponentProps<'span'>;
/** The shared visible marker for AI-generated material. */
export function AiLabel({ children = 'AI generated', className, ...props }: AiLabelProps) {
  const gradientId = `ai-marker-${useId().replaceAll(':', '')}`;
  return (
    <span {...props} className={cn('aegis-ai-label', className)}>
      <svg className="aegis-ai-gradient-defs" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="0%" stopColor="var(--color-ai-fg)" />
            <stop offset="100%" stopColor="var(--color-function-fg)" />
          </linearGradient>
        </defs>
      </svg>
      <Sparkles size={15} aria-hidden="true" style={{ stroke: `url(#${gradientId})` }} />
      <span>{children}</span>
    </span>
  );
}

export type AiFeedbackValue = 'positive' | 'negative' | null;
export interface AiFeedbackProps {
  feedback?: AiFeedbackValue;
  onFeedback?: (feedback: AiFeedbackValue) => void;
  onRegenerate?: () => void;
  disabled?: boolean;
}
export function AiFeedback({ feedback, onFeedback, onRegenerate, disabled }: AiFeedbackProps) {
  const [localFeedback, setLocalFeedback] = useState<AiFeedbackValue>(null);
  const selected = feedback === undefined ? localFeedback : feedback;
  function vote(value: AiFeedbackValue) {
    setLocalFeedback(value);
    onFeedback?.(value);
  }
  return (
    <div className="aegis-ai-feedback" role="group" aria-label="Response feedback">
      <IconButton
        size="sm"
        emphasis="ghost"
        aria-label="Helpful response"
        aria-pressed={selected === 'positive'}
        disabled={disabled}
        onClick={() => vote('positive')}
      >
        <ThumbsUp size={14} />
      </IconButton>
      <IconButton
        size="sm"
        emphasis="ghost"
        aria-label="Unhelpful response"
        aria-pressed={selected === 'negative'}
        disabled={disabled}
        onClick={() => vote('negative')}
      >
        <ThumbsDown size={14} />
      </IconButton>
      {onRegenerate && (
        <IconButton
          size="sm"
          emphasis="ghost"
          intent="ai"
          aria-label="Regenerate response"
          disabled={disabled}
          onClick={onRegenerate}
        >
          <RefreshCw size={14} />
        </IconButton>
      )}
    </div>
  );
}
export interface AiCardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title?: string;
  confidence?: ConfidenceLevel;
  provenance?: ReactNode;
  feedback?: AiFeedbackValue;
  onFeedback?: (feedback: AiFeedbackValue) => void;
  onRegenerate?: () => void;
  loading?: boolean;
}
export function AiCard({
  title,
  confidence,
  provenance,
  feedback,
  onFeedback,
  onRegenerate,
  loading = false,
  children,
  className,
  ...props
}: AiCardProps) {
  const titleId = useId();
  return (
    <section
      {...props}
      aria-labelledby={title ? titleId : props['aria-labelledby']}
      aria-busy={loading || undefined}
      className={cn('aegis-ai-card', className)}
    >
      <header className="aegis-ai-card-header">
        <AiLabel />
        {confidence && <ConfidenceBadge confidence={confidence} />}
      </header>
      {title && (
        <h3 id={titleId} className="aegis-ai-card-title">
          {title}
        </h3>
      )}
      <div className="aegis-ai-card-content">{children}</div>
      {(provenance || onFeedback || onRegenerate) && (
        <footer className="aegis-ai-card-footer">
          {provenance && <div className="aegis-ai-provenance">{provenance}</div>}
          {(onFeedback || onRegenerate) && (
            <AiFeedback
              feedback={feedback}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              disabled={loading}
            />
          )}
        </footer>
      )}
    </section>
  );
}
export interface AiHighlightProps extends ComponentProps<'aside'> {
  confidence?: ConfidenceLevel;
  provenance?: ReactNode;
}
export function AiHighlight({
  confidence,
  provenance,
  children,
  className,
  ...props
}: AiHighlightProps) {
  return (
    <aside {...props} className={cn('aegis-ai-highlight', className)}>
      <div className="aegis-ai-card-header">
        <AiLabel />
        {confidence && <ConfidenceBadge confidence={confidence} />}
      </div>
      <div className="aegis-ai-card-content">{children}</div>
      {provenance && <div className="aegis-ai-provenance">{provenance}</div>}
    </aside>
  );
}
