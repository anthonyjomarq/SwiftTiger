import React, { useMemo } from "react";
import Table from "./ui/Table";
import Badge from "./ui/Badge";
import Spinner from "./ui/Spinner";
import { UI_TEXT } from "../config/constants";

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
    // Memoized table columns
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

    // Memoized virtualized setting
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
