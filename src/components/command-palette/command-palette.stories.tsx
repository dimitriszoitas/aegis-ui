import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { Folder, FileCode, Search, Clock, Plus } from '@/components/icon';
import { CommandPalette, type CommandAction } from './command-palette';
import { Button } from '@/components/button';
export default {
  title: 'Components/Navigation/CommandPalette',
  component: CommandPalette,
  parameters: { docs: { story: { inline: false, height: 620 } } },
} satisfies Meta<typeof CommandPalette>;
function Commands({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen),
    [result, setResult] = useState('Use ⌘K or Ctrl+K to search your workspace.');
  const actions: CommandAction[] = [
    {
      id: 'records',
      label: 'Go to records',
      group: 'Navigation',
      icon: <Folder />,
      shortcut: 'G A',
      onSelect: () => setResult('Records workspace selected'),
    },
    {
      id: 'rules',
      label: 'Workflow rules',
      group: 'Navigation',
      icon: <FileCode />,
      onSelect: () => setResult('Workflow rules workspace selected'),
    },
    {
      id: 'new-rule',
      label: 'Create workflow rule',
      group: 'Actions',
      icon: <Plus />,
      onSelect: () => setResult('Workflow rule creation selected'),
    },
    {
      id: 'search-milestones',
      label: 'Search project milestones',
      group: 'Actions',
      icon: <Search />,
      onSelect: () => setResult('Project milestone search opened'),
    },
    {
      id: 'recent-record',
      label: 'Customer onboarding checklist',
      group: 'Recent records',
      icon: <Clock />,
      onSelect: () => setResult('REC-1048 project selected'),
    },
  ];
  return (
    <div className="stack">
      <Button leadingIcon={<Search size={16} />} onClick={() => setOpen(true)}>
        Search workspace
      </Button>
      <p role="status" className="muted">
        {result}
      </p>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        actions={actions}
        onAskAi={(query) => setResult(`Aegis AI received ${query || 'your selected records'}.`)}
      />
    </div>
  );
}
export const Matrix: StoryObj<typeof CommandPalette> = { render: () => <Commands /> };
export const OpenPalette: StoryObj<typeof CommandPalette> = {
  render: () => <Commands defaultOpen />,
};
export const KeyboardFocus: StoryObj<typeof CommandPalette> = {
  render: () => <Commands />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const portal = within(document.body);
    const opener = canvas.getByRole('button', { name: 'Search workspace' });
    opener.focus();
    await userEvent.keyboard('{Enter}');
    const input = await portal.findByRole('combobox', { name: 'Search Aegis' });
    await waitFor(() => expect(input).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await userEvent.type(await portal.findByRole('combobox'), 'Go to records');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent('Records workspace selected');
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
