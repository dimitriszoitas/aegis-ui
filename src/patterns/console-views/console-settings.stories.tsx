import {
  consolePreviewGlobals,
  consolePreviewParameters,
} from '../../../.storybook/console-canvas';
import { useState } from 'react';
import { useGlobals } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ConsoleSettings } from './console-views';
import type { GridDensity } from '@/components/data-grid';
import { isLayoutTheme, type LayoutTheme } from '@/lib/layout-theme';
const meta = {
  title: 'Patterns/Console views/Settings',
  globals: consolePreviewGlobals,
  parameters: consolePreviewParameters,
  component: ConsoleSettings,
  tags: ['autodocs'],
  args: { theme: 'light', density: 'default', onDensityChange: () => undefined },
} satisfies Meta<typeof ConsoleSettings>;
export default meta;
function SettingsDemo({
  theme,
  onThemeChange,
  layoutTheme,
  onLayoutThemeChange,
}: {
  theme: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  layoutTheme?: LayoutTheme;
  onLayoutThemeChange?: (theme: LayoutTheme) => void;
}) {
  const [density, setDensity] = useState<GridDensity>('default');
  return (
    <div className="stack">
      <ConsoleSettings
        theme={theme}
        onThemeChange={onThemeChange}
        layoutTheme={layoutTheme}
        onLayoutThemeChange={onLayoutThemeChange}
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
      layoutTheme={isLayoutTheme(globals.layoutTheme) ? globals.layoutTheme : 'floating'}
      onLayoutThemeChange={(layoutTheme) => updateGlobals({ layoutTheme })}
    />
  );
}
function ReadOnlyThemeStory() {
  const [globals] = useGlobals();
  return (
    <SettingsDemo
      theme={globals.theme === 'dark' ? 'dark' : 'light'}
      layoutTheme={isLayoutTheme(globals.layoutTheme) ? globals.layoutTheme : 'floating'}
    />
  );
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
