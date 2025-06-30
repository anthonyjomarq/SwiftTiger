import React, { useEffect, useState, useMemo } from "react";
import apiService from "../services/api";
import { useApi } from "../services/api";
import DataToolbar from "../components/ui/DataToolbar";
import Table from "../components/ui/Table";
import { exportToCsv } from "../components/ui/exportToCsv";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Jobs() {
  const { loading, error, callApi, clearError } = useApi();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Fetch jobs
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line
  }, []);

  async function fetchJobs() {
    try {
      const params = {};
      if (status) params.status = status;
      const data = await callApi(() => apiService.jobs.getAll(params));
      setJobs(data.jobs || data || []);
    } catch (e) {}
  }

  // Search & filter
  const filteredJobs = useMemo(() => {
    let filtered = jobs;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title?.toLowerCase().includes(s) ||
          j.customer_name?.toLowerCase().includes(s) ||
          j.technician_name?.toLowerCase().includes(s) ||
          j.status?.toLowerCase().includes(s)
      );
    }
    if (status) {
      filtered = filtered.filter((j) => j.status === status);
    }
    return filtered;
  }, [jobs, search, status]);

  // Table columns
  const columns = [
    { Header: "Title", accessor: "title", sortable: true },
    { Header: "Customer", accessor: "customer_name", sortable: true },
    { Header: "Technician", accessor: "technician_name", sortable: true },
    {
      Header: "Status",
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
      Header: "Due Date",
      accessor: "due_date",
      sortable: true,
      Cell: (row) =>
        row.due_date ? new Date(row.due_date).toLocaleDateString() : "-",
    },
  ];

  // Bulk delete
  async function handleBulkDelete() {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} jobs?`)) return;
    setDeleting(true);
    try {
      await Promise.all(
        selected.map((id) =>
          callApi(() => apiService.jobs.delete(id), { showLoading: false })
        )
      );
      setJobs((prev) => prev.filter((j) => !selected.includes(j.id)));
      setSelected([]);
    } catch (e) {}
    setDeleting(false);
  }

  // Export to CSV
  function handleExport() {
    const exportData = jobs.filter(
      (j) => selected.length === 0 || selected.includes(j.id)
    );
    exportToCsv("jobs.csv", columns, exportData);
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-primary-700">Jobs</h1>
      <DataToolbar
        search={search}
        onSearch={setSearch}
        filters={[
          {
            label: "Status",
            value: status,
            options: STATUS_OPTIONS,
          },
        ]}
        onFilterChange={(_, value) => setStatus(value)}
        actions={[
          {
            label: "Export CSV",
            onClick: handleExport,
            icon: <span>📤</span>,
            variant: "secondary",
          },
          {
            label: deleting ? "Deleting..." : "Delete",
            onClick: handleBulkDelete,
            icon: <span>🗑️</span>,
            variant: "danger",
            disabled: deleting || selected.length === 0,
            showCount: true,
          },
        ]}
        selectedCount={selected.length}
      />
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg">
          {error.message}
          <Button className="ml-4" variant="secondary" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}
      <Table
        columns={columns}
        data={filteredJobs}
        loading={loading || deleting}
        multiSelect
        selectedRows={selected}
        onSelectedRowsChange={setSelected}
        virtualized={filteredJobs.length > 20}
        height={500}
        rowHeight={52}
      />
      {loading && <Spinner className="mt-6" />}
    </div>
  );
}
