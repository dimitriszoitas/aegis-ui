import { HugeiconsIcon } from '@hugeicons/react';
import { SlackIcon } from '@hugeicons/core-free-icons';
import amazonS3 from '@/components/aws-logo/assets/service-amazon-simple-storage-service.svg?url';
import cloudWatch from '@/components/aws-logo/assets/service-amazon-cloudwatch.svg?url';
import azureEventHubs from './assets/azure-event-hubs.svg?url';
import workday from './assets/workday.ico?url';
import type { DatasourceProvider } from './console-datasources-data';
import type { CSSProperties } from 'react';

const providerArtwork: Record<DatasourceProvider, string | null> = {
  'Amazon S3': amazonS3,
  'Slack API': null,
  CloudWatch: cloudWatch,
  'Workday API': workday,
  'Azure Event Hub': azureEventHubs,
};

export interface DatasourceProviderIconProps {
  provider: DatasourceProvider;
  size?: 16 | 24;
}

/** Keeps the provider identity accessible without a second line of cell text. */
export function DatasourceProviderIcon({ provider, size = 24 }: DatasourceProviderIconProps) {
  const artwork = providerArtwork[provider];
  return (
    <span
      className="aegis-datasource-provider-icon"
      style={{ '--datasource-provider-size': `${size}px` } as CSSProperties}
      data-provider={provider}
      role="img"
      aria-label={provider}
      title={provider}
    >
      {artwork ? (
        <img src={artwork} alt="" width={size} height={size} draggable={false} />
      ) : (
        <HugeiconsIcon icon={SlackIcon} size={size} strokeWidth={1.8} aria-hidden="true" />
      )}
    </span>
  );
}
