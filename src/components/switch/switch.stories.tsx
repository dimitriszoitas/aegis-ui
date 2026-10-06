import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Switch } from './switch';
import { Field } from '@/components/field';

const meta = { title: 'Components/Forms/Switch', component: Switch, tags: ['autodocs'], args: { label: 'Enable detection rule', description: 'Evaluate newly ingested Windows events.' }, parameters: { docs: { description: { component: 'An immediate on/off setting with a persistent accessible label. Space and Enter toggle it. Checked state is included in native forms when a name is supplied.' } } } } satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = { render: () => <div className="story-grid">
  <Switch label="Enable detection rule" description="Evaluate newly ingested Windows events." />
  <Switch label="Notify assigned analysts" defaultChecked />
  <Switch label="Show resolved alerts" size="sm" />
  <Switch label="Correlate identity events" size="sm" defaultChecked />
  <Switch label="External sharing unavailable" disabled />
  <Switch label="Audit logging required" defaultChecked disabled />
  <Field label="Enable outbound response" error="An approved response policy is required."><Switch /></Field>
</div> };

export const ImmediateSetting: Story = {
  render: function ControlledExample() {
    const [enabled, setEnabled] = useState(false);
    return <div className="stack"><Switch label="Enable detection rule" checked={enabled} onCheckedChange={setEnabled} />
      <output aria-live="polite">{enabled ? 'Rule enabled. New endpoint events will be evaluated.' : 'Rule paused. Existing alerts remain available.'}</output></div>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('switch', { name: 'Enable detection rule' });
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(toggle).not.toBeChecked();
  },
};
