import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ConsoleRules } from './console-views';
import { Banner } from '@/components/banner';
import { DetectionRuleWizard } from '@/patterns/detection-rule-wizard';
import { rules, type DetectionRule } from '@/sample-data';
const meta = {
  title: 'Patterns/Console views/Detection rules',
  component: ConsoleRules,
  tags: ['autodocs'],
  args: { rules, onCreateRule: () => undefined },
  render: (args) => <RuleLibrary initialRules={args.rules} />,
} satisfies Meta<typeof ConsoleRules>;
export default meta;
function RuleLibrary({ initialRules }: { initialRules: readonly DetectionRule[] }) {
  const [library, setLibrary] = useState(initialRules);
  const [creating, setCreating] = useState(false);
  const [createdName, setCreatedName] = useState('');
  if (creating)
    return (
      <DetectionRuleWizard
        onCancel={() => setCreating(false)}
        onCreate={(rule) => {
          setLibrary((current) => [...current, rule]);
          setCreatedName(rule.name);
        }}
      />
    );
  return (
    <div className="stack">
      <ConsoleRules rules={library} onCreateRule={() => setCreating(true)} />
      {createdName && (
        <Banner intent="success" title="Detection rule added" onDismiss={() => setCreatedName('')}>
          {createdName} is now in this local rule library.
        </Banner>
      )}
    </div>
  );
}
export const Library: StoryObj<typeof meta> = {};
export const SearchAndPreview: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search detection rules' }), 'DNS');
    await expect(canvas.getByRole('button', { name: /DNS.*DET/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(canvas.getByRole('region', { name: 'Selected detection rule' })).toBeVisible();
  },
};
export const EmptyLibrary: StoryObj<typeof meta> = { args: { rules: [] } };
