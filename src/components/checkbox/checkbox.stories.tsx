import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Checkbox } from './checkbox';
import { Field } from '@/components/field';

const meta = { title: 'Components/Forms/Checkbox', component: Checkbox, tags: ['autodocs'], args: { label: 'Include resolved alerts' }, parameters: { docs: { description: { component: 'Supports checked, unchecked and indeterminate states, keyboard Space, label clicks and native form submission. Controlled checked accepts boolean or "indeterminate".' } } } } satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = { render: () => <div className="story-grid">
  <Checkbox label="Include resolved alerts" />
  <Checkbox label="Include identity events" defaultChecked description="Correlate sign-in events with endpoint telemetry." />
  <Checkbox label="Some severity levels selected" checked="indeterminate" />
  <Checkbox label="Include archived cases" disabled />
  <Checkbox label="Managed detection enabled" disabled defaultChecked />
  <Checkbox label="Partially inherited permissions" disabled checked="indeterminate" />
  <Field label="Confirm review" required error="Review the evidence before approving this change."><Checkbox /></Field>
</div> };

export const SelectAll: Story = {
  render: function SelectAllExample() {
    const [selected, setSelected] = useState<string[]>(['critical']);
    const options = [{ value: 'critical', label: 'Critical alerts' }, { value: 'high', label: 'High severity alerts' }, { value: 'medium', label: 'Medium severity alerts' }];
    return <div className="stack"><Checkbox label="Select all severity levels" checked={selected.length === options.length ? true : selected.length ? 'indeterminate' : false}
      onCheckedChange={(checked) => setSelected(checked === true ? options.map(({ value }) => value) : [])} />
      {options.map((option) => <Checkbox key={option.value} label={option.label} checked={selected.includes(option.value)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, option.value] : current.filter((value) => value !== option.value))} />)}
      <output aria-live="polite">{selected.length} severity levels included</output></div>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole('checkbox', { name: 'Select all severity levels' });
    await expect(all).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(canvas.getByText('3 severity levels included')).toBeInTheDocument();
    await userEvent.keyboard(' ');
    await expect(all).not.toBeChecked();
  },
};
