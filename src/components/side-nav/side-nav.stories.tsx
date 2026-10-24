import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import {
  LayoutDashboard,
  Folder,
  Layers,
  Search,
  FileCode,
  Settings,
  FileChartColumn,
} from '@/components/icon';
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
  const [active, setActive] = useState('records');
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
            { id: 'records', label: 'Records', icon: <Folder />, count: 48 },
            { id: 'projects', label: 'Projects', icon: <Layers />, count: 8 },
            { id: 'hunting', label: 'Hunting', icon: <Search /> },
          ],
        },
        {
          label: 'Manage',
          items: [
            {
              id: 'rules',
              label: 'Workflows',
              icon: <FileCode />,
              children: [
                { id: 'customers', label: 'Customer workflows', icon: <FileCode /> },
                { id: 'delivery', label: 'Project workflows', icon: <FileCode /> },
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
    const group = canvas.getByRole('button', { name: 'Workflows' });
    group.focus();
    await expect(await portal.findByRole('tooltip')).toHaveTextContent('Workflows');
    await userEvent.keyboard('{ArrowDown}');
    const customers = await portal.findByRole('menuitem', { name: 'Customer workflows' });
    await waitFor(() => expect(customers).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(group).toHaveFocus());
    await expect(group).toHaveClass('is-active');
    await userEvent.keyboard('{ArrowDown}{Escape}');
    await waitFor(() => expect(group).toHaveFocus());
    await userEvent.click(toggle);
    await expect(canvas.getByRole('button', { name: 'Collapse navigation' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Project workflows' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};
export const ExpandedKeyboard: StoryObj<typeof SideNav> = {
  render: (args) => <Navigation onSearch={args.onSearch} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('button', { name: 'Workflows' });
    group.focus();
    await userEvent.keyboard('{Enter}');
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(document.getElementById(group.getAttribute('aria-controls') ?? '')).toBeVisible();
    await userEvent.tab();
    const customers = canvas.getByRole('button', { name: 'Customer workflows' });
    await expect(customers).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(customers).toHaveAttribute('aria-current', 'page');
    await userEvent.tab({ shift: true });
    await expect(group).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await expect(
      canvas.queryByRole('button', { name: 'Customer workflows' }),
    ).not.toBeInTheDocument();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Reports' })).toHaveFocus();
  },
};
