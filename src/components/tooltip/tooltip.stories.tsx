import type { Meta, StoryObj } from '@storybook/react-vite';
import { Info, ShieldCheck } from 'lucide-react';
import { Tooltip, RichTooltip } from './tooltip';

const meta = {
  title: 'Components/Overlays/Tooltip',
  component: Tooltip,
  subcomponents: { RichTooltip },
  tags: ['autodocs'],
  parameters: { layout: 'centered', docs: { story: { inline: false, height: 280 } } },
  args: {
    content: 'Open the alert investigation',
    children: <button className="aegis-tooltip-demo-trigger">Investigate alert</button>,
  },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const OpenTooltip: Story = { args: { defaultOpen: true } };
export const OpenRichTooltip: Story = {
  render: () => (
    <RichTooltip
      defaultOpen
      title="Detection confidence"
      description="High confidence: the rule matches 4 independent signals from identity and endpoint telemetry."
      shortcut="⌘I"
    >
      <button className="aegis-tooltip-demo-trigger" aria-label="About detection confidence">
        <Info size={16} /> Detection confidence
      </button>
    </RichTooltip>
  ),
};
export const PlacementMatrix: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-12)' }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side} side={side} content={`Evidence appears ${side}`}>
          <button className="aegis-tooltip-demo-trigger">{side}</button>
        </Tooltip>
      ))}
    </div>
  ),
};
export const RichEvidence: Story = {
  render: () => (
    <RichTooltip
      title="Detection confidence"
      description="High confidence: the rule matches 4 independent signals from identity and endpoint telemetry."
      shortcut="⌘I"
    >
      <button className="aegis-tooltip-demo-trigger" aria-label="About detection confidence">
        <Info size={16} /> Detection confidence
      </button>
    </RichTooltip>
  ),
};
export const IconOnlyAndDisabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <Tooltip content="Verify the identity source">
        <button className="aegis-tooltip-demo-trigger" aria-label="Verify identity source">
          <ShieldCheck size={16} />
        </button>
      </Tooltip>
      <Tooltip content="Resolve requires an assigned analyst">
        <span tabIndex={0}>
          <button className="aegis-tooltip-demo-trigger" disabled>
            Resolve alert
          </button>
        </span>
      </Tooltip>
    </div>
  ),
};
