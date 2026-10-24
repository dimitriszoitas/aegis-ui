import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Field } from './field';
import { TextInput } from '@/components/text-input';
import { Textarea } from '@/components/textarea';
import { Checkbox } from '@/components/checkbox';

const meta = {
  title: 'Components/Forms/Field',
  component: Field,
  tags: ['autodocs'],
  args: { label: 'Workflow name', children: <TextInput defaultValue="Customer portal redesign" /> },
  parameters: {
    docs: {
      description: {
        component:
          'Provides automatic label, required state and help/error association to every Aegis form control. Use one logical control per Field. For a radio group, the label names the entire group.',
      },
    },
  },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = {
  render: () => (
    <div className="story-grid">
      <Field
        label="Workflow name"
        required
        helpText="Use a name that describes the project’s outcome."
      >
        <TextInput defaultValue="Customer portal redesign" />
      </Field>
      <Field
        label="Assigned member"
        optional
        helpText="Unassigned records remain in the shared queue."
      >
        <TextInput defaultValue="Katerina Nikolaou" />
      </Field>
      <Field
        label="Source index"
        required
        error="Select a source index available in this workspace."
      >
        <TextInput defaultValue="windows-legacy" />
      </Field>
      <Field
        label="Project identifier"
        disabled
        helpText="Identifiers are managed by the workspace."
      >
        <TextInput defaultValue="PRJ-2026-0042" />
      </Field>
      <Field label="Project notes" helpText="Visible to members assigned to this project.">
        <Textarea defaultValue="Review the updated onboarding flow with the customer team before closing this task." />
      </Field>
      <Field
        label="Enable project updates"
        helpText="Send notifications when project milestones change."
      >
        <Checkbox defaultChecked />
      </Field>
    </div>
  ),
};

export const Validation: Story = {
  render: function ValidationExample() {
    const [name, setName] = useState('');
    const error =
      name.trim().length < 8 ? 'Use at least 8 characters to describe the workflow.' : undefined;
    return (
      <Field
        label="Workflow name"
        required
        error={error}
        helpText="For example, customer portal redesign."
      >
        <TextInput value={name} onValueChange={setName} />
      </Field>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Workflow name (required)' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(input, 'Customer portal redesign');
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).toHaveAccessibleDescription('For example, customer portal redesign.');
  },
};
