import React from "react";
import Button from "./Button";
import Select from "./Select";

export default function DataToolbar({
  search = "",
  onSearch,
  filters = [], // [{label, value, options: [{value, label}]}]
  onFilterChange,
  actions = [], // [{label, onClick, icon}]
  selectedCount = 0,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 p-4 bg-secondary-100 rounded-xl shadow-soft border border-secondary-200">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch?.(e.target.value)}
        placeholder="Search..."
        className="w-full md:w-64 px-4 py-2 rounded-lg border border-secondary-300 focus:ring-2 focus:ring-primary-300 focus:outline-none bg-white"
      />
      {/* Filters */}
      {filters.map((filter) => (
        <Select
          key={filter.value}
          label={filter.label}
          value={filter.value}
          options={filter.options}
          onChange={(e) => onFilterChange?.(filter.label, e.target.value)}
          className="w-40"
        />
      ))}
      {/* Actions */}
      <div className="flex gap-2 ml-auto">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant || "primary"}
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex items-center gap-1"
          >
            {action.icon && <span>{action.icon}</span>}
            {action.label}
            {action.showCount && selectedCount > 0 && (
              <span className="ml-1 bg-primary-500 text-white rounded-full px-2 text-xs font-bold">
                {selectedCount}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
