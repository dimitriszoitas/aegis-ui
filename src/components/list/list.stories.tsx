import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Check, Server, Shield, UserRound } from '@/components/icon';
import { List, ListItem } from './list';
import { Avatar } from '@/components/avatar';
import { IconButton } from '@/components/icon-button';
import { SeverityBadge } from '@/components/severity-badge';

const meta = {
  title: 'Components/Lists/List',
  component: List,
  subcomponents: { ListItem },
  tags: ['autodocs'],
} satisfies Meta<typeof List>;
export default meta;
type Story = StoryObj<typeof meta>;
const records = [
  {
    title: 'Customer portal redesign',
    description: 'Customer experience · PRJ-0042 · 18 tasks',
    severity: 'critical' as const,
    icon: Server,
  },
  {
    title: 'Customer onboarding checklist',
    description: 'Customer success · PRJ-0082 · 6 tasks',
    severity: 'high' as const,
    icon: UserRound,
  },
  {
    title: 'Quarterly account review',
    description: 'Account management · PRJ-0128 · 14 tasks',
    severity: 'medium' as const,
    icon: Shield,
  },
];
function RecordListDemo() {
  const [selected, setSelected] = useState('');
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  return (
    <div className="story-layout" style={{ maxWidth: 780 }}>
      <List aria-label="Records to review">
        {records.map((record) => (
          <ListItem
            key={record.title}
            title={record.title}
            description={record.description}
            icon={<record.icon size={20} />}
            meta={<SeverityBadge severity={record.severity} />}
            selectable
            selected={selected === record.title}
            onSelect={() => setSelected(selected === record.title ? '' : record.title)}
            actions={
              <IconButton
                aria-label={`${acknowledged.includes(record.title) ? 'Acknowledged' : 'Acknowledge'} ${record.title}`}
                size="sm"
                disabled={acknowledged.includes(record.title)}
                onClick={() => setAcknowledged((current) => [...current, record.title])}
              >
                {acknowledged.includes(record.title) ? <Check size={16} /> : <Bell size={16} />}
              </IconButton>
            }
          />
        ))}
      </List>
      <p className="muted" aria-live="polite" style={{ margin: 'var(--space-4) 0 0' }}>
        {selected ? `Selected: ${selected}` : 'Select a record to begin an project.'}
      </p>
    </div>
  );
}
export const SelectableRecords: Story = { render: () => <RecordListDemo /> };
export const Members: Story = {
  render: () => (
    <div className="story-layout" style={{ maxWidth: 660 }}>
      <List divided aria-label="Project team">
        <ListItem
          title="Eleni Papadopoulos"
          description="Senior product designer · Athens"
          avatar={<Avatar name="Eleni Papadopoulos" status="online" />}
          meta="4 assigned"
        />
        <ListItem
          title="Marcus Chen"
          description="Project manager · London"
          avatar={<Avatar name="Marcus Chen" status="busy" />}
          meta="7 assigned"
        />
        <ListItem
          title="Aisha Okafor"
          description="Customer success · Amsterdam"
          avatar={<Avatar name="Aisha Okafor" status="away" />}
          meta="2 assigned"
        />
      </List>
    </div>
  ),
};
export const Densities: Story = {
  render: () => (
    <div className="story-grid">
      {(['compact', 'default', 'comfortable'] as const).map((density) => (
        <section className="story-layout" key={density}>
          <h3>{density[0].toUpperCase() + density.slice(1)} density</h3>
          <List density={density}>
            {records.map((record) => (
              <ListItem
                key={record.title}
                title={record.title}
                description={record.description}
                icon={<record.icon size={17} />}
              />
            ))}
          </List>
        </section>
      ))}
    </div>
  ),
};
export const Disabled: Story = {
  render: () => (
    <List style={{ maxWidth: 600 }}>
      <ListItem
        title="Archived project PRJ-2026-0184"
        description="Resolved by Eleni Papadopoulos · Read-only retention"
        icon={<Shield size={20} />}
        selectable
        disabled
      />
    </List>
  ),
};
