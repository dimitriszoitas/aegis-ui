import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnSizingState,
  type ExpandedState,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Columns3,
  GripVertical,
  RotateCcw,
  X,
} from 'lucide-react';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { DropdownMenu, type DropdownMenuEntry } from '../dropdown-menu';
import { EmptyState } from '../empty-state';
import { Pagination } from '../pagination';
import { Skeleton } from '../skeleton';
import { clampColumnWidth, estimateColumnWidth, getSafePageIndex } from '../../lib/table';
import { cn } from '../../lib/utils';
import './data-grid.css';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human-readable name for column settings and resize announcements. */
    label?: string;
    align?: 'left' | 'center' | 'right';
    cellClassName?: string;
    /** Plain text used when autosizing a custom-rendered cell. */
    getText?: (row: TData, value: TValue) => string;
  }
}

export type GridDensity = 'compact' | 'default' | 'comfortable';
export interface GridColumnSetting {
  id: string;
  label: string;
  visible: boolean;
  hideable: boolean;
}
export interface DataGridToolbarApi {
  density: GridDensity;
  setDensity: (density: GridDensity) => void;
  columns: GridColumnSetting[];
  setColumnVisibility: (id: string, visible: boolean) => void;
}
export interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  label?: string;
  rowLabel?: (row: T) => string;
  density?: GridDensity;
  onDensityChange?: (density: GridDensity) => void;
  enableSelection?: boolean;
  selectedRowIds?: string[];
  defaultSelectedRowIds?: string[];
  onSelectedRowsChange?: (ids: string[], rows: T[]) => void;
  onRowClick?: (row: T) => void;
  renderExpandedRow?: (row: T) => ReactNode;
  canExpandRow?: (row: T) => boolean;
  defaultExpandedRowIds?: string[];
  renderToolbar?: (api: DataGridToolbarApi) => ReactNode;
  renderBulkActions?: (selected: T[], clear: () => void) => ReactNode;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  pagination?: boolean;
  pageSize?: number;
  virtualize?: boolean;
  height?: number | string;
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  className?: string;
}

const rowHeights: Record<GridDensity, number> = { compact: 36, default: 48, comfortable: 60 };
const selectionColumnId = '__aegis_selection';
const expansionColumnId = '__aegis_expansion';
const isInteractive = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest(
    'button, a, input, select, textarea, [role="checkbox"], [role="button"], [contenteditable="true"]',
  );
const columnLabel = <T,>(column: Column<T>) =>
  column.columnDef.meta?.label ??
  (typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id);
const selectionFromIds = (ids: readonly string[]): RowSelectionState =>
  Object.fromEntries(ids.map((id) => [id, true]));

export function DataGrid<T>({
  data,
  columns,
  getRowId,
  label = 'Security alerts',
  rowLabel,
  density: controlledDensity,
  onDensityChange,
  enableSelection = true,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectedRowsChange,
  onRowClick,
  renderExpandedRow,
  canExpandRow,
  defaultExpandedRowIds = [],
  renderToolbar,
  renderBulkActions,
  loading = false,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  pagination = true,
  pageSize = 25,
  virtualize,
  height = 520,
  initialSorting = [],
  initialColumnVisibility = {},
  className,
}: DataGridProps<T>) {
  const id = useId();
  const instructionsId = `${id}-instructions`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowElements = useRef(new Map<string, HTMLTableRowElement>());
  const pendingFocus = useRef<string | null>(null);
  const [internalDensity, setInternalDensity] = useState<GridDensity>('default');
  const density = controlledDensity ?? internalDensity;
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(initialColumnVisibility);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>(() =>
    selectionFromIds(defaultSelectedRowIds),
  );
  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    selectionFromIds(defaultExpandedRowIds),
  );
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: Math.max(1, pageSize),
  });
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const rowSelection = useMemo(
    () => (selectedRowIds ? selectionFromIds(selectedRowIds) : internalSelection),
    [selectedRowIds, internalSelection],
  );
  const safePagination = {
    ...paginationState,
    pageIndex: getSafePageIndex(paginationState.pageIndex, data.length, paginationState.pageSize),
  };
  const allColumns = useMemo<ColumnDef<T>[]>(
    () => [
      ...(enableSelection
        ? [
            {
              id: selectionColumnId,
              size: 44,
              minSize: 44,
              maxSize: 44,
              enableResizing: false,
              enableSorting: false,
              enableHiding: false,
              header: 'Select',
              meta: { label: 'Selection' },
            } satisfies ColumnDef<T>,
          ]
        : []),
      ...(renderExpandedRow
        ? [
            {
              id: expansionColumnId,
              size: 36,
              minSize: 36,
              maxSize: 36,
              enableResizing: false,
              enableSorting: false,
              enableHiding: false,
              header: 'Expand',
              meta: { label: 'Expansion' },
            } satisfies ColumnDef<T>,
          ]
        : []),
      ...columns,
    ],
    [columns, enableSelection, renderExpandedRow],
  );
  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    state: {
      sorting,
      columnVisibility,
      columnSizing,
      rowSelection,
      expanded,
      pagination: safePagination,
    },
    defaultColumn: { size: 180, minSize: 72, maxSize: 640 },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    onPaginationChange: (updater) =>
      setPaginationState((current) =>
        functionalUpdate(updater, {
          ...current,
          pageIndex: getSafePageIndex(current.pageIndex, data.length, current.pageSize),
        }),
      ),
    onRowSelectionChange: (updater) => {
      const next = functionalUpdate(updater, rowSelection);
      if (selectedRowIds === undefined) setInternalSelection(next);
      const ids = Object.keys(next).filter((key) => next[key]);
      onSelectedRowsChange?.(
        ids,
        data.filter((row) => next[getRowId(row)]),
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getRowCanExpand: (row) => !!renderExpandedRow && (canExpandRow?.(row.original) ?? true),
    enableRowSelection: enableSelection,
    enableMultiSort: true,
    enableSortingRemoval: true,
    columnResizeMode: 'onChange',
    autoResetPageIndex: false,
  });
  const rows = table.getRowModel().rows;
  const entries = useMemo(
    () =>
      rows.flatMap((row) => [
        { row, detail: false },
        ...((expanded === true || expanded[row.id]) &&
        renderExpandedRow &&
        (canExpandRow?.(row.original) ?? true)
          ? [{ row, detail: true }]
          : []),
      ]),
    [rows, expanded, renderExpandedRow, canExpandRow],
  );
  const shouldVirtualize =
    (virtualize ?? data.length > 200) && entries.length > 0 && !loading && !error;
  const headerHeight = table.getHeaderGroups().length * 40;
  const estimateSize = useCallback(
    (index: number) => (entries[index]?.detail ? 180 : rowHeights[density]),
    [entries, density],
  );
  const getItemKey = useCallback(
    (index: number) => `${entries[index]?.row.id}-${entries[index]?.detail ? 'detail' : 'row'}`,
    [entries],
  );
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    getItemKey,
    paddingStart: headerHeight,
    scrollPaddingStart: headerHeight,
    overscan: 8,
    enabled: shouldVirtualize,
  });
  useEffect(() => {
    virtualizer.measure();
    scrollRef.current
      ?.querySelectorAll<HTMLTableRowElement>('tr[data-index]')
      .forEach((element) => virtualizer.measureElement(element));
  }, [density, virtualizer]);
  const virtualRows = shouldVirtualize ? virtualizer.getVirtualItems() : [];
  const visibleEntries = shouldVirtualize
    ? virtualRows.map((item) => ({
        ...entries[item.index],
        index: item.index,
        virtualIndex: item.index,
      }))
    : entries.map((entry, index) => ({ ...entry, index, virtualIndex: undefined }));
  const paddingTop = shouldVirtualize
    ? Math.max(0, (virtualRows[0]?.start ?? 0) - headerHeight)
    : 0;
  const paddingBottom = shouldVirtualize
    ? Math.max(0, virtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0))
    : 0;
  const visibleColumns = table.getVisibleLeafColumns();
  const selected = data.filter((row) => rowSelection[getRowId(row)]);
  const currentFocusedId =
    focusedRowId && rows.some((row) => row.id === focusedRowId) ? focusedRowId : rows[0]?.id;
  function setDensity(next: GridDensity) {
    if (controlledDensity === undefined) setInternalDensity(next);
    onDensityChange?.(next);
  }
  function focusRow(index: number) {
    const row = rows[Math.max(0, Math.min(rows.length - 1, index))];
    if (!row) return;
    setFocusedRowId(row.id);
    pendingFocus.current = row.id;
    const entryIndex = entries.findIndex((entry) => !entry.detail && entry.row.id === row.id);
    if (shouldVirtualize) virtualizer.scrollToIndex(entryIndex, { align: 'auto' });
    requestAnimationFrame(() => {
      const element = rowElements.current.get(row.id);
      if (element) {
        element.focus({ preventScroll: shouldVirtualize });
        pendingFocus.current = null;
      }
    });
  }
  function handleRowKey(event: KeyboardEvent<HTMLTableRowElement>, row: Row<T>) {
    if (event.target !== event.currentTarget) return;
    const index = rows.findIndex((candidate) => candidate.id === row.id);
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      event.preventDefault();
      focusRow(
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? rows.length - 1
            : index + (event.key === 'ArrowDown' ? 1 : -1),
      );
    } else if (event.key === 'Enter' && onRowClick) {
      event.preventDefault();
      onRowClick(row.original);
    } else if (event.key === ' ' && enableSelection) {
      event.preventDefault();
      row.toggleSelected();
    } else if (event.key === 'ArrowRight' && row.getCanExpand()) {
      event.preventDefault();
      row.toggleExpanded(true);
    } else if (event.key === 'ArrowLeft' && row.getCanExpand()) {
      event.preventDefault();
      row.toggleExpanded(false);
    }
  }
  function autosize(column: Column<T>) {
    const values = table
      .getCoreRowModel()
      .flatRows.slice(0, 200)
      .map((row) => {
        const value = row.getValue<unknown>(column.id);
        return (
          column.columnDef.meta?.getText?.(row.original, value) ??
          (value == null ? '' : String(value))
        );
      });
    table.setColumnSizing((current) => ({
      ...current,
      [column.id]: estimateColumnWidth(
        columnLabel(column),
        values,
        column.columnDef.minSize,
        column.columnDef.maxSize,
      ),
    }));
  }
  const dataColumns = table
    .getAllLeafColumns()
    .filter((column) => !column.id.startsWith('__aegis_'));
  const visibleDataColumns = dataColumns.filter((column) => column.getIsVisible());
  const toolbarApi: DataGridToolbarApi = {
    density,
    setDensity,
    columns: dataColumns.map((column) => ({
      id: column.id,
      label: columnLabel(column),
      visible: column.getIsVisible(),
      hideable: column.getCanHide() && (!column.getIsVisible() || visibleDataColumns.length > 1),
    })),
    setColumnVisibility: (columnId, visible) => {
      const column = table.getColumn(columnId);
      if (visible || !column?.getIsVisible() || visibleDataColumns.length > 1)
        column?.toggleVisibility(visible);
    },
  };
  const settingsItems: DropdownMenuEntry[] = [
    {
      type: 'group',
      id: 'columns',
      label: 'Visible columns',
      items: toolbarApi.columns.map((column) => ({
        type: 'checkbox',
        id: column.id,
        label: column.label,
        checked: column.visible,
        disabled: !column.hideable,
        onCheckedChange: (checked) => toolbarApi.setColumnVisibility(column.id, checked),
      })),
    },
    { type: 'separator', id: 'settings-divider' },
    {
      id: 'reset-widths',
      label: 'Reset column widths',
      icon: <RotateCcw size={14} />,
      onSelect: () => table.resetColumnSizing(),
    },
  ];
  return (
    <div
      className={cn('aegis-data-grid', className)}
      data-density={density}
      style={{ '--grid-row-height': `var(--grid-row-${density})` } as CSSProperties}
    >
      <div className="aegis-grid-toolbar">
        {renderToolbar ? (
          renderToolbar(toolbarApi)
        ) : (
          <>
            <div className="aegis-grid-heading">
              <strong>{label}</strong>
              <span>{data.length.toLocaleString()} results</span>
            </div>
            <div className="aegis-grid-tools">
              <div className="aegis-grid-density" role="group" aria-label="Row density">
                {(['compact', 'default', 'comfortable'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={density === value}
                    onClick={() => setDensity(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <DropdownMenu
                trigger={
                  <Button size="sm" emphasis="ghost" leadingIcon={<Columns3 size={15} />}>
                    Columns
                  </Button>
                }
                items={settingsItems}
                label="Grid column settings"
              />
            </div>
          </>
        )}
      </div>
      {sorting.length > 0 && (
        <div className="aegis-grid-sort-summary">
          <span>
            Sorted by{' '}
            {sorting
              .map(
                (sort, index) =>
                  `${index + 1}. ${columnLabel(table.getColumn(sort.id)!)} ${sort.desc ? 'descending' : 'ascending'}`,
              )
              .join(', ')}
          </span>
          <button type="button" onClick={() => setSorting([])}>
            Clear sorting <X size={12} aria-hidden />
          </button>
        </div>
      )}
      <p className="aegis-grid-sr-only" id={instructionsId}>
        Use up and down arrows to move between rows. Press Enter to open a row, Space to select, and
        left or right arrows to collapse or expand details. Hold Shift while sorting to sort by
        multiple columns. Column resize handles use left and right arrows.
      </p>
      <div
        className="aegis-grid-scroll"
        ref={scrollRef}
        style={{ maxHeight: height }}
        tabIndex={0}
        role="region"
        aria-label={`${label} table scroll area`}
      >
        <table
          id={id}
          className="aegis-grid-table"
          role="grid"
          aria-label={label}
          aria-describedby={instructionsId}
          aria-rowcount={
            loading ? -1 : Math.max(1, entries.length) + table.getHeaderGroups().length
          }
          aria-colcount={visibleColumns.length}
          aria-multiselectable={enableSelection || undefined}
          aria-busy={loading || undefined}
          style={{ width: table.getTotalSize(), minWidth: '100%' }}
        >
          <colgroup>
            {visibleColumns.map((column) => (
              <col key={column.id} style={{ width: column.getSize() }} />
            ))}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((group, groupIndex) => (
              <tr key={group.id} role="row" aria-rowindex={groupIndex + 1}>
                {group.headers.map((header, columnIndex) => {
                  const column = header.column;
                  const sorted = column.getIsSorted();
                  const selectedColumn = column.id === selectionColumnId;
                  return (
                    <th
                      key={header.id}
                      role="columnheader"
                      scope="col"
                      aria-colindex={columnIndex + 1}
                      colSpan={header.colSpan}
                      aria-sort={
                        sorted
                          ? sorting.length > 1
                            ? 'other'
                            : sorted === 'asc'
                              ? 'ascending'
                              : 'descending'
                          : undefined
                      }
                      className={cn(
                        selectedColumn && 'aegis-grid-pinned',
                        column.id === expansionColumnId && 'aegis-grid-expand-column',
                      )}
                      style={{
                        width: header.getSize(),
                        textAlign: column.columnDef.meta?.align ?? 'left',
                      }}
                    >
                      {selectedColumn ? (
                        <Checkbox
                          aria-label="Select all rows on this page"
                          checked={
                            table.getIsAllPageRowsSelected()
                              ? true
                              : table.getIsSomePageRowsSelected()
                                ? 'indeterminate'
                                : false
                          }
                          disabled={!rows.length || loading}
                          onCheckedChange={(checked) =>
                            table.toggleAllPageRowsSelected(checked === true)
                          }
                        />
                      ) : column.id === expansionColumnId ? (
                        <span className="aegis-grid-sr-only">Expand details</span>
                      ) : header.isPlaceholder ? null : column.getCanSort() ? (
                        <button
                          type="button"
                          className="aegis-grid-sort-button"
                          onClick={column.getToggleSortingHandler()}
                          title="Shift-click to add a sort column"
                        >
                          {flexRender(column.columnDef.header, header.getContext())}
                          <span className="aegis-grid-sort-icon" aria-hidden>
                            {sorted === 'asc' ? (
                              <ArrowUp size={13} />
                            ) : sorted === 'desc' ? (
                              <ArrowDown size={13} />
                            ) : (
                              <ArrowUpDown size={13} />
                            )}
                            {sorted && sorting.length > 1 && <sup>{column.getSortIndex() + 1}</sup>}
                          </span>
                        </button>
                      ) : (
                        flexRender(column.columnDef.header, header.getContext())
                      )}
                      {column.getCanResize() && (
                        <div
                          role="separator"
                          tabIndex={0}
                          aria-orientation="vertical"
                          aria-label={`Resize ${columnLabel(column)} column`}
                          aria-valuenow={Math.round(column.getSize())}
                          aria-valuemin={column.columnDef.minSize ?? 72}
                          aria-valuemax={column.columnDef.maxSize ?? 640}
                          aria-valuetext={`${Math.round(column.getSize())} pixels`}
                          aria-controls={id}
                          className={cn(
                            'aegis-grid-resize',
                            column.getIsResizing() && 'is-resizing',
                          )}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => autosize(column)}
                          onKeyDown={(event) => {
                            if (
                              !['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(
                                event.key,
                              )
                            )
                              return;
                            event.preventDefault();
                            event.stopPropagation();
                            if (event.key === 'Enter') {
                              autosize(column);
                              return;
                            }
                            const min = column.columnDef.minSize ?? 72;
                            const max = column.columnDef.maxSize ?? 640;
                            const next =
                              event.key === 'Home'
                                ? min
                                : event.key === 'End'
                                  ? max
                                  : column.getSize() +
                                    (event.key === 'ArrowRight' ? 1 : -1) *
                                      (event.shiftKey ? 24 : 8);
                            table.setColumnSizing((current) => ({
                              ...current,
                              [column.id]: clampColumnWidth(next, min, max),
                            }));
                          }}
                        >
                          <GripVertical size={12} aria-hidden />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }, (_, index) => (
                <tr role="row" key={index}>
                  <td role="gridcell" colSpan={visibleColumns.length}>
                    <Skeleton
                      variant="table-row"
                      columns={Math.max(3, visibleColumns.length - 1)}
                      height={rowHeights[density]}
                    />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr role="row">
                <td role="gridcell" colSpan={visibleColumns.length}>
                  <EmptyState
                    preset="error"
                    description={error}
                    action={onRetry && <Button onClick={onRetry}>Try again</Button>}
                  />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr role="row">
                <td role="gridcell" colSpan={visibleColumns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              <>
                {paddingTop > 0 && (
                  <tr aria-hidden="true" className="aegis-grid-spacer">
                    <td colSpan={visibleColumns.length} style={{ height: paddingTop }} />
                  </tr>
                )}
                {visibleEntries.map(({ row, detail, index, virtualIndex }) =>
                  detail ? (
                    <tr
                      key={`${row.id}-detail`}
                      role="row"
                      aria-rowindex={index + table.getHeaderGroups().length + 1}
                      className="aegis-grid-expanded-row"
                      data-index={virtualIndex}
                      ref={shouldVirtualize ? virtualizer.measureElement : undefined}
                    >
                      <td role="gridcell" colSpan={visibleColumns.length}>
                        <div
                          className="aegis-grid-expanded-content"
                          id={`${id}-expanded-${row.id}`}
                        >
                          {renderExpandedRow?.(row.original)}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={row.id}
                      role="row"
                      aria-rowindex={index + table.getHeaderGroups().length + 1}
                      aria-selected={enableSelection ? row.getIsSelected() : undefined}
                      aria-label={rowLabel?.(row.original) ?? `Alert ${row.id}`}
                      tabIndex={currentFocusedId === row.id ? 0 : -1}
                      data-index={virtualIndex}
                      data-grid-row={row.id}
                      className={cn(
                        'aegis-grid-row',
                        onRowClick && 'aegis-grid-clickable',
                        row.getIsSelected() && 'is-selected',
                      )}
                      ref={(element) => {
                        if (element) {
                          rowElements.current.set(row.id, element);
                          if (shouldVirtualize) virtualizer.measureElement(element);
                          if (pendingFocus.current === row.id) {
                            element.focus({ preventScroll: true });
                            pendingFocus.current = null;
                          }
                        } else rowElements.current.delete(row.id);
                      }}
                      onFocus={() => setFocusedRowId(row.id)}
                      onKeyDown={(event) => handleRowKey(event, row)}
                      onClick={(event) => {
                        if (!isInteractive(event.target) && !window.getSelection()?.toString()) {
                          setFocusedRowId(row.id);
                          event.currentTarget.focus({ preventScroll: true });
                          onRowClick?.(row.original);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell, columnIndex) => (
                        <td
                          key={cell.id}
                          role="gridcell"
                          aria-colindex={columnIndex + 1}
                          className={cn(
                            cell.column.id === selectionColumnId && 'aegis-grid-pinned',
                            cell.column.id === expansionColumnId && 'aegis-grid-expand-column',
                            cell.column.columnDef.meta?.cellClassName,
                          )}
                          style={{ textAlign: cell.column.columnDef.meta?.align ?? 'left' }}
                        >
                          {cell.column.id === selectionColumnId ? (
                            <Checkbox
                              aria-label={`Select ${rowLabel?.(row.original) ?? row.id}`}
                              checked={row.getIsSelected()}
                              onCheckedChange={(checked) => row.toggleSelected(checked === true)}
                              tabIndex={currentFocusedId === row.id ? 0 : -1}
                            />
                          ) : cell.column.id === expansionColumnId ? (
                            row.getCanExpand() && (
                              <button
                                type="button"
                                className="aegis-grid-expand"
                                aria-label={`${row.getIsExpanded() ? 'Collapse' : 'Expand'} ${rowLabel?.(row.original) ?? row.id}`}
                                aria-expanded={row.getIsExpanded()}
                                aria-controls={
                                  row.getIsExpanded() ? `${id}-expanded-${row.id}` : undefined
                                }
                                onClick={row.getToggleExpandedHandler()}
                                tabIndex={currentFocusedId === row.id ? 0 : -1}
                              >
                                {row.getIsExpanded() ? (
                                  <ChevronDown size={15} />
                                ) : (
                                  <ChevronRight size={15} />
                                )}
                              </button>
                            )
                          ) : (
                            <div className="aegis-grid-cell-content">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ),
                )}
                {paddingBottom > 0 && (
                  <tr aria-hidden="true" className="aegis-grid-spacer">
                    <td colSpan={visibleColumns.length} style={{ height: paddingBottom }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      <div className="aegis-grid-footer">
        {pagination ? (
          <Pagination
            page={safePagination.pageIndex + 1}
            pageSize={safePagination.pageSize}
            total={data.length}
            onPageChange={(page) => {
              table.setPageIndex(page - 1);
              scrollRef.current?.scrollTo({ top: 0 });
            }}
            onPageSizeChange={(size) => {
              table.setPageSize(size);
              scrollRef.current?.scrollTo({ top: 0 });
            }}
            disabled={loading}
            noun="alerts"
          />
        ) : (
          <span>
            {data.length.toLocaleString()} alerts{shouldVirtualize && ' · Virtual scrolling'}
          </span>
        )}
      </div>
      {selected.length > 0 && (
        <div className="aegis-grid-bulk" role="region" aria-label="Selected alert actions">
          {renderBulkActions ? (
            renderBulkActions(selected, () => table.resetRowSelection(true))
          ) : (
            <>
              <span>
                <Check size={16} aria-hidden />
                {selected.length.toLocaleString()} selected
              </span>
              <Button size="sm" emphasis="ghost" onClick={() => table.resetRowSelection(true)}>
                Clear selection
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
