import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STEPS = ["Details", "Assignment", "Attachments"];
const DRAFT_KEY = "jobform_draft";

export default function JobForm({
  onSubmit,
  initialData = {},
  technicians = [],
  customers = [],
}) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      customer_id: "",
      status: "pending",
      assigned_to: "",
      due_date: "",
      ...initialData,
    },
    mode: "onBlur",
  });

  // Auto-save draft
  useEffect(() => {
    const subscription = watch((values) => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...values, file: undefined })
      );
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        reset(JSON.parse(draft));
      } catch {}
    }
  }, [reset]);

  // File upload preview
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target.result);
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);

  // Step navigation
  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // Final submit
  const submitForm = (data) => {
    localStorage.removeItem(DRAFT_KEY);
    onSubmit?.({ ...data, file });
  };

  return (
    <form
      onSubmit={handleSubmit(submitForm)}
      className="max-w-xl mx-auto bg-white rounded-xl shadow-soft p-6"
    >
      {/* Stepper */}
      <div className="flex justify-between mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white mb-1 ${
                i === step
                  ? "bg-primary-500"
                  : i < step
                  ? "bg-success-500"
                  : "bg-secondary-300"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs ${
                i === step ? "text-primary-700" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 0 && (
        <>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Title is required" }}
            render={({ field }) => (
              <Input label="Title" error={errors.title?.message} {...field} />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input label="Description" multiline rows={3} {...field} />
            )}
          />
          <Controller
            name="customer_id"
            control={control}
            rules={{ required: "Customer is required" }}
            render={({ field }) => (
              <Select
                label="Customer"
                error={errors.customer_id?.message}
                options={[
                  { value: "", label: "Select a customer" },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
                {...field}
              />
            )}
          />
          <Controller
            name="due_date"
            control={control}
            render={({ field }) => (
              <Input label="Due Date" type="date" {...field} />
            )}
          />
        </>
      )}

      {/* Step 2: Assignment */}
      {step === 1 && (
        <>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select label="Status" options={STATUS_OPTIONS} {...field} />
            )}
          />
          <Controller
            name="assigned_to"
            control={control}
            render={({ field }) => (
              <Select
                label="Assign to Technician"
                options={[
                  { value: "", label: "Unassigned" },
                  ...technicians.map((t) => ({ value: t.id, label: t.name })),
                ]}
                {...field}
              />
            )}
          />
        </>
      )}

      {/* Step 3: Attachments */}
      {step === 2 && (
        <div className="mb-4">
          <label className="block mb-1 font-medium text-primary-700">
            Attachment
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {filePreview && (
            <div className="mt-3">
              {file.type?.startsWith("image/") ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="max-h-40 rounded-lg border"
                />
              ) : (
                <a
                  href={filePreview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline"
                >
                  View Attachment
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={prevStep}
          disabled={step === 0}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={nextStep}>
            Next
          </Button>
        ) : (
          <Button type="submit">Submit</Button>
        )}
      </div>
    </form>
  );
}
