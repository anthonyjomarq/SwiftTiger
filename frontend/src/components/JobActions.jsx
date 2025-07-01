import React from "react";
import Button from "./ui/Button";
import { exportToCsv } from "./ui/exportToCsv";

const JobActions = React.memo(
  ({
    error,
    onClearError,
    jobs,
    selected,
    onExport,
    onBulkDelete,
    deleting,
    canExport = true,
    canDelete = true,
  }) => {
    // Handle export with memoized data
    const handleExport = React.useCallback(() => {
      if (onExport) {
        onExport();
      } else {
        // Default export behavior
        const columns = [
          { Header: "Title", accessor: "title" },
          { Header: "Customer", accessor: "customer_name" },
          { Header: "Technician", accessor: "technician_name" },
          { Header: "Status", accessor: "status" },
          { Header: "Due Date", accessor: "due_date" },
        ];

        const exportData = jobs.filter(
          (j) => selected.length === 0 || selected.includes(j.id)
        );

        exportToCsv("jobs.csv", columns, exportData);
      }
    }, [jobs, selected, onExport]);

    if (!error && !canExport && !canDelete) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span>{error.message}</span>
              <Button variant="secondary" size="sm" onClick={onClearError}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(canExport || canDelete) && (
          <div className="flex gap-2">
            {canExport && (
              <Button
                variant="secondary"
                onClick={handleExport}
                disabled={jobs.length === 0}
              >
                📤 Export CSV
              </Button>
            )}

            {canDelete && (
              <Button
                variant="danger"
                onClick={onBulkDelete}
                disabled={deleting || selected.length === 0}
              >
                {deleting
                  ? "🗑️ Deleting..."
                  : `🗑️ Delete ${selected.length} Selected`}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

JobActions.displayName = "JobActions";

export default JobActions;
