import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { useApi } from "../services/api";
import JobForm from "../components/ui/JobForm";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";

export default function JobCreate() {
  const navigate = useNavigate();
  const { loading, error, callApi, clearError } = useApi();
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchTechnicians();
    // eslint-disable-next-line
  }, []);

  async function fetchCustomers() {
    try {
      const data = await callApi(() => apiService.customers.getAll());
      setCustomers(data.customers || data || []);
    } catch (e) {}
  }

  async function fetchTechnicians() {
    try {
      const data = await callApi(() => apiService.auth.getAllUsers?.());
      setTechnicians(
        (data.users || data || []).filter((u) => u.role === "technician")
      );
    } catch (e) {}
  }

  async function handleSubmit(formData) {
    setSubmitting(true);
    try {
      // File upload: if file present, upload first (stubbed here)
      // You can implement actual upload logic as needed
      // const fileUrl = formData.file ? await uploadFile(formData.file) : undefined;
      await callApi(() =>
        apiService.jobs.create({
          ...formData,
          // attachment: fileUrl,
        })
      );
      navigate("/jobs");
    } catch (e) {}
    setSubmitting(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-primary-700">Create Job</h1>
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg">
          {error.message}
          <Button className="ml-4" variant="secondary" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}
      {(loading || submitting) && <Spinner className="mb-4" />}
      <JobForm
        onSubmit={handleSubmit}
        customers={customers}
        technicians={technicians}
      />
    </div>
  );
}
