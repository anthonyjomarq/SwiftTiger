/**
 * Job List Component
 * Displays a table of jobs with filtering, sorting, and selection capabilities
 *
 * @author SwiftTiger Team
 * @version 1.0.0
 */

// React
import React, { useMemo } from "react";

// UI Components
import Table from "./ui/Table";
import Badge from "./ui/Badge";
import Spinner from "./ui/Spinner";

// Configuration
import { UI_TEXT } from "../config/constants";

/**
 * JobList component for displaying jobs in a table format
 *
 * @param {Object} props - Component props
 * @param {Array} props.jobs - Array of job objects to display
 * @param {boolean} props.loading - Loading state indicator
 * @param {Array} props.selected - Array of selected job IDs
 * @param {Function} props.onSelectedRowsChange - Callback for selection changes
 * @param {Function} props.onRowClick - Callback for row click events
 * @param {boolean} props.virtualized - Whether to use virtualized rendering
 * @param {number} props.height - Table height in pixels
 * @param {number} props.rowHeight - Height of each row in pixels
 * @returns {JSX.Element} JobList component
 */
const JobList = React.memo(
  ({
    jobs,
    loading,
    selected,
    onSelectedRowsChange,
    onRowClick,
    virtualized = true,
    height = 500,
    rowHeight = 52,
  }) => {
    /**
     * Memoized table columns configuration
     * Defines the structure and rendering of each column
     */
    const columns = useMemo(
      () => [
        {
          Header: UI_TEXT.JOBS.FIELDS.TITLE,
          accessor: "title",
          sortable: true,
        },
        {
          Header: UI_TEXT.JOBS.FIELDS.CUSTOMER,
          accessor: "customer_name",
          sortable: true,
        },
        {
          Header: UI_TEXT.JOBS.FIELDS.ASSIGNED_TO,
          accessor: "technician_name",
          sortable: true,
        },
        {
          Header: UI_TEXT.JOBS.FIELDS.STATUS,
          accessor: "status",
          sortable: true,
          Cell: (row) => (
            <Badge
              color={
                row.status === "completed"
                  ? "success"
                  : row.status === "in_progress"
                  ? "primary"
                  : row.status === "pending"
                  ? "warning"
                  : row.status === "cancelled"
                  ? "error"
                  : "secondary"
              }
            >
              {row.status?.replace(/_/g, " ")}
            </Badge>
          ),
        },
        {
          Header: UI_TEXT.JOBS.FIELDS.SCHEDULED_DATE,
          accessor: "due_date",
          sortable: true,
          Cell: (row) =>
            row.due_date ? new Date(row.due_date).toLocaleDateString() : "-",
        },
      ],
      []
    );

    /**
     * Memoized virtualized setting
     * Determines whether to use virtualized rendering based on job count
     */
    const shouldVirtualize = useMemo(() => {
      return virtualized && jobs.length > 20;
    }, [virtualized, jobs.length]);

    if (loading) {
      return <Spinner className="mt-6" />;
    }

    return (
      <Table
        columns={columns}
        data={jobs}
        loading={loading}
        multiSelect
        selectedRows={selected}
        onSelectedRowsChange={onSelectedRowsChange}
        onRowClick={onRowClick}
        virtualized={shouldVirtualize}
        height={height}
        rowHeight={rowHeight}
      />
    );
  }
);

JobList.displayName = "JobList";

export default JobList;
