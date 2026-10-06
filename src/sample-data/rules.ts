import type { DetectionRule } from './types';
export const rules: DetectionRule[] = [
  {
    id: 'DET-0042',
    name: 'Impossible travel between successful sign-ins',
    description: 'Identifies successful logins separated by implausible geographic travel.',
    source: 'Identity',
    technique: 'T1078',
    yaml: `title: Impossible travel between successful sign-ins
id: 92bb689d-83cb-4a20-9bba-d5889afc7a42
status: experimental
description: Detects geographically inconsistent sign-ins using enriched travel velocity.
author: Northstar detection engineering
date: 2026-09-18
logsource:
  product: azure
  service: signinlogs
detection:
  selection:
    ResultType: 0
    RiskEventTypes|contains: unlikelyTravel
  filter_trusted_egress:
    NetworkLocationDetails|contains: corporate-vpn
  condition: selection and not filter_trusted_egress
fields:
  - UserPrincipalName
  - IPAddress
  - Location
  - DeviceDetail
falsepositives:
  - Approved travel with rapid VPN egress changes
level: high
tags:
  - attack.defense_evasion
  - attack.t1078
`,
  },
  {
    id: 'DET-0081',
    name: 'Repeated authentication failures against OWA',
    description: 'Identifies failed OWA sign-ins for correlation by source address and account.',
    source: 'Identity',
    technique: 'T1110',
    yaml: `title: Repeated authentication failures against OWA
id: f3143bae-59a0-4489-8fa9-f117e55930c5
status: test
description: Detects concentrated authentication failures against Outlook Web Access.
author: Northstar detection engineering
date: 2026-09-21
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4625
    LogonType: 3
    TargetServerName|startswith: OWA-
  condition: selection
fields:
  - TargetUserName
  - IpAddress
  - TargetServerName
falsepositives:
  - Expired credentials in a managed mail client
level: high
tags:
  - attack.credential_access
  - attack.t1110
`,
  },
  {
    id: 'DET-0114',
    name: 'Encoded PowerShell execution',
    description: 'Detects encoded commands launched by PowerShell outside approved automation.',
    source: 'EDR',
    technique: 'T1059.001',
    yaml: `title: Encoded PowerShell execution
id: 140eac3e-f148-4c37-b11a-3eb03f9dd754
status: stable
description: Detects encoded PowerShell execution from interactive or untrusted parents.
author: Northstar detection engineering
date: 2026-09-26
logsource:
  category: process_creation
  product: windows
detection:
  selection_image:
    Image|endswith:
      - '\\powershell.exe'
      - '\\pwsh.exe'
  selection_encoded:
    CommandLine|contains:
      - ' -EncodedCommand '
      - ' -enc '
      - ' -e '
  filter_automation:
    ParentImage|endswith: '\\NorthstarAgent.exe'
  condition: all of selection_* and not filter_automation
fields:
  - Computer
  - User
  - CommandLine
  - ParentImage
falsepositives:
  - Approved endpoint administration scripts
level: high
tags:
  - attack.execution
  - attack.t1059.001
`,
  },
  {
    id: 'DET-0137',
    name: 'High-entropy DNS queries',
    description: 'Detects unusually long DNS subdomains associated with covert data transfer.',
    source: 'DNS',
    technique: 'T1071.004',
    yaml: `title: High-entropy DNS queries
id: 7c562971-e152-41ea-9a78-76a4fd66d977
status: experimental
description: Detects high-entropy DNS query labels using resolver enrichment.
author: Northstar detection engineering
date: 2026-10-01
logsource:
  category: dns
  product: zeek
detection:
  selection:
    query_length|gte: 80
    subdomain_entropy|gte: 4.2
    qtype_name:
      - TXT
      - 'NULL'
  filter_internal:
    query|endswith: '.northstar.internal'
  condition: selection and not filter_internal
fields:
  - id.orig_h
  - query
  - qtype_name
  - answers
falsepositives:
  - DNS-based security telemetry and domain validation
level: medium
tags:
  - attack.command_and_control
  - attack.t1071.004
`,
  },
  {
    id: 'DET-0162',
    name: 'Unusual bulk upload to cloud storage',
    description: 'Detects atypical outbound data volume to an unsanctioned storage service.',
    source: 'Firewall',
    technique: 'T1567',
    yaml: `title: Unusual bulk upload to cloud storage
id: aaee74fd-5d23-40f3-af7b-56cc4a649b10
status: test
description: Detects elevated data transfer to storage destinations outside the approved tenant.
author: Northstar detection engineering
date: 2026-10-02
logsource:
  category: proxy
detection:
  selection:
    http_method:
      - POST
      - PUT
    bytes_sent|gte: 104857600
    destination_category: cloud-storage
  filter_approved:
    tenant_id: northstar-managed
  condition: selection and not filter_approved
fields:
  - user
  - src_ip
  - dest_host
  - bytes_sent
falsepositives:
  - Approved third-party file delivery
level: critical
tags:
  - attack.exfiltration
  - attack.t1567
`,
  },
  {
    id: 'DET-0186',
    name: 'Repeated multifactor authentication denials',
    description:
      'Detects repeated denied authentication prompts reported by the identity provider.',
    source: 'Identity',
    technique: 'T1621',
    yaml: `title: Repeated multifactor authentication denials
id: 832ec7a1-7418-4e70-9a29-4eac1f548186
status: test
description: Detects identity-provider risk signals for repeated denied authentication prompts.
author: Northstar detection engineering
date: 2026-10-02
logsource:
  product: azure
  service: signinlogs
detection:
  selection:
    RiskEventTypes|contains: mfaFatigue
    AuthenticationRequirement: multiFactorAuthentication
  condition: selection
falsepositives:
  - A user repeatedly retrying an interrupted sign-in
level: high
tags:
  - attack.credential_access
  - attack.t1621
`,
  },
  {
    id: 'DET-0194',
    name: 'Suspicious Windows service creation',
    description: 'Detects a new Windows service that invokes PowerShell.',
    source: 'EDR',
    technique: 'T1543.003',
    yaml: `title: Suspicious Windows service creation
id: 6ebc3b68-a0cd-4935-bb16-1de0ea1b9194
status: test
description: Detects service installation with a PowerShell command as its image path.
author: Northstar detection engineering
date: 2026-10-02
logsource:
  product: windows
  service: system
detection:
  selection:
    EventID: 7045
    ImagePath|contains: powershell
  condition: selection
fields:
  - Computer
  - ServiceName
  - ImagePath
falsepositives:
  - Approved service deployment by an administrator
level: high
tags:
  - attack.persistence
  - attack.t1543.003
`,
  },
  {
    id: 'DET-0208',
    name: 'Repeated denied OWA connections',
    description: 'Detects a firewall correlation signal for repeated denied connections to OWA.',
    source: 'Firewall',
    technique: 'T1110',
    yaml: `title: Repeated denied OWA connections
id: 49d22dcc-7a58-4af7-bf14-19071b67a208
status: experimental
description: Detects a firewall correlation signal requiring authentication-log review.
author: Northstar detection engineering
date: 2026-10-03
logsource:
  category: firewall
detection:
  selection:
    event_action: deny
    application: outlook-web-access
    denied_connection_count|gte: 20
  condition: selection
falsepositives:
  - Misconfigured mail client connection retries
level: medium
tags:
  - attack.credential_access
  - attack.t1110
`,
  },
  {
    id: 'DET-0216',
    name: 'Successful sign-in from a new location',
    description: 'Detects a successful sign-in with a new-location risk signal.',
    source: 'Identity',
    technique: 'T1078',
    yaml: `title: Successful sign-in from a new location
id: 4817c0af-384b-493b-9ef7-153ad56e3216
status: test
description: Identifies unfamiliar location signals for analyst review.
author: Northstar detection engineering
date: 2026-10-03
logsource:
  product: azure
  service: signinlogs
detection:
  selection:
    ResultType: 0
    RiskEventTypes|contains: unfamiliarLocation
  condition: selection
falsepositives:
  - Approved travel or new VPN exit locations
level: low
tags:
  - attack.defense_evasion
  - attack.t1078
`,
  },
  {
    id: 'DET-0228',
    name: 'New device registered to a workforce identity',
    description: 'Tracks successful device registration for identity audit and correlation.',
    source: 'Identity',
    technique: 'T1098.005',
    yaml: `title: New device registered to a workforce identity
id: 741902f7-8139-4f98-9d54-194e4a8aa228
status: test
description: Records device-registration activity for identity audit and correlation.
author: Northstar detection engineering
date: 2026-10-03
logsource:
  product: azure
  service: auditlogs
detection:
  selection:
    OperationName: Add device
    Result: success
  condition: selection
falsepositives:
  - Expected device enrollment by an employee
level: informational
tags:
  - attack.persistence
  - attack.t1098.005
`,
  },
];
export const proposedPowerShellRule = rules[2].yaml
  .replace(
    '  filter_automation:\n',
    "  selection_parent:\n    ParentImage|endswith:\n      - '\\winword.exe'\n      - '\\excel.exe'\n      - '\\outlook.exe'\n  filter_automation:\n",
  )
  .replace('level: high', 'level: critical');
