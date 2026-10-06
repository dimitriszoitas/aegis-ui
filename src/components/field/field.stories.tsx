import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Field } from './field';
import { TextInput } from '@/components/text-input';
import { Textarea } from '@/components/textarea';
import { Checkbox } from '@/components/checkbox';

const meta = { title: 'Components/Forms/Field', component: Field, tags: ['autodocs'], args: { label: 'Detection name', children: <TextInput defaultValue="Encoded PowerShell execution" /> }, parameters: { docs: { description: { component: 'Provides automatic label, required state and help/error association to every Aegis form control. Use one logical control per Field. For a radio group, the label names the entire group.' } } } } satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = { render: () => <div className="story-grid">
  <Field label="Detection name" required helpText="Use a name that describes the suspicious behavior."><TextInput defaultValue="Encoded PowerShell execution" /></Field>
  <Field label="Assigned analyst" optional helpText="Unassigned alerts remain in the shared queue."><TextInput defaultValue="Katerina Nikolaou" /></Field>
  <Field label="Source index" required error="Select a source index available in this workspace."><TextInput defaultValue="windows-legacy" /></Field>
  <Field label="Rule identifier" disabled helpText="Identifiers are managed by the detection service."><TextInput defaultValue="DET-2026-0042" /></Field>
  <Field label="Investigation notes" helpText="Visible to analysts assigned to this incident."><Textarea defaultValue="The parent process was WINWORD.EXE. Review the downloaded document before closing this alert." /></Field>
  <Field label="Enable rule" helpText="Start matching newly ingested Windows events."><Checkbox defaultChecked /></Field>
</div> };

export const Validation: Story = {
  render: function ValidationExample() {
    const [name, setName] = useState('');
    const error = name.trim().length < 8 ? 'Use at least 8 characters to describe the detection.' : undefined;
    return <Field label="Detection name" required error={error} helpText="For example, encoded PowerShell from an Office process.">
      <TextInput value={name} onValueChange={setName} />
    </Field>;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Detection name (required)' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(input, 'Encoded PowerShell execution');
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).toHaveAccessibleDescription('For example, encoded PowerShell from an Office process.');
  },
};
