import { useState, type ReactNode } from 'react';
import { SideSheet, SideSheetField, SideSheetSection } from '@/components/side-sheet';
import { JsonViewer } from '@/components/json-viewer';
import { SeverityBadge } from '@/components/severity-badge';
import { StatusBadge } from '@/components/status-badge';
import type { Alert } from '@/sample-data';

export interface ConsoleViewStoryFrameProps {
  children: (open: (alert: Alert) => void) => ReactNode;
}
export function ConsoleViewStoryFrame({ children }: ConsoleViewStoryFrameProps) {
  const [selected, setSelected] = useState<Alert>();
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      {children(setSelected)}
      <SideSheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title={selected?.title ?? 'Alert evidence'}
        description={selected?.id}
        size="md"
      >
        {selected && (
          <>
            <SideSheetSection title="Alert context">
              <SideSheetField label="Severity">
                <SeverityBadge severity={selected.severity} />
              </SideSheetField>
              <SideSheetField label="Status">
                <StatusBadge status={selected.status} />
              </SideSheetField>
              <SideSheetField label="Entity">{selected.entity.name}</SideSheetField>
              <SideSheetField label="Source">{selected.source}</SideSheetField>
            </SideSheetSection>
            <JsonViewer value={selected.events[0]?.payload ?? {}} label="Original event sample" />
          </>
        )}
      </SideSheet>
    </div>
  );
}
