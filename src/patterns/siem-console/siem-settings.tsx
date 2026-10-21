import { useState, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/card';
import { Button } from '@/components/button';
import { Modal } from '@/components/modal';
import { TextInput } from '@/components/text-input';
import { Select } from '@/components/select';
import { Switch } from '@/components/switch';
import { DataGrid } from '@/components/data-grid';
import { Avatar } from '@/components/avatar';
import { Tag } from '@/components/tag';
import { analysts } from '@/sample-data';
import './siem-settings.css';
const sections = [
  'Environment',
  'Detection rules',
  'Datasources',
  'Alerts',
  'System errors',
  'Appearance',
];
type Folder = { id: string; name: string; purpose: string; permission: string };
export function SiemSettings({
  appearance,
  bottomOpen,
  onBottomOpenChange,
  aiOpen,
  onAiOpenChange,
}: {
  appearance: ReactNode;
  bottomOpen: boolean;
  onBottomOpenChange: (open: boolean) => void;
  aiOpen: boolean;
  onAiOpenChange: (open: boolean) => void;
}) {
  const [section, setSection] = useState('Environment');
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: 'detection',
      name: 'detection',
      purpose: 'Detection rules',
      permission: 'Analysts: edit',
    },
    {
      id: 'datasources',
      name: 'datasources',
      purpose: 'Datasources',
      permission: 'Administrators: manage',
    },
  ]);
  const [environments, setEnvironments] = useState(['main']);
  const [dialog, setDialog] = useState<'environment' | 'folder' | 'edit' | null>(null);
  const [editing, setEditing] = useState<string>();
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('Detection rules');
  const [permission, setPermission] = useState('Analysts: edit');
  const [notice, setNotice] = useState('');
  const [settings, setSettings] = useState<Record<string, boolean>>({
    'Enable new detection rules': true,
    'Deduplicate related signals': true,
    'Retry failed ingestion': true,
    'Retain original records': false,
    'Notify on critical alerts': true,
    'Auto-assign to the current analyst': false,
    'Notify on processing errors': true,
    'Group repeated errors': true,
  });
  const [schedule, setSchedule] = useState('10m');
  const [retention, setRetention] = useState('30');
  const names =
    section === 'Detection rules'
      ? ['Enable new detection rules', 'Deduplicate related signals']
      : section === 'Datasources'
        ? ['Retry failed ingestion', 'Retain original records']
        : section === 'Alerts'
          ? ['Notify on critical alerts', 'Auto-assign to the current analyst']
          : ['Notify on processing errors', 'Group repeated errors'];
  function open(kind: 'environment' | 'folder' | 'edit', folder?: Folder) {
    setDialog(kind);
    setName(folder?.name ?? '');
    setPurpose(folder?.purpose ?? 'Detection rules');
    setPermission(folder?.permission ?? 'Analysts: edit');
    setEditing(folder?.id);
  }
  const duplicate =
    dialog === 'environment'
      ? environments.includes(name.trim())
      : folders.some((f) => f.name === name.trim() && f.id !== editing);
  function save() {
    if (!name.trim() || duplicate) return;
    if (dialog === 'environment') {
      setEnvironments([...environments, name.trim()]);
      setNotice(`Environment ${name.trim()} created in this local session.`);
    } else {
      const folder = { id: editing ?? crypto.randomUUID(), name: name.trim(), purpose, permission };
      setFolders(
        editing ? folders.map((f) => (f.id === editing ? folder : f)) : [...folders, folder],
      );
      setNotice(`Folder ${name.trim()} saved.`);
    }
    setDialog(null);
  }
  return (
    <div className="siem-settings">
      <nav aria-label="Settings sections" className="siem-settings-nav">
        {sections.map((item) => (
          <button
            key={item}
            type="button"
            aria-current={section === item ? 'page' : undefined}
            onClick={() => {
              setSection(item);
              setNotice('');
            }}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="siem-settings-content">
        <div className="siem-section-heading">
          <div>
            <h2>{section}</h2>
            <p>
              {section === 'Environment'
                ? 'Manage your environments, folders, and access to security resources.'
                : 'Configure the defaults for this workspace.'}
            </p>
          </div>
          {section === 'Environment' && (
            <Button emphasis="secondary" onClick={() => open('environment')}>
              Create environment
            </Button>
          )}
        </div>
        {notice && (
          <p role="status" className="siem-settings-notice">
            {notice}
          </p>
        )}
        {section === 'Environment' ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <p className="muted">
                  An environment scopes the datasources and detection rules available to this
                  workspace.
                </p>
                <dl className="siem-settings-details">
                  <dt>Backing catalog</dt>
                  <dd>main</dd>
                  <dt>Workspace</dt>
                  <dd>Northstar</dd>
                  <dt>Environments</dt>
                  <dd>
                    {environments.map((e) => (
                      <Tag key={e}>{e}</Tag>
                    ))}
                  </dd>
                </dl>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Folders</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <p className="muted">
                  Organize security resources into folders. Folder permissions apply to the
                  resources they contain.
                </p>
                <div>
                  <Button onClick={() => open('folder')}>Add folder</Button>
                </div>
                <DataGrid
                  label="Environment folders"
                  noun="folders"
                  data={folders}
                  getRowId={(f) => f.id}
                  enableSelection={false}
                  pagination={false}
                  height="auto"
                  columns={[
                    { accessorKey: 'name', header: 'Folder', size: 180 },
                    { accessorKey: 'purpose', header: 'Default for', size: 200 },
                    { accessorKey: 'permission', header: 'Permissions', size: 240 },
                    {
                      id: 'actions',
                      header: 'Actions',
                      size: 100,
                      cell: ({ row }) => (
                        <Button
                          emphasis="ghost"
                          size="sm"
                          aria-label={`Edit ${row.original.name} folder`}
                          onClick={() => open('edit', row.original)}
                        >
                          Edit
                        </Button>
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Environment administrators</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="muted">
                  Administrators manage environments, folders, datasources, and detection rules.
                </p>
                <div className="siem-settings-admins">
                  {analysts.slice(0, 2).map((a) => (
                    <div key={a.id}>
                      <Avatar name={a.name} initials={a.initials} size="sm" />
                      <div className="siem-cell-copy">
                        <strong>{a.name}</strong>
                        <span>{a.role}</span>
                      </div>
                      <Tag>Administrator</Tag>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : section === 'Appearance' ? (
          <>
            {appearance}
            <Card>
              <CardHeader>
                <CardTitle>Workspace panels</CardTitle>
              </CardHeader>
              <CardContent className="stack">
                <Switch
                  label="Investigation queue"
                  description="Show the bottom panel with selected alerts and recent evidence."
                  checked={bottomOpen}
                  onCheckedChange={onBottomOpenChange}
                />
                <Switch
                  label="Genie assistant panel"
                  description="Keep Genie alongside the workspace for investigation help."
                  checked={aiOpen}
                  onCheckedChange={onAiOpenChange}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{section} defaults</CardTitle>
            </CardHeader>
            <CardContent className="stack">
              {names.map((label) => (
                <Switch
                  key={label}
                  label={label}
                  checked={settings[label]}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, [label]: checked });
                    setNotice('Preferences saved for this session.');
                  }}
                />
              ))}
              {section === 'Detection rules' && (
                <Select
                  label="Default schedule"
                  value={schedule}
                  onValueChange={(v) => {
                    setSchedule(v);
                    setNotice('Default schedule saved for this session.');
                  }}
                  options={[
                    { value: '5m', label: 'Every 5 minutes' },
                    { value: '10m', label: 'Every 10 minutes' },
                    { value: '1h', label: 'Every hour' },
                  ]}
                />
              )}
              {section === 'Datasources' && (
                <Select
                  label="Record retention"
                  value={retention}
                  onValueChange={(v) => {
                    setRetention(v);
                    setNotice('Retention preference saved for this session.');
                  }}
                  options={[
                    { value: '7', label: '7 days' },
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                  ]}
                />
              )}
              <p className="muted">
                These preferences are stored in this local example for the current session.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <Modal
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title={
          dialog === 'environment'
            ? 'Create environment'
            : dialog === 'edit'
              ? 'Edit folder'
              : 'Add folder'
        }
        description="Changes are available in this local session."
        footer={
          <>
            <Button emphasis="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!name.trim() || duplicate}>
              Save
            </Button>
          </>
        }
      >
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <TextInput
            label={dialog === 'environment' ? 'Environment name' : 'Folder name'}
            value={name}
            onValueChange={setName}
            required
            invalid={duplicate}
          />
          {duplicate && <p role="alert">This name is already in use.</p>}
          {dialog !== 'environment' && (
            <>
              <Select
                label="Default for"
                value={purpose}
                onValueChange={setPurpose}
                options={['Detection rules', 'Datasources', 'Shared content'].map((value) => ({
                  value,
                  label: value,
                }))}
              />
              <Select
                label="Permissions"
                value={permission}
                onValueChange={setPermission}
                options={['Analysts: edit', 'Analysts: view', 'Administrators: manage'].map(
                  (value) => ({ value, label: value }),
                )}
              />
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
