import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { SeverityBadge } from '../severity-badge';
import { SideSheet, SideSheetSection, SideSheetField } from './side-sheet';

function AlertFields() {
  return (
    <>
      <SideSheetSection title="Alert details">
        <SideSheetField label="Severity">
          <SeverityBadge severity="high" />
        </SideSheetField>
        <SideSheetField label="Status">Needs review</SideSheetField>
        <SideSheetField label="Entity">
          <code>WS-ATH-114</code>
        </SideSheetField>
        <SideSheetField label="Technique">T1059.001 · PowerShell</SideSheetField>
        <SideSheetField label="First observed">
          <code>2026-06-18 09:42:16 UTC</code>
        </SideSheetField>
        <SideSheetField label="Assigned analyst">Maya Chen</SideSheetField>
      </SideSheetSection>
      <SideSheetSection title="Investigation summary">
        <p>
          An encoded PowerShell command launched from an unsigned script in the downloads folder.
          Review the parent process and network connections before resolving this alert.
        </p>
      </SideSheetSection>
    </>
  );
}
const meta = {
  title: 'Components/Overlays/SideSheet',
  component: SideSheet,
  tags: ['autodocs'],
  args: {
    title: 'Encoded PowerShell command on WS-ATH-114',
    description: 'ALR-00842 · Endpoint detection',
    trigger: <Button>Open alert details</Button>,
    children: <AlertFields />,
    footer: (
      <>
        <Button emphasis="ghost">Assign analyst</Button>
        <Button intent="function">Mark as triaged</Button>
      </>
    ),
  },
} satisfies Meta<typeof SideSheet>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const OpenSheet: Story = { args: { defaultOpen: true } };
export const SizeMatrix: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <SideSheet
          {...args}
          key={size}
          size={size}
          trigger={<Button>{size} detail panel</Button>}
        />
      ))}
    </div>
  ),
};
function TriageExample() {
  const [position, setPosition] = useState(5);
  return (
    <SideSheet
      {...meta.args}
      defaultOpen
      position={position}
      total={48}
      onPrevious={() => setPosition((value) => Math.max(1, value - 1))}
      onNext={() => setPosition((value) => Math.min(48, value + 1))}
      actions={
        <Button size="sm" emphasis="ghost">
          Open investigation
        </Button>
      }
    />
  );
}
export const TriageNavigation: Story = { render: () => <TriageExample /> };
function DockedExample() {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        height: 600,
        display: 'flex',
        background: 'var(--color-bg-canvas)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
      }}
    >
      <main style={{ flex: 1, minWidth: 0, padding: 'var(--space-5)' }}>
        <h2>Alerts workspace</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBlock: 'var(--space-4)' }}>
          The details panel uses layout space while the alerts remain interactive.
        </p>
        <Button onClick={() => setOpen(!open)}>{open ? 'Close' : 'Open'} docked details</Button>
      </main>
      <SideSheet
        {...meta.args}
        trigger={undefined}
        open={open}
        onOpenChange={setOpen}
        docked
        size="sm"
      />
    </div>
  );
}
export const DockedPushLayout: Story = {
  render: () => <DockedExample />,
  parameters: { layout: 'fullscreen' },
};
