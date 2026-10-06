import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ShieldAlert, FileCode, Search, Clock, Plus } from 'lucide-react';
import { CommandPalette, type CommandAction } from './command-palette';
import { Button } from '@/components/button';
export default {
  title: 'Components/Navigation/CommandPalette',
  component: CommandPalette,
} satisfies Meta<typeof CommandPalette>;
function Commands({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen),
    [result, setResult] = useState('Use ⌘K or Ctrl+K to search your workspace.');
  const actions: CommandAction[] = [
    {
      id: 'alerts',
      label: 'Go to alerts',
      group: 'Navigation',
      icon: <ShieldAlert />,
      shortcut: 'G A',
      onSelect: () => setResult('Alerts workspace selected'),
    },
    {
      id: 'rules',
      label: 'Detection rules',
      group: 'Navigation',
      icon: <FileCode />,
      onSelect: () => setResult('Detection rules workspace selected'),
    },
    {
      id: 'new-rule',
      label: 'Create detection rule',
      group: 'Actions',
      icon: <Plus />,
      onSelect: () => setResult('Detection rule creation selected'),
    },
    {
      id: 'hunt',
      label: 'Hunt for encoded PowerShell',
      group: 'Actions',
      icon: <Search />,
      onSelect: () => setResult('PowerShell hunting query opened'),
    },
    {
      id: 'recent-alert',
      label: 'Impossible travel for k.nakamura',
      group: 'Recent alerts',
      icon: <Clock />,
      onSelect: () => setResult('ALR-1048 investigation selected'),
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
        onAskAi={(query) =>
          setResult(`Aegis is ready to investigate ${query || 'your selected alerts'}.`)
        }
      />
    </div>
  );
}
export const Matrix: StoryObj<typeof CommandPalette> = { render: () => <Commands /> };
export const OpenPalette: StoryObj<typeof CommandPalette> = {
  render: () => <Commands defaultOpen />,
};
