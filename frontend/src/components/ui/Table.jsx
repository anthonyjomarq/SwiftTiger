import React, { useState, useEffect } from "react";
import Spinner from "./Spinner";
import clsx from "clsx";
import { FixedSizeList as List } from "react-window";

export default React.memo(function Table({
  columns,
  data,
  loading = false,
  className = "",
  virtualized = false,
  height = 400,
  rowHeight = 48,
  multiSelect = false,
  selectedRows = [],
  onSelectedRowsChange,
}) {
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [internalSelected, setInternalSelected] = useState([]);

  // Sync internal/external selected rows
  useEffect(() => {
    if (onSelectedRowsChange) {
      setInternalSelected(selectedRows || []);
    }
  }, [selectedRows, onSelectedRowsChange]);

  const handleSort = (accessor) => {
    if (sortBy === accessor) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(accessor);
      setSortDir("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return sortDir === "asc" ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortDir]);

  // Multi-select logic
  const isAllSelected =
    internalSelected.length > 0 &&
    sortedData.length > 0 &&
    internalSelected.length === sortedData.length;
  const isIndeterminate =
    internalSelected.length > 0 && internalSelected.length < sortedData.length;

  const handleSelectAll = (checked) => {
    const newSelected = checked ? sortedData.map((row) => row.id) : [];
    setInternalSelected(newSelected);
    onSelectedRowsChange?.(newSelected);
  };

  const handleSelectRow = (id, checked) => {
    let newSelected;
    if (checked) {
      newSelected = [...internalSelected, id];
    } else {
      newSelected = internalSelected.filter((rowId) => rowId !== id);
    }
    setInternalSelected(newSelected);
    onSelectedRowsChange?.(newSelected);
  };

  // Virtualized row renderer
  const Row = ({ index, style }) => {
    const row = sortedData[index];
    const checked = internalSelected.includes(row.id);
    return (
      <tr
        key={row.id || index}
        style={style}
        className="hover:bg-secondary-50 transition-colors"
      >
        {multiSelect && (
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => handleSelectRow(row.id, e.target.checked)}
              className="accent-primary-500 h-4 w-4 rounded focus:ring-primary-300"
            />
          </td>
        )}
        {columns.map((col) => (
          <td key={col.accessor} className="px-4 py-3 text-sm text-gray-700">
            {col.Cell ? col.Cell(row) : row[col.accessor]}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div
      className={clsx(
        "overflow-x-auto rounded-xl border border-secondary-300 bg-white shadow-soft",
        className
      )}
      style={virtualized ? { height: height + 56 } : {}}
    >
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-100 sticky top-0 z-10">
          <tr>
            {multiSelect && (
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="accent-primary-500 h-4 w-4 rounded focus:ring-primary-300"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.accessor}
                className={clsx(
                  "px-4 py-3 text-left text-xs font-bold text-primary-700 uppercase tracking-wider cursor-pointer select-none",
                  col.sortable && "hover:underline"
                )}
                onClick={
                  col.sortable ? () => handleSort(col.accessor) : undefined
                }
              >
                {col.Header}
                {col.sortable && sortBy === col.accessor && (
                  <span className="ml-1 text-xs">
                    {sortDir === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-200">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (multiSelect ? 1 : 0)}
                className="py-8 text-center"
              >
                <Spinner size="md" />
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (multiSelect ? 1 : 0)}
                className="py-8 text-center text-gray-400"
              >
                No data found.
              </td>
            </tr>
          ) : virtualized ? (
            <tr>
              <td
                colSpan={columns.length + (multiSelect ? 1 : 0)}
                className="p-0"
              >
                <div style={{ height, width: "100%" }}>
                  <List
                    height={height}
                    itemCount={sortedData.length}
                    itemSize={rowHeight}
                    width="100%"
                  >
                    {({ index, style }) => (
                      <table style={{ ...style, width: "100%" }}>
                        <tbody>
                          <Row index={index} style={{}} />
                        </tbody>
                      </table>
                    )}
                  </List>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row, i) => (
              <tr
                key={row.id || i}
                className="hover:bg-secondary-50 transition-colors"
              >
                {multiSelect && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={internalSelected.includes(row.id)}
                      onChange={(e) =>
                        handleSelectRow(row.id, e.target.checked)
                      }
                      className="accent-primary-500 h-4 w-4 rounded focus:ring-primary-300"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.accessor}
                    className="px-4 py-3 text-sm text-gray-700"
                  >
                    {col.Cell ? col.Cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});
