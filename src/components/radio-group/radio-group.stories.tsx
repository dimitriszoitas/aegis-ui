import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { RadioGroup, type RadioOption } from './radio-group';
import { Field } from '@/components/field';

const options: RadioOption[] = [
  {
    value: 'weekly',
    label: 'Weekly digest',
    description: 'A summary of project progress every week.',
  },
  {
    value: 'daily',
    label: 'Daily digest',
    description: 'A daily summary of new tasks and updates.',
  },
  {
    value: 'monthly',
    label: 'Monthly digest',
    description: 'A monthly summary of milestones and outcomes.',
  },
];
const meta = {
  title: 'Components/Forms/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  args: { label: 'Update frequency', options, defaultValue: 'weekly' },
  parameters: {
    docs: {
      description: {
        component:
          'A named single-choice group with roving focus and arrow-key selection. Supports horizontal and vertical layouts, per-option descriptions, disabled options and native form submission.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = {
  render: () => (
    <div className="story-grid">
      <RadioGroup label="Update frequency" options={options} defaultValue="weekly" />
      <RadioGroup
        label="Row density"
        orientation="horizontal"
        defaultValue="default"
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'default', label: 'Default' },
          { value: 'comfortable', label: 'Comfortable' },
        ]}
      />
      <RadioGroup label="Managed frequency" options={options} defaultValue="daily" disabled />
      <RadioGroup
        label="Delivery team"
        options={[
          { value: 'product', label: 'Product team' },
          { value: 'customers', label: 'Customer team' },
          {
            value: 'external',
            label: 'External partner',
            disabled: true,
            description: 'Unavailable for this workspace.',
          },
        ]}
        defaultValue="product"
      />
      <Field
        label="Update frequency"
        required
        error="Choose how often you want to receive updates."
      >
        <RadioGroup options={options} />
      </Field>
    </div>
  ),
};

export const KeyboardSelection: Story = {
  render: function ControlledExample() {
    const [value, setValue] = useState('weekly');
    return (
      <div className="stack">
        <RadioGroup
          label="Update frequency"
          options={options}
          value={value}
          onValueChange={setValue}
        />
        <output aria-live="polite">
          Selected frequency: {options.find((option) => option.value === value)?.label}
        </output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Weekly digest' }));
    // Radix moves roving focus on the next task while the arrow key is held.
    await userEvent.keyboard('{ArrowDown>}');
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Daily digest' })).toBeChecked());
    await expect(canvas.getByRole('radio', { name: 'Daily digest' })).toHaveFocus();
    await userEvent.keyboard('{/ArrowDown}');
  },
};
