import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "../hooks/useJobs";
import { usePermissions } from "../hooks/usePermissions";
import JobList from "../components/JobList";
import JobFilters from "../components/JobFilters";
import JobActions from "../components/JobActions";
import LoadingBoundary from "../components/LoadingBoundary";
import { exportToCsv } from "../components/ui/exportToCsv";

export default function Jobs() {
  const navigate = useNavigate();
  const {
    jobs,
    loading,
    error,
    search,
    status,
    priority,
    selected,
    deleting,
    setSearch,
    setStatus,
    setPriority,
    setSelected,
    handleBulkDelete,
    clearError,
    clearFilters,
  } = useJobs();

  const { permissions } = usePermissions();

  // Handle export
  const handleExport = useCallback(() => {
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
  }, [jobs, selected]);

  // Handle row click
  const handleRowClick = useCallback(
    (job) => {
      if (permissions.jobs.read) {
        navigate(`/jobs/${job.id}`);
      }
    },
    [navigate, permissions.jobs.read]
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-primary-700">Jobs</h1>

      <LoadingBoundary
        loading={loading && jobs.length === 0}
        error={error}
        onRetry={clearError}
        loadingText="Loading jobs..."
        errorText="Failed to load jobs"
      >
        <JobFilters
          search={search}
          onSearch={setSearch}
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          selected={selected}
          onExport={handleExport}
          onBulkDelete={handleBulkDelete}
          deleting={deleting}
          onClearFilters={clearFilters}
          canExport={permissions.jobs.read}
          canDelete={permissions.jobs.delete}
        />

        <JobActions
          error={error}
          onClearError={clearError}
          jobs={jobs}
          selected={selected}
          onExport={handleExport}
          onBulkDelete={handleBulkDelete}
          deleting={deleting}
          canExport={permissions.jobs.read}
          canDelete={permissions.jobs.delete}
        />

        <JobList
          jobs={jobs}
          loading={loading}
          selected={selected}
          onSelectedRowsChange={setSelected}
          onRowClick={handleRowClick}
          virtualized={jobs.length > 20}
          height={500}
          rowHeight={52}
        />
      </LoadingBoundary>
    </div>
  );
}
