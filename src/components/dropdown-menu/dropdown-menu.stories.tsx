import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Archive,
  Clipboard,
  ExternalLink,
  Flag,
  MoreHorizontal,
  Trash2,
  UserRound,
} from 'lucide-react';
import { DropdownMenu, type DropdownMenuEntry } from './dropdown-menu';

const basicItems: DropdownMenuEntry[] = [
  {
    type: 'group',
    id: 'investigation',
    label: 'ALR-00842 · Investigation',
    items: [
      { id: 'open', label: 'Open investigation', icon: <ExternalLink />, shortcut: '↵' },
      { id: 'copy', label: 'Copy alert identifier', icon: <Clipboard />, shortcut: '⌘C' },
      {
        type: 'submenu',
        id: 'assign',
        label: 'Assign to analyst',
        icon: <UserRound />,
        items: [
          { id: 'maya', label: 'Maya Chen' },
          { id: 'alex', label: 'Alex Morgan' },
          { id: 'nikos', label: 'Nikos Papadopoulos' },
        ],
      },
      { id: 'escalate', label: 'Escalate to incident', icon: <Flag /> },
    ],
  },
  { type: 'separator', id: 'actions-divider' },
  { id: 'archive', label: 'Archive alert', icon: <Archive />, disabled: true },
  { id: 'delete', label: 'Delete investigation note', icon: <Trash2 />, intent: 'destroy' },
];
const meta = {
  title: 'Components/Lists/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    trigger: (
      <button className="aegis-menu-demo-trigger">
        <MoreHorizontal size={16} /> Alert actions
      </button>
    ),
    items: basicItems,
  },
} satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ActionsAndSubmenus: Story = {};
export const OpenActions: Story = { args: { defaultOpen: true } };
function PreferencesExample({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [eventCounts, setEventCounts] = useState(true);
  const [sparklines, setSparklines] = useState(false);
  const [density, setDensity] = useState('default');
  return (
    <DropdownMenu
      defaultOpen={defaultOpen}
      trigger={<button className="aegis-menu-demo-trigger">Grid display settings</button>}
      items={[
        {
          type: 'group',
          id: 'columns',
          label: 'Visible columns',
          items: [
            {
              type: 'checkbox',
              id: 'counts',
              label: 'Event counts',
              checked: eventCounts,
              onCheckedChange: setEventCounts,
            },
            {
              type: 'checkbox',
              id: 'trends',
              label: 'Event trends',
              checked: sparklines,
              onCheckedChange: setSparklines,
            },
            {
              type: 'checkbox',
              id: 'restricted',
              label: 'Restricted evidence',
              checked: false,
              onCheckedChange: () => undefined,
              disabled: true,
            },
          ],
        },
        { type: 'separator', id: 'density-divider' },
        {
          type: 'radio-group',
          id: 'density',
          label: 'Row density',
          value: density,
          onValueChange: setDensity,
          options: [
            { value: 'compact', label: 'Compact' },
            { value: 'default', label: 'Default' },
            { value: 'comfortable', label: 'Comfortable' },
          ],
        },
      ]}
    />
  );
}
export const CheckboxAndRadio: Story = { render: () => <PreferencesExample /> };
export const OpenCheckboxAndRadio: Story = { render: () => <PreferencesExample defaultOpen /> };
function ActionFeedback() {
  const [message, setMessage] = useState('Choose an action for ALR-00842.');
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <DropdownMenu
        trigger={<button className="aegis-menu-demo-trigger">Triage alert</button>}
        items={[
          {
            id: 'assign',
            label: 'Assign to Maya Chen',
            onSelect: () => setMessage('ALR-00842 is now assigned to Maya Chen.'),
          },
          {
            id: 'triage',
            label: 'Mark as triaged',
            onSelect: () => setMessage('ALR-00842 was marked as triaged.'),
          },
        ]}
      />
      <p role="status" style={{ color: 'var(--color-text-secondary)' }}>
        {message}
      </p>
    </div>
  );
}
export const InteractiveActions: Story = { render: () => <ActionFeedback /> };
