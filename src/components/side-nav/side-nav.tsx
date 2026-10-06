import { useState, type ReactNode } from 'react';
import { Shield, PanelLeftClose, PanelLeftOpen, Search, ChevronDown } from 'lucide-react';
import { IconButton } from '@/components/icon-button';
import { CountBadge } from '@/components/count-badge';
import { DropdownMenu } from '@/components/dropdown-menu';
import { Tooltip } from '@/components/tooltip';
import { Kbd } from '@/components/kbd';
import { cn } from '@/lib/utils';
import './side-nav.css';
export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  count?: number;
  children?: NavItem[];
}
export interface NavSection {
  label?: string;
  items: NavItem[];
}
export interface SideNavProps {
  sections: NavSection[];
  activeId: string;
  onNavigate: (id: string) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onSearch?: () => void;
  footer?: ReactNode | ((collapsed: boolean) => ReactNode);
  workspace?: string;
  className?: string;
}
export function SideNav({
  sections,
  activeId,
  onNavigate,
  collapsed: controlled,
  defaultCollapsed = false,
  onCollapsedChange,
  onSearch,
  footer,
  workspace = 'Northstar',
  className,
}: SideNavProps) {
  const [internal, setInternal] = useState(defaultCollapsed);
  const collapsed = controlled ?? internal;
  const [expanded, setExpanded] = useState<string[]>([]);
  function toggle() {
    setInternal(!collapsed);
    onCollapsedChange?.(!collapsed);
  }
  function renderItem(item: NavItem, nested = false) {
    if (item.children?.length && collapsed)
      return (
        <DropdownMenu
          key={item.id}
          side="right"
          trigger={
            <button className="nav-item nav-icon" aria-label={item.label}>
              {item.icon}
            </button>
          }
          items={item.children.map((child) => ({
            id: child.id,
            label: child.label,
            icon: child.icon,
            onSelect: () => onNavigate(child.id),
          }))}
        />
      );
    const button = (
      <button
        className={cn(
          'nav-item',
          nested && 'nav-nested-item',
          activeId === item.id && 'is-active',
          collapsed && 'nav-icon',
        )}
        aria-label={collapsed ? item.label : undefined}
        aria-current={activeId === item.id ? 'page' : undefined}
        aria-expanded={item.children ? expanded.includes(item.id) : undefined}
        onClick={() =>
          item.children
            ? setExpanded((prev) =>
                prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
              )
            : onNavigate(item.id)
        }
      >
        {item.icon}
        {!collapsed && (
          <>
            <span>{item.label}</span>
            {item.count !== undefined && <CountBadge count={item.count} />}{' '}
            {item.children && (
              <ChevronDown
                size={14}
                style={{ transform: expanded.includes(item.id) ? 'rotate(180deg)' : undefined }}
              />
            )}
          </>
        )}
      </button>
    );
    return (
      <div key={item.id}>
        {collapsed ? <Tooltip content={item.label}>{button}</Tooltip> : button}
        {item.children && !collapsed && expanded.includes(item.id) && (
          <div className="nav-nested">{item.children.map((child) => renderItem(child, true))}</div>
        )}
      </div>
    );
  }
  return (
    <nav
      className={cn('side-nav', className)}
      data-collapsed={collapsed}
      aria-label="Main navigation"
    >
      <div className="nav-brand">
        {!collapsed && (
          <span className="nav-mark">
            <Shield size={22} strokeWidth={1.6} />
          </span>
        )}
        {!collapsed && <strong>Aegis</strong>}
        <IconButton
          key="navigation-toggle"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          size="sm"
          emphasis="ghost"
          onClick={toggle}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </IconButton>
      </div>
      {!collapsed && (
        <div className="nav-workspace">
          <span className="workspace-avatar">N</span>
          <div>
            <strong>{workspace}</strong>
            <span>Security workspace</span>
          </div>
          <span className="workspace-status" role="img" aria-label="All systems connected" />
        </div>
      )}
      <button
        className={cn('nav-search', collapsed && 'nav-icon')}
        aria-label="Search workspace"
        onClick={onSearch}
      >
        <Search size={16} />
        {!collapsed && (
          <>
            <span>Search workspace</span>
            <Kbd>⌘K</Kbd>
          </>
        )}
      </button>
      <div className="nav-sections">
        {sections.map((section, index) => (
          <section key={section.label ?? index}>
            {section.label && !collapsed && <h2 className="nav-section-label">{section.label}</h2>}
            <div className="nav-items">{section.items.map((item) => renderItem(item))}</div>
          </section>
        ))}
      </div>
      <div className="nav-footer">{typeof footer === 'function' ? footer(collapsed) : footer}</div>
    </nav>
  );
}
