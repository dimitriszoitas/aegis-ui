import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Check, Server, Shield, UserRound } from 'lucide-react';
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
const alerts = [
  {
    title: 'Encoded PowerShell on WS-ATH-114',
    description: 'Endpoint detection · T1059.001 · 18 events',
    severity: 'critical' as const,
    icon: Server,
  },
  {
    title: 'Impossible travel for k.nakamura',
    description: 'Identity protection · T1078 · 6 events',
    severity: 'high' as const,
    icon: UserRound,
  },
  {
    title: 'Unusual DNS volume from SRV-DNS-02',
    description: 'Network detection · T1071.004 · 142 events',
    severity: 'medium' as const,
    icon: Shield,
  },
];
function AlertListDemo() {
  const [selected, setSelected] = useState('');
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  return (
    <div className="surface" style={{ maxWidth: 780 }}>
      <List aria-label="Alerts to investigate">
        {alerts.map((alert) => (
          <ListItem
            key={alert.title}
            title={alert.title}
            description={alert.description}
            icon={<alert.icon size={20} />}
            meta={<SeverityBadge severity={alert.severity} />}
            selectable
            selected={selected === alert.title}
            onSelect={() => setSelected(selected === alert.title ? '' : alert.title)}
            actions={
              <IconButton
                aria-label={`${acknowledged.includes(alert.title) ? 'Acknowledged' : 'Acknowledge'} ${alert.title}`}
                size="sm"
                disabled={acknowledged.includes(alert.title)}
                onClick={() => setAcknowledged((current) => [...current, alert.title])}
              >
                {acknowledged.includes(alert.title) ? <Check size={16} /> : <Bell size={16} />}
              </IconButton>
            }
          />
        ))}
      </List>
      <p className="muted" aria-live="polite" style={{ margin: 'var(--space-4) 0 0' }}>
        {selected ? `Selected: ${selected}` : 'Select an alert to begin an investigation.'}
      </p>
    </div>
  );
}
export const SelectableAlerts: Story = { render: () => <AlertListDemo /> };
export const Analysts: Story = {
  render: () => (
    <div className="surface" style={{ maxWidth: 660 }}>
      <List divided aria-label="On-call analysts">
        <ListItem
          title="Eleni Papadopoulos"
          description="Senior detection engineer · Athens"
          avatar={<Avatar name="Eleni Papadopoulos" status="online" />}
          meta="4 assigned"
        />
        <ListItem
          title="Marcus Chen"
          description="Incident responder · London"
          avatar={<Avatar name="Marcus Chen" status="busy" />}
          meta="7 assigned"
        />
        <ListItem
          title="Aisha Okafor"
          description="Threat hunter · Amsterdam"
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
        <section className="surface" key={density}>
          <h3>{density[0].toUpperCase() + density.slice(1)} density</h3>
          <List density={density}>
            {alerts.map((alert) => (
              <ListItem
                key={alert.title}
                title={alert.title}
                description={alert.description}
                icon={<alert.icon size={17} />}
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
        title="Archived investigation INC-2026-0184"
        description="Resolved by Eleni Papadopoulos · Read-only retention"
        icon={<Shield size={20} />}
        selectable
        disabled
      />
    </List>
  ),
};
