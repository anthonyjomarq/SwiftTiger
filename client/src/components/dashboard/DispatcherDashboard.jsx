import React from "react";
import {
  MapPin,
  Briefcase,
  Users,
  Clock,
  Calendar,
  Route,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const DispatcherDashboard = () => {
  // Mock data for demonstration
  const stats = [
    {
      name: "Active Jobs",
      value: "23",
      change: "+5%",
      changeType: "increase",
      icon: Briefcase,
      color: "blue",
    },
    {
      name: "Available Technicians",
      value: "8",
      change: "0%",
      changeType: "neutral",
      icon: Users,
      color: "green",
    },
    {
      name: "Routes Planned",
      value: "6",
      change: "+2%",
      changeType: "increase",
      icon: Route,
      color: "purple",
    },
    {
      name: "Urgent Jobs",
      value: "3",
      change: "-1%",
      changeType: "decrease",
      icon: AlertCircle,
      color: "red",
    },
  ];

  const todaysJobs = [
    {
      id: "J-001",
      customer: "ABC Corp",
      technician: "John Doe",
      status: "in-progress",
      priority: "high",
      time: "09:00 AM",
    },
    {
      id: "J-002",
      customer: "XYZ Ltd",
      technician: "Jane Smith",
      status: "scheduled",
      priority: "medium",
      time: "11:00 AM",
    },
    {
      id: "J-003",
      customer: "Tech Solutions",
      technician: "Mike Wilson",
      status: "completed",
      priority: "low",
      time: "02:00 PM",
    },
    {
      id: "J-004",
      customer: "Global Inc",
      technician: "Unassigned",
      status: "pending",
      priority: "high",
      time: "03:30 PM",
    },
  ];

  const technicians = [
    {
      id: 1,
      name: "John Doe",
      status: "on-route",
      currentJob: "J-001",
      eta: "15 min",
    },
    {
      id: 2,
      name: "Jane Smith",
      status: "available",
      currentJob: null,
      eta: null,
    },
    {
      id: 3,
      name: "Mike Wilson",
      status: "completed",
      currentJob: "J-003",
      eta: "Returning",
    },
    {
      id: 4,
      name: "Sarah Davis",
      status: "lunch-break",
      currentJob: null,
      eta: "20 min",
    },
  ];

  const getStatColor = (color) => {
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
    };
    return colors[color] || colors.blue;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "text-green-600 bg-green-100",
      "in-progress": "text-blue-600 bg-blue-100",
      scheduled: "text-yellow-600 bg-yellow-100",
      pending: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-secondary-600 bg-secondary-100";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "text-red-600",
      medium: "text-yellow-600",
      low: "text-green-600",
    };
    return colors[priority] || "text-secondary-600";
  };

  const getTechnicianStatusColor = (status) => {
    const colors = {
      available: "text-green-600 bg-green-100",
      "on-route": "text-blue-600 bg-blue-100",
      completed: "text-purple-600 bg-purple-100",
      "lunch-break": "text-orange-600 bg-orange-100",
    };
    return colors[status] || "text-secondary-600 bg-secondary-100";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-secondary-900 sm:truncate sm:text-3xl">
            Dispatcher Dashboard
          </h2>
          <p className="mt-1 text-sm text-secondary-500">
            Manage jobs, routes, and technician assignments
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button className="btn-outline btn-md">
            <MapPin className="h-4 w-4 mr-2" />
            Optimize Routes
          </button>
          <button className="btn-primary btn-md">
            <Briefcase className="h-4 w-4 mr-2" />
            Create Job
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-lg ${getStatColor(
                      stat.color
                    )} flex items-center justify-center`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-secondary-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-secondary-900">
                        {stat.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === "increase"
                            ? "text-green-600"
                            : stat.changeType === "decrease"
                            ? "text-red-600"
                            : "text-secondary-500"
                        }`}
                      >
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-secondary-900">
                Today's Jobs
              </h3>
              <Calendar className="h-5 w-5 text-secondary-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {todaysJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-secondary-900">
                        {job.id}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status.replace("-", " ")}
                      </span>
                      <span
                        className={`text-xs font-medium ${getPriorityColor(
                          job.priority
                        )}`}
                      >
                        {job.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 mt-1">
                      {job.customer}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">
                      Technician: {job.technician} • {job.time}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="btn-outline btn-sm">View</button>
                    {job.status === "pending" && (
                      <button className="btn-primary btn-sm">Assign</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technician Status */}
        <div className="card">
          <div className="p-6 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-secondary-900">
                Technician Status
              </h3>
              <Users className="h-5 w-5 text-secondary-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {technicians.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {tech.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">
                        {tech.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTechnicianStatusColor(
                            tech.status
                          )}`}
                        >
                          {tech.status.replace("-", " ")}
                        </span>
                        {tech.currentJob && (
                          <span className="text-xs text-secondary-500">
                            Job: {tech.currentJob}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {tech.eta && (
                      <p className="text-sm text-secondary-600">{tech.eta}</p>
                    )}
                    <button className="btn-outline btn-sm mt-1">Contact</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-lg font-medium text-secondary-900">
            Quick Actions
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-outline btn-md w-full justify-center">
              <Briefcase className="h-4 w-4 mr-2" />
              Create Job
            </button>
            <button className="btn-outline btn-md w-full justify-center">
              <Users className="h-4 w-4 mr-2" />
              Add Customer
            </button>
            <button className="btn-outline btn-md w-full justify-center">
              <Route className="h-4 w-4 mr-2" />
              Plan Route
            </button>
            <button className="btn-outline btn-md w-full justify-center">
              <Clock className="h-4 w-4 mr-2" />
              Schedule Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
