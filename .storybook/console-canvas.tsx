import type { Decorator } from '@storybook/react-vite';
import './console-canvas.css';

export const consolePreviewGlobals = {
  viewport: { value: 'aegis-console-1600', isRotated: false },
};

export const consolePreviewParameters = {
  layout: 'fullscreen',
  viewport: {
    options: {
      'aegis-console-1600': {
        name: 'Console · 1600px',
        styles: { width: '1600px', height: '1000px' },
        type: 'desktop',
      },
    },
  },
  docs: { story: { inline: false, height: 1000 } },
};

/** Story-only desktop canvas; the shipped console retains its responsive layout. */
export const WithConsoleCanvas: Decorator = (Story, context) => {
  if (!/^(Console\/|Patterns\/Console views\/)/.test(context.title)) return <Story />;
  return (
    <div
      className="aegis-story-console-viewport"
      role="region"
      aria-label="Console preview, 1600 pixels wide"
      tabIndex={0}
    >
      <div className="aegis-story-console-canvas">
        <Story />
      </div>
    </div>
  );
};
