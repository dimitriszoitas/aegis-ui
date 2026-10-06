import { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { IconButton, type IconButtonProps } from '@/components/icon-button';
export interface CopyButtonProps extends Omit<
  IconButtonProps,
  'children' | 'onClick' | 'aria-label'
> {
  text: string;
  'aria-label'?: string;
  notify?: boolean;
  onCopy?: () => void;
}
export function CopyButton({
  text,
  notify = false,
  onCopy,
  'aria-label': label = 'Copy to clipboard',
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <IconButton
      {...props}
      emphasis={props.emphasis ?? 'ghost'}
      aria-label={copied ? 'Copied' : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          onCopy?.();
          if (notify) toast.success('Copied to clipboard');
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error('Clipboard unavailable. Select and copy the text.');
        }
      }}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </IconButton>
  );
}
