import { useState, useEffect, useCallback, useMemo } from "react";
import apiService from "../services/api";
import { useApi } from "../services/api";

export const useJobs = () => {
  const { loading, error, callApi, clearError } = useApi();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    try {
      const params = {};
      if (status) params.status = status;
      const data = await callApi(() => apiService.jobs.getAll(params));
      setJobs(data.jobs || data || []);
    } catch (e) {
      // Error is handled by useApi
    }
  }, [callApi, status]);

  // Filtered jobs with memoization
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

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
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
    } catch (e) {
      // Error is handled by useApi
    }
    setDeleting(false);
  }, [selected, callApi]);

  // Delete single job
  const deleteJob = useCallback(
    async (jobId) => {
      if (!window.confirm("Are you sure you want to delete this job?")) return;

      try {
        await callApi(() => apiService.jobs.delete(jobId));
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      } catch (e) {
        // Error is handled by useApi
      }
    },
    [callApi]
  );

  // Update job
  const updateJob = useCallback(
    async (jobId, updates) => {
      try {
        const updatedJob = await callApi(() =>
          apiService.jobs.update(jobId, updates)
        );
        setJobs((prev) => prev.map((j) => (j.id === jobId ? updatedJob : j)));
        return updatedJob;
      } catch (e) {
        // Error is handled by useApi
        throw e;
      }
    },
    [callApi]
  );

  // Create job
  const createJob = useCallback(
    async (jobData) => {
      try {
        const newJob = await callApi(() => apiService.jobs.create(jobData));
        setJobs((prev) => [newJob, ...prev]);
        return newJob;
      } catch (e) {
        // Error is handled by useApi
        throw e;
      }
    },
    [callApi]
  );

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearch("");
    setStatus("");
  }, []);

  // Select all jobs
  const selectAll = useCallback(() => {
    setSelected(filteredJobs.map((j) => j.id));
  }, [filteredJobs]);

  // Deselect all jobs
  const deselectAll = useCallback(() => {
    setSelected([]);
  }, []);

  // Toggle job selection
  const toggleJobSelection = useCallback((jobId) => {
    setSelected((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    // State
    jobs: filteredJobs,
    allJobs: jobs,
    loading,
    error,
    search,
    status,
    selected,
    deleting,

    // Actions
    fetchJobs,
    setSearch,
    setStatus,
    setSelected,
    handleBulkDelete,
    deleteJob,
    updateJob,
    createJob,
    clearError,
    clearFilters,
    selectAll,
    deselectAll,
    toggleJobSelection,
  };
};
