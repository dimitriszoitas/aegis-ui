import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Layers,
  Search,
  FileCode,
  Settings,
  FileChartColumn,
} from 'lucide-react';
import { SideNav } from './side-nav';
import { Avatar } from '@/components/avatar';
export default {
  title: 'Components/Navigation/SideNav',
  component: SideNav,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SideNav>;
function Navigation({ collapsed = false }: { collapsed?: boolean }) {
  const [active, setActive] = useState('alerts');
  return (
    <SideNav
      defaultCollapsed={collapsed}
      activeId={active}
      onNavigate={setActive}
      sections={[
        {
          label: 'Workspace',
          items: [
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
            { id: 'alerts', label: 'Alerts', icon: <ShieldAlert />, count: 48 },
            { id: 'incidents', label: 'Incidents', icon: <Layers />, count: 8 },
            { id: 'hunting', label: 'Hunting', icon: <Search /> },
          ],
        },
        {
          label: 'Manage',
          items: [
            {
              id: 'rules',
              label: 'Detection rules',
              icon: <FileCode />,
              children: [
                { id: 'identity', label: 'Identity rules', icon: <FileCode /> },
                { id: 'endpoint', label: 'Endpoint rules', icon: <FileCode /> },
              ],
            },
            { id: 'reports', label: 'Reports', icon: <FileChartColumn /> },
            { id: 'settings', label: 'Settings', icon: <Settings /> },
          ],
        },
      ]}
      footer={(isCollapsed) => (
        <div className="row">
          <Avatar name="Elena Vasquez" size="sm" />
          {!isCollapsed && <span>Elena Vasquez</span>}
        </div>
      )}
    />
  );
}
export const Expanded: StoryObj<typeof SideNav> = { render: () => <Navigation /> };
export const Collapsed: StoryObj<typeof SideNav> = { render: () => <Navigation collapsed /> };
