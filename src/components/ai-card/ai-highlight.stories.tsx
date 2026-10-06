import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiHighlight } from './ai-card';
const meta = {
  title: 'Components/AI/AiHighlight',
  component: AiHighlight,
  tags: ['autodocs'],
} satisfies Meta<typeof AiHighlight>;
export default meta;
export const InvestigationNote: StoryObj<typeof meta> = {
  args: {
    confidence: 'medium',
    provenance: 'Identity evidence · ALR-1048',
    children: (
      <>
        Verify whether <strong>k.nakamura</strong> was traveling or using an approved VPN before
        escalating the sign-in alert.
      </>
    ),
  },
};
export const RuleReview: StoryObj<typeof meta> = {
  args: {
    provenance: 'Proposed condition · DET-0114',
    children: (
      <>
        An Office parent condition may reduce noise from managed automation. Compare historical
        matches before approving the proposed rule.
      </>
    ),
  },
};
