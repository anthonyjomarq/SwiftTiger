import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import JobMap from "../components/JobMap";
import JobDetail from "../components/JobDetail";
import StartLocationModal from "../components/StartLocationModal";

const RoutePlanning = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [startLocation, setStartLocation] = useState({
    lat: 18.2208,
    lng: -66.5901,
    name: "Default Start Point",
  });
  const [showStartLocationModal, setShowStartLocationModal] = useState(false);
  const { hasPermission, isTechnician, user } = useAuth();

  useEffect(() => {
    fetchMapData();
    if (hasPermission("jobs.assign")) {
      fetchTechnicians();
    }
  }, [selectedDate, selectedTechnician]);

  const fetchMapData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (selectedTechnician)
        params.append("technician_id", selectedTechnician);

      console.log("Fetching map data with params:", params.toString());
      const response = await axios.get(`/api/jobs/map-data?${params}`);
      console.log("Map data response:", response.data);
      console.log("First job details:", response.data.jobs[0]);
      setJobs(response.data.jobs);
    } catch (error) {
      console.error("Error fetching map data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await axios.get("/api/users");
      setTechnicians(
        response.data.users.filter((u) => u.role === "technician")
      );
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  const handleOptimizeRoute = async () => {
    if (jobs.length < 2) return;

    setOptimizing(true);
    try {
      const response = await axios.post("/api/jobs/optimize-route", {
        job_ids: jobs.map((j) => j.id),
        start_location: {
          latitude: startLocation.lat,
          longitude: startLocation.lng,
          name: startLocation.name,
        },
        end_location: {
          latitude: startLocation.lat,
          longitude: startLocation.lng,
          name: startLocation.name,
        },
      });

      // Refresh data to show new order
      await fetchMapData();
    } catch (error) {
      console.error("Error optimizing route:", error);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Route Planning</h1>
        <p className="text-gray-600">
          View and optimize technician routes for efficient job completion
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {hasPermission("jobs.assign") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician
              </label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Technicians</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasPermission("jobs.assign") && jobs.length >= 2 && (
            <button
              onClick={handleOptimizeRoute}
              disabled={optimizing}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {optimizing ? "Optimizing..." : "Optimize Route"}
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Start/End Location:</span>
            <span className="text-sm font-medium">{startLocation.name}</span>
            <button
              onClick={() => setShowStartLocationModal(true)}
              className="text-blue-600 hover:text-blue-700 text-sm underline"
            >
              Change
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Found {jobs.length} job{jobs.length !== 1 ? "s" : ""} with location
            data
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <JobMap
              jobs={jobs}
              selectedJob={selectedJob}
              onJobSelect={setSelectedJob}
              startLocation={startLocation}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Route Order
            </h3>
            <div className="space-y-2">
              {jobs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No jobs found for selected criteria
                </p>
              ) : (
                jobs.map((job, index) => (
                  <div
                    key={job.id}
                    className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-600">
                        {job.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {job.customer_address}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onJobUpdate={fetchMapData}
        />
      )}

      {showStartLocationModal && (
        <StartLocationModal
          currentLocation={startLocation}
          onClose={() => setShowStartLocationModal(false)}
          onLocationSet={(location) => {
            setStartLocation(location);
            setShowStartLocationModal(false);
          }}
        />
      )}
    </div>
  );
};

export default RoutePlanning;
