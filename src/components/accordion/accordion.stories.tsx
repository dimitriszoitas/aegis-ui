import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { RadioTower, ShieldAlert, UserRound } from '@/components/icon';
import { Checkbox } from '@/components/checkbox';
import { Accordion, type AccordionItem } from './accordion';

const items: AccordionItem[] = [
  {
    value: 'severity',
    title: 'Severity',
    icon: <ShieldAlert />,
    count: 150,
    content: (
      <div>
        Critical: 12 alerts · High: 38 alerts · Medium: 64 alerts · Low: 28 alerts · Info: 8 alerts
      </div>
    ),
  },
  {
    value: 'source',
    title: 'Telemetry source',
    icon: <RadioTower />,
    count: 4,
    content:
      'Endpoint detection, firewall, identity provider, and DNS resolver logs are available in this investigation.',
  },
  {
    value: 'analyst',
    title: 'Assigned analyst',
    icon: <UserRound />,
    count: 3,
    content: 'Maya Chen, Nikos Papadopoulos, and Alex Morgan are on the current response shift.',
  },
  {
    value: 'restricted',
    title: 'Restricted evidence',
    content: 'Restricted incident evidence.',
    disabled: true,
  },
];
const meta = {
  title: 'Components/Lists/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Compact 36px disclosure headers use a quiet hover surface, subtle dividers, optional icons and counts, and a 12px nested-content inset. Use single mode for one open section or multiple mode for independent groups. Arrow keys, Home, and End move between enabled headers; Enter and Space toggle them. Keep form values outside collapsing content when they must persist.',
      },
    },
  },
  args: { type: 'single', collapsible: true, items, defaultValue: 'severity' },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Single: Story = {};
export const Multiple: Story = {
  render: () => <Accordion type="multiple" defaultValue={['severity', 'source']} items={items} />,
};
export const Contained: Story = { args: { variant: 'contained' } };
export const Disabled: Story = { args: { disabled: true } };
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const severity = canvas.getByRole('button', { name: /^Severity/ });
    const source = canvas.getByRole('button', { name: /^Telemetry source/ });
    severity.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(source).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(source).toHaveAttribute('aria-expanded', 'true');
    await expect(severity).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('button', { name: /^Assigned analyst/ })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Restricted evidence' })).toBeDisabled();
    await userEvent.keyboard('{Home}');
    await expect(severity).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(severity).toHaveAttribute('aria-expanded', 'true');
  },
};
function NestedExample() {
  const [endpoint, setEndpoint] = useState(false);
  return (
    <Accordion
      type="multiple"
      defaultValue={['scope']}
      items={[
        {
          value: 'scope',
          title: 'Investigation scope',
          icon: <ShieldAlert />,
          content: (
            <Accordion
              type="multiple"
              defaultValue={['identity']}
              items={[
                {
                  value: 'identity',
                  title: 'Identity',
                  icon: <UserRound />,
                  content: 'Sign-in activity, access changes, and account events.',
                },
                {
                  value: 'endpoint',
                  title: 'Endpoint',
                  icon: <RadioTower />,
                  content: (
                    <Checkbox
                      label="Include endpoint events"
                      checked={endpoint}
                      onCheckedChange={(checked) => setEndpoint(checked === true)}
                    />
                  ),
                },
              ]}
            />
          ),
        },
        { value: 'summary', title: 'Summary', content: 'Review the selected investigation scope.' },
      ]}
    />
  );
}
export const Nested: Story = {
  render: () => <NestedExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const identity = canvas.getByRole('button', { name: 'Identity' });
    identity.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('button', { name: 'Endpoint' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Include endpoint events' }));
    const scope = canvas.getByRole('button', { name: 'Investigation scope' });
    await userEvent.click(scope);
    await expect(scope).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: 'Endpoint' })).not.toBeInTheDocument(),
    );
    await userEvent.click(scope);
    await userEvent.click(canvas.getByRole('button', { name: 'Endpoint' }));
    await expect(canvas.getByRole('checkbox', { name: 'Include endpoint events' })).toBeChecked();
  },
};
function ControlledExample() {
  const [value, setValue] = useState<string[]>(['source']);
  return (
    <>
      <Accordion type="multiple" value={value} onValueChange={setValue} items={items} />
      <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
        {value.length} filter sections expanded
      </p>
    </>
  );
}
export const Controlled: Story = { render: () => <ControlledExample /> };
