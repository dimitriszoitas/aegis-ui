import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { RadioGroup, type RadioOption } from './radio-group';
import { Field } from '@/components/field';

const options: RadioOption[] = [
  {
    value: 'true-positive',
    label: 'True positive',
    description: 'Confirmed malicious activity requiring response.',
  },
  {
    value: 'benign-positive',
    label: 'Benign positive',
    description: 'Expected activity that matched the detection logic.',
  },
  {
    value: 'false-positive',
    label: 'False positive',
    description: 'The detection matched unrelated activity.',
  },
];
const meta = {
  title: 'Components/Forms/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  args: { label: 'Triage verdict', options, defaultValue: 'true-positive' },
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
      <RadioGroup label="Triage verdict" options={options} defaultValue="true-positive" />
      <RadioGroup
        label="Alert density"
        orientation="horizontal"
        defaultValue="default"
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'default', label: 'Default' },
          { value: 'comfortable', label: 'Comfortable' },
        ]}
      />
      <RadioGroup
        label="Locked verdict"
        options={options}
        defaultValue="benign-positive"
        disabled
      />
      <RadioGroup
        label="Escalation team"
        options={[
          { value: 'endpoint', label: 'Endpoint response' },
          { value: 'identity', label: 'Identity response' },
          {
            value: 'external',
            label: 'External response',
            disabled: true,
            description: 'Unavailable for this workspace.',
          },
        ]}
        defaultValue="endpoint"
      />
      <Field
        label="Resolution verdict"
        required
        error="Choose a verdict before closing this alert."
      >
        <RadioGroup options={options} />
      </Field>
    </div>
  ),
};

export const KeyboardSelection: Story = {
  render: function ControlledExample() {
    const [value, setValue] = useState('true-positive');
    return (
      <div className="stack">
        <RadioGroup
          label="Triage verdict"
          options={options}
          value={value}
          onValueChange={setValue}
        />
        <output aria-live="polite">
          Selected verdict: {options.find((option) => option.value === value)?.label}
        </output>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'True positive' }));
    // Radix moves roving focus on the next task while the arrow key is held.
    await userEvent.keyboard('{ArrowDown>}');
    await waitFor(() =>
      expect(canvas.getByRole('radio', { name: 'Benign positive' })).toBeChecked(),
    );
    await expect(canvas.getByRole('radio', { name: 'Benign positive' })).toHaveFocus();
    await userEvent.keyboard('{/ArrowDown}');
  },
};
