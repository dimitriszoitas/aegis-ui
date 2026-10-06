import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/components/button';
import { ExpandableText } from './expandable-text';

const investigation =
  'The endpoint launched an encoded PowerShell command from an unsigned script in the downloads folder. The parent process was an Office application, and the command contacted a previously unseen network destination. Review the decoded payload and the process tree before isolating the host. Correlate the sign-in history with the device owner, check whether the activity matches an approved maintenance window, and preserve the original evidence for the incident record.';
const meta = {
  title: 'Components/Content/ExpandableText',
  component: ExpandableText,
  parameters: {
    docs: {
      description: {
        component:
          'A configurable line-clamped text preview. The disclosure appears only when measured content exceeds the collapsed line limit, including after resizing or font loading. Plain-text content stays readable to assistive technology. Use expanded/onExpandedChange for controlled state, or defaultExpanded for an initial expanded view.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(100%, 420px)' }}>
        <Story />
      </div>
    ),
  ],
  args: { children: investigation, collapsedLines: 3 },
} satisfies Meta<typeof ExpandableText>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const OneLine: Story = { args: { collapsedLines: 1 } };
export const FiveLines: Story = { args: { collapsedLines: 5 } };
export const ShortText: Story = {
  args: { children: 'No additional evidence was found.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: 'Read more' })).toBeNull();
  },
};
export const InitiallyExpanded: Story = { args: { defaultExpanded: true } };
export const CustomLabels: Story = {
  args: { expandLabel: 'Read full evidence', collapseLabel: 'Collapse evidence' },
};
export const KeyboardDisclosure: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole('button', { name: 'Read more' });
    const content = canvasElement.ownerDocument.getElementById(
      toggle.getAttribute('aria-controls')!,
    )!;
    const collapsedHeight = content.getBoundingClientRect().height;
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAccessibleName('Show less');
    expect(content.getBoundingClientRect().height).toBeGreaterThan(collapsedHeight);
    await userEvent.keyboard(' ');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveFocus();
    expect(content.getBoundingClientRect().height).toBe(collapsedHeight);
  },
};
export const Controlled: Story = {
  render: function ControlledExample(args) {
    const [expanded, setExpanded] = useState(false);
    const [short, setShort] = useState(false);
    return (
      <div className="stack">
        <div className="row">
          <Button emphasis="secondary" onClick={() => setExpanded(!expanded)}>
            Toggle externally
          </Button>
          <Button emphasis="secondary" onClick={() => setShort(!short)}>
            Change text length
          </Button>
        </div>
        <ExpandableText {...args} expanded={expanded} onExpandedChange={setExpanded}>
          {short ? 'Evidence review complete.' : investigation}
        </ExpandableText>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle externally' }));
    await expect(canvas.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Change text length' }));
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Show less' })).toBeNull());
    await userEvent.click(canvas.getByRole('button', { name: 'Change text length' }));
    await expect(canvas.getByRole('button', { name: 'Show less' })).toBeVisible();
  },
};
