import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
  subcomponents: { SideSheetSection, SideSheetField },
  parameters: {
    docs: {
      description: {
        component:
          'The title and close control share the first header row. Optional `headerActions` appear below alongside result navigation; `actions` remains a compatible alias. Optional `footer` actions remain visible outside the scrollable body. Floating and Fixed layouts share the same content and interactions.',
      },
      story: { inline: false, height: 600 },
    },
  },
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
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

export const HeaderActions: Story = {
  args: {
    defaultOpen: true,
    headerActions: (
      <Button emphasis="secondary" size="sm">
        Assign analyst
      </Button>
    ),
    footer: undefined,
  },
};
export const FooterActions: Story = { args: { defaultOpen: true } };
export const HeaderAndFooterActions: Story = {
  args: {
    defaultOpen: true,
    headerActions: (
      <>
        <Button emphasis="tertiary" size="sm">
          Assign analyst
        </Button>
        <Button emphasis="secondary" size="sm">
          Open investigation
        </Button>
      </>
    ),
  },
};
export const LongTitle: Story = {
  args: {
    defaultOpen: true,
    title:
      'Encoded PowerShell command with an unusual parent process on the production payments endpoint WS-ATH-114',
    headerActions: (
      <Button emphasis="secondary" size="sm">
        Assign analyst
      </Button>
    ),
  },
};
export const FloatingSheet: Story = {
  globals: { layoutTheme: 'floating' },
  args: { defaultOpen: true },
};
export const FixedSheet: Story = { globals: { layoutTheme: 'fixed' }, args: { defaultOpen: true } };
export const HeaderAlignmentAndClose: Story = {
  args: {
    title: 'A long alert title that wraps while the close button stays beside the first line',
    headerActions: (
      <Button emphasis="secondary" size="sm">
        Assign analyst
      </Button>
    ),
    children: (
      <>
        {Array.from({ length: 5 }, (_, index) => (
          <AlertFields key={index} />
        ))}
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Open alert details' });
    await userEvent.click(trigger);
    const dialog = await page.findByRole('dialog');
    const title = dialog.querySelector<HTMLElement>('.aegis-sheet-title')!;
    const close = page.getByRole('button', { name: 'Close detail panel' });
    expect(
      Math.abs(title.getBoundingClientRect().top - close.getBoundingClientRect().top),
    ).toBeLessThan(1);
    const header = dialog.querySelector<HTMLElement>('.aegis-sheet-header')!;
    const scroll = dialog.querySelector<HTMLElement>('.aegis-sheet-body')!;
    const top = header.getBoundingClientRect().top;
    scroll.scrollTop = scroll.scrollHeight;
    await waitFor(() => expect(scroll.scrollTop).toBeGreaterThan(0));
    expect(header.getBoundingClientRect().top).toBe(top);
    close.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
