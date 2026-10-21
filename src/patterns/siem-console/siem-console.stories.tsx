import {
  consolePreviewGlobals,
  consolePreviewParameters,
} from '../../../.storybook/console-canvas';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useGlobals } from 'storybook/preview-api';
import { SiemConsole } from './siem-console';
import { isLayoutTheme } from '@/lib/layout-theme';

const meta = {
  title: 'Console/SIEM console',
  globals: consolePreviewGlobals,
  component: SiemConsole,
  parameters: consolePreviewParameters,
  render: function Render(args, context) {
    const [, updateGlobals] = useGlobals();
    const globals = context.globals;
    return (
      <SiemConsole
        {...args}
        theme={globals.theme === 'dark' ? 'dark' : 'light'}
        onThemeChange={(theme) => updateGlobals({ theme })}
        layoutTheme={isLayoutTheme(globals.layoutTheme) ? globals.layoutTheme : 'floating'}
        onLayoutThemeChange={(layoutTheme) => updateGlobals({ layoutTheme })}
      />
    );
  },
} satisfies Meta<typeof SiemConsole>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Alerts: Story = { name: 'SIEM example' };
