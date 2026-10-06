import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShieldCheck, Clock3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

const meta = {
  title: 'Components/Surfaces/Card',
  component: Card,
  subcomponents: { CardHeader, CardTitle, CardDescription, CardContent, CardFooter },
  parameters: {
    docs: {
      description: {
        component:
          "Composition slots inherit the native props of their rendered element, including `children`, `className`, `style`, `id`, event handlers and ARIA attributes. They add spacing and typography; no extra state is required.\n\n| Component | Native props | Purpose |\n| --- | --- | --- |\n| CardHeader | `ComponentProps<'header'>` | Heading and supporting content |\n| CardTitle | `ComponentProps<'h3'>` | Surface heading |\n| CardDescription | `ComponentProps<'p'>` | Supporting text |\n| CardContent | `ComponentProps<'div'>` | Main content |\n| CardFooter | `ComponentProps<'footer'>` | Metadata and actions |\n",
      },
    },
  },
  tags: ['autodocs'],
  args: { elevation: 'raised' },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Elevations: Story = {
  render: () => (
    <div className="story-grid">
      {(['flat', 'raised', 'floating'] as const).map((elevation) => (
        <Card key={elevation} elevation={elevation}>
          <CardHeader>
            <div
              className="row"
              style={{ color: 'var(--color-success-fg)', marginBottom: 'var(--space-2)' }}
            >
              <ShieldCheck size={20} />
              <span>Detection coverage</span>
            </div>
            <CardTitle>{elevation[0].toUpperCase() + elevation.slice(1)} surface</CardTitle>
            <CardDescription>Identity threat monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              98.4<span style={{ fontSize: 'var(--text-md)' }}>%</span>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>
              126 active rules protect 4,812 identities.
            </p>
          </CardContent>
          <CardFooter>
            <span className="row muted">
              <Clock3 size={14} /> Evaluated 2 minutes ago
            </span>
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
};
export const InvestigationSummary: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: 440 }}>
      <CardHeader>
        <CardTitle>Encoded PowerShell on WS-ATH-114</CardTitle>
        <CardDescription>Execution · MITRE ATT&amp;CK T1059.001</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          A signed Office process launched PowerShell with an encoded command. Investigate the
          parent process before isolating this endpoint.
        </p>
        <code style={{ fontSize: 'var(--text-xs)' }}>WINWORD.EXE → powershell.exe -enc</code>
      </CardContent>
      <CardFooter>
        <span className="muted">Assigned to Eleni Papadopoulos</span>
      </CardFooter>
    </Card>
  ),
};
