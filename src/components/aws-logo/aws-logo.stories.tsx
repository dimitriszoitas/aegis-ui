import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AwsLogo, AwsLogoCatalog, type AwsLogoName } from './aws-logo';
const meta = {
  title: 'Components/Brand/AWS logos',
  component: AwsLogo,
  subcomponents: { AwsLogoCatalog },
  tags: ['autodocs'],
  args: { name: 'service-amazon-ec2', size: 48 },
  parameters: {
    docs: {
      description: {
        component:
          'Official AWS architecture symbols from the July 2026 package. The catalog contains 810 distinct symbols with 49 additional official dark variants. All SVG artwork retains its original paths and colors; frames are square with rounded corners. Import AwsLogo and pass a typed name from the catalog. Decorative logos omit duplicate accessible labels.',
      },
    },
  },
} satisfies Meta<typeof AwsLogo>;
export default meta;
export const Catalog: StoryObj<typeof meta> = {
  render: () => <AwsLogoCatalog />,
  parameters: { layout: 'padded' },
};
export const ServiceSizes: StoryObj<typeof meta> = {
  render: () => (
    <div className="stack">
      {(
        [
          'service-amazon-ec2',
          'service-aws-lambda',
          'service-amazon-simple-storage-service',
          'service-amazon-guardduty',
        ] satisfies AwsLogoName[]
      ).map((name) => (
        <div key={name} className="row">
          {([24, 32, 40, 48, 64, 80] as const).map((size) => (
            <AwsLogo key={size} name={name} size={size} />
          ))}
          <code>{name}</code>
        </div>
      ))}
    </div>
  ),
};
export const Resources: StoryObj<typeof meta> = {
  render: () => <AwsLogoCatalog initialKind="resource" pageSize={24} />,
};
export const SearchAndSelect: StoryObj<typeof meta> = {
  render: () => <AwsLogoCatalog pageSize={24} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole('searchbox', { name: 'Search AWS logos' });
    await userEvent.type(search, 'lambda');
    await expect(
      canvas.getByRole('button', { name: 'Select AWS Lambda, Compute service logo' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Select AWS Lambda, Compute service logo' }),
    );
    await expect(canvas.getByText('service-aws-lambda', { exact: true })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Download SVG' })).toHaveAttribute(
      'download',
      'service-aws-lambda.svg',
    );
    await userEvent.clear(search);
    await userEvent.type(search, 'no matching aws logo');
    await expect(canvas.getByRole('heading', { name: 'No AWS logos match' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(search).toHaveFocus();
    await expect(canvas.getByText('810 logos found', { exact: true })).toBeVisible();
  },
};
