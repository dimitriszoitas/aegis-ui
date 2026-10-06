import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
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
  args: { onSearch: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SideNav>;
function Navigation({
  collapsed = false,
  onSearch,
}: {
  collapsed?: boolean;
  onSearch?: () => void;
}) {
  const [active, setActive] = useState('alerts');
  return (
    <SideNav
      defaultCollapsed={collapsed}
      activeId={active}
      onNavigate={setActive}
      onSearch={onSearch}
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
export const Expanded: StoryObj<typeof SideNav> = {
  render: (args) => <Navigation onSearch={args.onSearch} />,
};
export const Collapsed: StoryObj<typeof SideNav> = {
  render: (args) => <Navigation collapsed onSearch={args.onSearch} />,
};
export const CollapsedKeyboard: StoryObj<typeof SideNav> = {
  render: (args) => <Navigation collapsed onSearch={args.onSearch} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const portal = within(document.body);
    const toggle = canvas.getByRole('button', { name: 'Expand navigation' });
    toggle.focus();
    await userEvent.tab();
    const search = canvas.getByRole('button', { name: 'Search workspace' });
    await expect(search).toHaveFocus();
    await expect(await portal.findByRole('tooltip')).toHaveTextContent('Search workspace');
    await userEvent.keyboard('{Enter}');
    await expect(args.onSearch).toHaveBeenCalled();
    const group = canvas.getByRole('button', { name: 'Detection rules' });
    group.focus();
    await expect(await portal.findByRole('tooltip')).toHaveTextContent('Detection rules');
    await userEvent.keyboard('{ArrowDown}');
    const identity = await portal.findByRole('menuitem', { name: 'Identity rules' });
    await waitFor(() => expect(identity).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(group).toHaveFocus());
    await expect(group).toHaveClass('is-active');
    await userEvent.keyboard('{ArrowDown}{Escape}');
    await waitFor(() => expect(group).toHaveFocus());
    await userEvent.click(toggle);
    await expect(canvas.getByRole('button', { name: 'Collapse navigation' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Endpoint rules' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};
export const ExpandedKeyboard: StoryObj<typeof SideNav> = {
  render: (args) => <Navigation onSearch={args.onSearch} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('button', { name: 'Detection rules' });
    group.focus();
    await userEvent.keyboard('{Enter}');
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(document.getElementById(group.getAttribute('aria-controls') ?? '')).toBeVisible();
    await userEvent.tab();
    const identity = canvas.getByRole('button', { name: 'Identity rules' });
    await expect(identity).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(identity).toHaveAttribute('aria-current', 'page');
    await userEvent.tab({ shift: true });
    await expect(group).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('button', { name: 'Identity rules' })).not.toBeInTheDocument();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Reports' })).toHaveFocus();
  },
};
