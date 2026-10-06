import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Textarea } from './textarea';
import { Field } from '@/components/field';

const notes = 'WINWORD.EXE launched an encoded PowerShell command on WS-ATH-114. The child process contacted a newly registered domain before writing a scheduled task.';
const meta = { title: 'Components/Forms/Textarea', component: Textarea, tags: ['autodocs'], args: { label: 'Investigation notes', defaultValue: notes }, parameters: { docs: { description: { component: 'A multiline field with optional automatic growth bounded by maxRows and an accessible character counter. Native maxLength limits user input; counts use the same UTF-16 length as HTML.' } } } } satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = { render: () => <div className="story-grid">
  <Textarea label="Investigation notes" defaultValue={notes} />
  <Textarea label="Triage summary" placeholder="Record the evidence supporting your verdict." showCount maxLength={500} />
  <Textarea label="Detection rationale" defaultValue={notes} showCount maxLength={500} autoGrow rows={2} maxRows={8} />
  <Field label="Resolution reason" required error="Explain why this alert can be closed."><Textarea defaultValue="" showCount maxLength={300} /></Field>
  <Textarea label="Archived notes" disabled defaultValue="This investigation was archived on 6 October 2026." />
  <Textarea label="Audit record" readOnly defaultValue="Katerina Nikolaou assigned the incident to the endpoint response team." />
</div> };

export const AutoGrowAndCounter: Story = {
  render: function GrowingExample() {
    const [value, setValue] = useState('');
    return <Textarea label="Analyst handoff" value={value} onValueChange={setValue} autoGrow rows={2} maxRows={5} maxLength={280} showCount />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Analyst handoff' });
    await userEvent.type(input, 'Review host WS-ATH-114.');
    await expect(input).toHaveValue('Review host WS-ATH-114.');
    await expect(canvas.getByText('23 / 280 characters')).toBeInTheDocument();
  },
};
