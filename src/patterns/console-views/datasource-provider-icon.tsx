import { HugeiconsIcon } from '@hugeicons/react';
import { SlackIcon } from '@hugeicons/core-free-icons';
import amazonS3 from '@/components/aws-logo/assets/service-amazon-simple-storage-service.svg?url';
import cloudWatch from '@/components/aws-logo/assets/service-amazon-cloudwatch.svg?url';
import azureEventHubs from './assets/azure-event-hubs.svg?url';
import workday from './assets/workday.ico?url';
import type { DatasourceProvider } from './console-datasources-data';

const providerArtwork: Record<DatasourceProvider, string | null> = {
  'Amazon S3': amazonS3,
  'Slack API': null,
  CloudWatch: cloudWatch,
  'Workday API': workday,
  'Azure Event Hub': azureEventHubs,
};

export interface DatasourceProviderIconProps {
  provider: DatasourceProvider;
}

/** Keeps the provider identity accessible without a second line of cell text. */
export function DatasourceProviderIcon({ provider }: DatasourceProviderIconProps) {
  const artwork = providerArtwork[provider];
  return (
    <span
      className="aegis-datasource-provider-icon"
      data-provider={provider}
      role="img"
      aria-label={provider}
      title={provider}
    >
      {artwork ? (
        <img src={artwork} alt="" width={24} height={24} draggable={false} />
      ) : (
        <HugeiconsIcon icon={SlackIcon} size={24} strokeWidth={1.8} aria-hidden="true" />
      )}
    </span>
  );
}
