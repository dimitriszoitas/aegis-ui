import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
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
export const CompactHeader: Story = {
  args: { defaultNavCollapsed: true },
  decorators: [
    (Story) => (
      <div style={{ '--console-height': '640px' } as CSSProperties}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole('main');
    const header = main.querySelector<HTMLElement>('.aegis-console-header');
    const bar = main.querySelector<HTMLElement>('.aegis-console-header-content');
    if (!header || !bar) throw new Error('Expected the console page header');
    const timeRange = within(header).getByRole('button', { name: /^Time range:/ });
    const assistant = within(header).getByRole('button', { name: 'Open AI panel' });
    const originalHeight = main.scrollHeight;
    const scrollTop = 1;
    await step(
      'Pin breadcrumbs from the first scroll pixel without moving page content',
      async () => {
        assistant.focus();
        main.scrollTo({ top: scrollTop });
        await waitFor(() => expect(header).toHaveAttribute('data-pinned', 'true'));
        await expect(bar.getBoundingClientRect().top).toBe(main.getBoundingClientRect().top);
        await expect(main.scrollHeight).toBe(originalHeight);
        await expect(main.scrollTop).toBe(scrollTop);
        await expect(assistant).toHaveFocus();
        await expect(within(header).getByRole('button', { name: /^Time range:/ })).toBe(timeRange);
        await expect(within(header).getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
        await expect(canvas.getByRole('heading', { name: 'Alerts', level: 1 })).toBeInTheDocument();
        await userEvent.tab({ shift: true });
        await expect(within(header).getByRole('button', { name: /Switch to/ })).toHaveFocus();
        await expect(main.scrollTop).toBe(scrollTop);
        await userEvent.tab();
        await expect(assistant).toHaveFocus();
      },
    );
    await step('Restore the full title without changing the scrollable page height', async () => {
      main.scrollTo({ top: 0 });
      await waitFor(() => expect(header).toHaveAttribute('data-pinned', 'false'));
      await expect(main.scrollHeight).toBe(originalHeight);
      await expect(canvas.getByText('Investigate signals. Find what matters.')).toBeVisible();
      await expect(assistant).toHaveFocus();
      main.scrollTo({ top: scrollTop });
      await waitFor(() => expect(header).toHaveAttribute('data-pinned', 'true'));
    });
  },
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
