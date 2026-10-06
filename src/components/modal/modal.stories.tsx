import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { TextInput } from '../text-input';
import { Modal, Dialog, ModalClose, ConfirmDialog } from './modal';

const meta = {
  title: 'Components/Overlays/Modal',
  component: Modal,
  subcomponents: { Dialog, ConfirmDialog, ModalClose },
  parameters: {
    docs: {
      description: {
        component:
          'Modal has three width presets: `small` (400px), `regular` (560px, default), and `large` (800px), clamped to the viewport. `showHeader={false}` hides the visual header while preserving its accessible title. Header and footer have divider lines and remain outside the scrollable body.\n\n`ModalClose` closes its nearest parent modal and inherits native button props from Radix. It must be rendered inside that parent.\n\n| ModalClose prop | Type | Behavior |\n| --- | --- | --- |\n| asChild | `boolean` | Uses its single child as the close control instead of adding a button |\n| children | `ReactNode` | Button content or the single child when asChild is enabled |\n| disabled | `boolean` | Disables the close control |\n| onClick | `MouseEventHandler<HTMLButtonElement>` | Runs alongside the close behavior |\n| className / style | `string` / `CSSProperties` | Native presentation props |\n| aria-label | `string` | Accessible name for an icon-only control |\n',
      },
      story: { inline: false, height: 600 },
    },
  },
  tags: ['autodocs'],
  args: {
    title: 'Assign alert to an analyst',
    description: 'Assign ALR-00842 to the analyst responsible for the identity investigation.',
    trigger: <Button>Assign alert</Button>,
    children: (
      <TextInput
        label="Investigation note"
        defaultValue="Review the new device before resolving the alert."
      />
    ),
    footer: (
      <>
        <ModalClose asChild>
          <Button emphasis="ghost">Cancel</Button>
        </ModalClose>
        <ModalClose asChild>
          <Button intent="function">Save assignment</Button>
        </ModalClose>
      </>
    ),
  },
} satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const OpenDialog: Story = { args: { defaultOpen: true } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
      {(['small', 'regular', 'large'] as const).map((size) => (
        <Modal
          {...args}
          key={size}
          size={size}
          trigger={<Button>{size} investigation dialog</Button>}
        />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const viewport = canvasElement.ownerDocument.defaultView!.innerWidth;
    for (const [size, width] of [
      ['small', 400],
      ['regular', 560],
      ['large', 800],
    ] as const) {
      const trigger = canvas.getByRole('button', { name: `${size} investigation dialog` });
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      const dialog = await page.findByRole('dialog');
      await waitFor(() =>
        expect(
          Math.abs(dialog.getBoundingClientRect().width - Math.min(width, viewport - 24)),
        ).toBeLessThan(1),
      );
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveFocus());
    }
  },
};
export const ScrollableWithStickyFooter: Story = {
  args: {
    title: 'Review correlated evidence',
    children: (
      <div>
        {Array.from({ length: 18 }, (_, index) => (
          <p key={index}>
            09:{String(index + 12).padStart(2, '0')} UTC · WS-ATH-114 reported an encoded PowerShell
            process. The command chain originated from an unsigned script in the user downloads
            folder.
          </p>
        ))}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Assign alert' });
    await userEvent.click(trigger);
    const dialog = await page.findByRole('dialog');
    const header = dialog.querySelector<HTMLElement>('.aegis-modal-header')!;
    const footer = dialog.querySelector<HTMLElement>('.aegis-modal-footer')!;
    const body = dialog.querySelector<HTMLElement>('.aegis-modal-body')!;
    const headerTop = header.getBoundingClientRect().top,
      footerTop = footer.getBoundingClientRect().top;
    body.scrollTop = body.scrollHeight;
    await waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));
    expect(header.getBoundingClientRect().top).toBe(headerTop);
    expect(footer.getBoundingClientRect().top).toBe(footerTop);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
function ConfirmationExample({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [deleted, setDeleted] = useState(false);
  return (
    <>
      <ConfirmDialog
        defaultOpen={defaultOpen}
        trigger={
          <Button intent="destroy" emphasis="secondary">
            Delete detection rule
          </Button>
        }
        title="Delete encoded PowerShell rule?"
        description="The rule will stop monitoring endpoints. Existing alerts and investigation history will remain available."
        confirmationText="Encoded PowerShell"
        confirmLabel="Delete rule"
        onConfirm={() => setDeleted(true)}
      />
      <p
        role="status"
        style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-secondary)' }}
      >
        {deleted
          ? 'The encoded PowerShell detection rule was deleted.'
          : 'The detection rule is active on 482 endpoints.'}
      </p>
    </>
  );
}
export const TypedConfirmation: Story = { render: () => <ConfirmationExample /> };
export const OpenTypedConfirmation: Story = { render: () => <ConfirmationExample defaultOpen /> };
export const FailedConfirmation: Story = {
  render: () => (
    <ConfirmDialog
      trigger={<Button intent="destroy">Remove investigation note</Button>}
      title="Remove investigation note?"
      description="This note will be permanently removed from ALR-00842."
      confirmLabel="Remove note"
      onConfirm={async () => {
        throw new Error(
          'The investigation is locked by another analyst. Try again after the handoff.',
        );
      }}
    />
  ),
};

function NavigationConfirmationExample() {
  const [open, setOpen] = useState(false);
  const [navigated, setNavigated] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <div className="stack">
      <Button onClick={() => setOpen(true)}>Leave investigation</Button>
      <h2 ref={heading} tabIndex={-1}>
        {navigated ? 'Reports workspace' : 'Investigation draft'}
      </h2>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Discard investigation draft?"
        description="Discard the draft and return to reports."
        confirmLabel="Discard and continue"
        onConfirm={() => {
          setNavigated(true);
          requestAnimationFrame(() => heading.current?.focus());
        }}
      />
    </div>
  );
}
export const NavigationFocus: Story = {
  render: () => <NavigationConfirmationExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const portal = within(document.body);
    const opener = canvas.getByRole('button', { name: 'Leave investigation' });
    await userEvent.click(opener);
    await portal.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.click(opener);
    await userEvent.click(await portal.findByRole('button', { name: 'Discard and continue' }));
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Reports workspace' })).toHaveFocus(),
    );
  },
};

export const BodyOnly: Story = {
  args: { showHeader: false, showClose: false, footer: undefined, defaultOpen: true },
};
export const HeaderOnly: Story = { args: { footer: undefined, defaultOpen: true } };
export const FooterOnly: Story = {
  args: { showHeader: false, showClose: false, defaultOpen: true },
};
export const HeaderAndFooter: Story = { args: { defaultOpen: true } };
export const HeaderlessWithClose: Story = {
  args: { showHeader: false, footer: undefined, defaultOpen: true },
};
