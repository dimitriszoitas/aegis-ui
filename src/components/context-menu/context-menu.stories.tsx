import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Clipboard, ExternalLink, Trash2, UserRound } from 'lucide-react';
import { ContextMenu, type ContextMenuEntry } from './context-menu';

const items: ContextMenuEntry[] = [
  {
    type: 'group',
    id: 'actions',
    label: 'ALR-00842 · Alert actions',
    items: [
      { id: 'open', label: 'Open investigation', icon: <ExternalLink />, shortcut: '↵' },
      { id: 'copy', label: 'Copy alert identifier', icon: <Clipboard />, shortcut: '⌘C' },
      {
        type: 'submenu',
        id: 'assign',
        label: 'Assign analyst',
        icon: <UserRound />,
        items: [
          { id: 'maya', label: 'Maya Chen' },
          { id: 'nikos', label: 'Nikos Papadopoulos' },
        ],
      },
    ],
  },
  { type: 'separator', id: 'divider' },
  { id: 'delete', label: 'Delete investigation note', icon: <Trash2 />, intent: 'destroy' },
];
const meta = {
  title: 'Components/Lists/ContextMenu',
  component: ContextMenu,
  parameters: { docs: { story: { inline: false, height: 460 } } },
  tags: ['autodocs'],
  args: {
    children: (
      <div className="aegis-context-target">
        Encoded PowerShell command on WS-ATH-114
        <br />
        <small>Right-click or press Shift+F10 to open alert actions.</small>
      </div>
    ),
    items,
  },
} satisfies Meta<typeof ContextMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const OpenActions: Story = { args: { defaultOpen: true } };
export const Disabled: Story = {
  args: {
    disabled: true,
    children: (
      <div className="aegis-context-target">
        Archived investigation · Context actions are unavailable.
      </div>
    ),
  },
};
function Preferences({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [pinned, setPinned] = useState(true);
  const [view, setView] = useState('evidence');
  return (
    <ContextMenu
      defaultOpen={defaultOpen}
      items={[
        {
          type: 'checkbox',
          id: 'pin',
          label: 'Pin evidence panel',
          checked: pinned,
          onCheckedChange: setPinned,
        },
        { type: 'separator', id: 'divider' },
        {
          type: 'radio-group',
          id: 'view',
          label: 'Investigation view',
          value: view,
          onValueChange: setView,
          options: [
            { value: 'evidence', label: 'Evidence' },
            { value: 'timeline', label: 'Timeline' },
            { value: 'rule', label: 'Detection rule' },
          ],
        },
      ]}
    >
      <div className="aegis-context-target">
        Investigation workspace
        <br />
        <small>Right-click or press Shift+F10 to adjust the view.</small>
      </div>
    </ContextMenu>
  );
}
export const CheckboxAndRadio: Story = { render: () => <Preferences /> };
export const OpenCheckboxAndRadio: Story = { render: () => <Preferences defaultOpen /> };
