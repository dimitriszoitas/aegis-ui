import type { Meta, StoryObj } from '@storybook/react-vite';
import { useGlobals } from 'storybook/preview-api';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { SiemConsole } from './siem-console';

const meta = {
  title: 'Console/SIEM console',
  component: SiemConsole,
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [globals, updateGlobals] = useGlobals();
    return (
      <SiemConsole
        {...args}
        theme={globals.theme === 'dark' ? 'dark' : 'light'}
        onThemeChange={(theme) => updateGlobals({ theme })}
      />
    );
  },
} satisfies Meta<typeof SiemConsole>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Alerts: Story = {};
export const CollapsedNavigation: Story = { args: { defaultNavCollapsed: true } };
export const WithAssistant: Story = { args: { defaultNavCollapsed: true, defaultAiOpen: true } };
export const WithFilters: Story = {
  args: { defaultNavCollapsed: true, defaultFilterPanelOpen: true },
};
export const Overview: Story = { args: { initialPage: 'overview' } };
export const Rules: Story = { args: { initialPage: 'rules' } };
export const AlertDetail: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const row = c
      .getAllByRole('row')
      .find((element) => element.getAttribute('aria-label')?.startsWith('ALR-'));
    if (!row) throw new Error('Expected an alert row');
    await userEvent.click(row);
    await expect(await within(document.body).findByRole('dialog')).toBeVisible();
  },
};
export const CreateRule: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: 'Create rule' }));
    await expect(c.getByRole('heading', { name: 'Create detection rule', level: 1 })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Vertical' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
};
export const QueueNavigation: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getAllByRole('checkbox', { name: /^Select ALR-/ })[0]);
    await userEvent.click(c.getByRole('tab', { name: /^Needs review/ }));
    await waitFor(() =>
      expect(c.queryByRole('button', { name: 'Summarize with AI' })).not.toBeInTheDocument(),
    );
    await expect(c.getByRole('tab', { name: /^Needs review/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(c.getByRole('tab', { name: /^Assigned to me/ }));
    await expect(c.getByRole('tab', { name: /^Assigned to me/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(c.getByRole('tab', { name: /^All alerts/ }));
    await userEvent.click(c.getByRole('button', { name: 'Collapse navigation' }));
    await expect(c.getByRole('button', { name: 'Expand navigation' })).toHaveFocus();
    await userEvent.click(c.getByRole('button', { name: 'Search workspace' }));
    const body = within(document.body);
    const input = await body.findByRole('combobox');
    await userEvent.type(input, 'Go to reports');
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(c.getByRole('heading', { name: 'Reports', level: 1 })).toBeVisible(),
    );
  },
};
