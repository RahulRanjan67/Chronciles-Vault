/**
 * Pure utilities for VirtualWorkGrid virtualization.
 * Extracted to a separate non-component file so VirtualWorkGrid.tsx
 * can be Vite Fast Refresh compatible.
 */

export const VIRTUALIZATION_THRESHOLD = 30;

export interface VirtualWindowInput {
  readonly totalItems: number;
  readonly columns: number;
  readonly rowHeight: number;
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly bufferItems: number;
}

export interface VirtualWindowResult {
  readonly isVirtualized: boolean;
  readonly totalRows: number;
  readonly startRow: number;
  readonly endRow: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly mountedCount: number;
  readonly paddingTop: number;
  readonly paddingBottom: number;
}

/**
 * Pure row virtualization calculator per PERFORMANCE.md §5:
 * Any list or grid exceeding 30 items virtualizes rows using deterministic
 * fixed item bounds and the active performance profile's buffer size
 * (Lite: 20 items, Balanced: 40 items, Full: 80 items).
 */
export function computeVirtualWindow(input: VirtualWindowInput): VirtualWindowResult {
  const cols = Math.max(1, input.columns);
  const totalRows = Math.ceil(input.totalItems / cols);

  if (input.totalItems <= VIRTUALIZATION_THRESHOLD || totalRows === 0) {
    return {
      isVirtualized: false,
      totalRows,
      startRow: 0,
      endRow: Math.max(0, totalRows - 1),
      startIndex: 0,
      endIndex: input.totalItems,
      mountedCount: input.totalItems,
      paddingTop: 0,
      paddingBottom: 0,
    };
  }

  const rowHeight = Math.max(1, input.rowHeight);
  const bufferRows = Math.max(1, Math.ceil(input.bufferItems / cols));
  const rawFirstVisibleRow = Math.floor(Math.max(0, input.scrollTop) / rowHeight);
  const visibleRowCount = Math.max(1, Math.ceil(Math.max(300, input.viewportHeight) / rowHeight));

  const startRow = Math.max(0, rawFirstVisibleRow - bufferRows);
  const endRow = Math.min(totalRows - 1, rawFirstVisibleRow + visibleRowCount + bufferRows - 1);

  const startIndex = startRow * cols;
  const endIndex = Math.min(input.totalItems, (endRow + 1) * cols);
  const mountedCount = Math.max(0, endIndex - startIndex);

  const paddingTop = startRow * rowHeight;
  const paddingBottom = Math.max(0, (totalRows - 1 - endRow) * rowHeight);

  return {
    isVirtualized: true,
    totalRows,
    startRow,
    endRow,
    startIndex,
    endIndex,
    mountedCount,
    paddingTop,
    paddingBottom,
  };
}
