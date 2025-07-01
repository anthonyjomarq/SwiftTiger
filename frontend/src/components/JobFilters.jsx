import React from "react";
import DataToolbar from "./ui/DataToolbar";
import Button from "./ui/Button";
import { UI_TEXT } from "../config/constants";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: UI_TEXT.JOBS.STATUS.PENDING },
  { value: "in_progress", label: UI_TEXT.JOBS.STATUS.IN_PROGRESS },
  { value: "completed", label: UI_TEXT.JOBS.STATUS.COMPLETED },
  { value: "cancelled", label: UI_TEXT.JOBS.STATUS.CANCELLED },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "low", label: UI_TEXT.JOBS.PRIORITY.LOW },
  { value: "normal", label: UI_TEXT.JOBS.PRIORITY.NORMAL },
  { value: "high", label: UI_TEXT.JOBS.PRIORITY.HIGH },
  { value: "urgent", label: UI_TEXT.JOBS.PRIORITY.URGENT },
  { value: "emergency", label: UI_TEXT.JOBS.PRIORITY.EMERGENCY },
];

const JobFilters = React.memo(
  ({
    search,
    onSearch,
    status,
    onStatusChange,
    priority,
    onPriorityChange,
    selected,
    onExport,
    onBulkDelete,
    deleting,
    onClearFilters,
    canExport = true,
    canDelete = true,
  }) => {
    const actions = [
      ...(canExport
        ? [
            {
              label: UI_TEXT.COMMON.EXPORT,
              onClick: onExport,
              icon: <span>📤</span>,
              variant: "secondary",
            },
          ]
        : []),
      ...(canDelete
        ? [
            {
              label: deleting ? UI_TEXT.COMMON.DELETING : UI_TEXT.COMMON.DELETE,
              onClick: onBulkDelete,
              icon: <span>🗑️</span>,
              variant: "danger",
              disabled: deleting || selected.length === 0,
              showCount: true,
            },
          ]
        : []),
    ];

    return (
      <div className="mb-4">
        <DataToolbar
          search={search}
          onSearch={onSearch}
          filters={[
            {
              label: "Status",
              value: status,
              options: STATUS_OPTIONS,
            },
            {
              label: "Priority",
              value: priority,
              options: PRIORITY_OPTIONS,
            },
          ]}
          onFilterChange={(filterIndex, value) => {
            if (filterIndex === 0) onStatusChange(value);
            if (filterIndex === 1) onPriorityChange(value);
          }}
          actions={actions}
          selectedCount={selected.length}
        />
        {(search || status || priority) && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{search}"
              </span>
            )}
            {status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status:{" "}
                {STATUS_OPTIONS.find((opt) => opt.value === status)?.label}
              </span>
            )}
            {priority && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Priority:{" "}
                {PRIORITY_OPTIONS.find((opt) => opt.value === priority)?.label}
              </span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>
    );
  }
);

JobFilters.displayName = "JobFilters";

export default JobFilters;
