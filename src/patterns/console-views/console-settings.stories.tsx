import { useState } from 'react';
import { useGlobals } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ConsoleSettings } from './console-views';
import type { GridDensity } from '@/components/data-grid';
const meta = {
  title: 'Patterns/Console views/Settings',
  component: ConsoleSettings,
  tags: ['autodocs'],
  args: { theme: 'light', density: 'default', onDensityChange: () => undefined },
} satisfies Meta<typeof ConsoleSettings>;
export default meta;
function SettingsDemo({
  theme,
  onThemeChange,
}: {
  theme: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}) {
  const [density, setDensity] = useState<GridDensity>('default');
  return (
    <div className="stack">
      <ConsoleSettings
        theme={theme}
        onThemeChange={onThemeChange}
        density={density}
        onDensityChange={setDensity}
      />
      <p role="status" className="muted">
        Alert grid density: {density}.
      </p>
    </div>
  );
}
function InteractiveSettingsStory() {
  const [globals, updateGlobals] = useGlobals();
  return (
    <SettingsDemo
      theme={globals.theme === 'dark' ? 'dark' : 'light'}
      onThemeChange={(theme) => updateGlobals({ theme })}
    />
  );
}
function ReadOnlyThemeStory() {
  const [globals] = useGlobals();
  return <SettingsDemo theme={globals.theme === 'dark' ? 'dark' : 'light'} />;
}
export const Preferences: StoryObj<typeof meta> = {
  render: InteractiveSettingsStory,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Comfortable' }));
    await expect(canvas.getByText('Alert grid density: comfortable.')).toBeVisible();
  },
};
export const ThemeFromPreview: StoryObj<typeof meta> = {
  render: ReadOnlyThemeStory,
};
