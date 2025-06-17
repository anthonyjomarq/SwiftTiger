import React from "react";
import {
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  Calendar,
  Wrench,
  AlertCircle,
  Phone,
} from "lucide-react";

const TechnicianDashboard = () => {
  // Mock data for demonstration
  const stats = [
    {
      name: "Jobs Today",
      value: "5",
      change: "+1%",
      changeType: "increase",
      icon: Calendar,
      color: "blue",
    },
    {
      name: "Completed",
      value: "2",
      change: "+100%",
      changeType: "increase",
      icon: CheckCircle,
      color: "green",
    },
    {
      name: "In Progress",
      value: "1",
      change: "0%",
      changeType: "neutral",
      icon: Wrench,
      color: "yellow",
    },
    {
      name: "Remaining",
      value: "2",
      change: "-33%",
      changeType: "decrease",
      icon: Clock,
      color: "orange",
    },
  ];

  const todaysJobs = [
    {
      id: "J-001",
      customer: "ABC Corp",
      address: "123 Main St, Downtown",
      status: "completed",
      priority: "high",
      time: "09:00 AM",
      duration: "2h 30m",
      type: "Maintenance",
    },
    {
      id: "J-002",
      customer: "XYZ Ltd",
      address: "456 Oak Ave, Midtown",
      status: "in-progress",
      priority: "medium",
      time: "11:30 AM",
      duration: "1h 45m",
      type: "Repair",
    },
    {
      id: "J-003",
      customer: "Tech Solutions",
      address: "789 Pine Rd, Uptown",
      status: "scheduled",
      priority: "low",
      time: "02:00 PM",
      duration: "1h 15m",
      type: "Installation",
    },
    {
      id: "J-004",
      customer: "Global Inc",
      address: "321 Elm St, Westside",
      status: "scheduled",
      priority: "high",
      time: "04:00 PM",
      duration: "3h 00m",
      type: "Emergency",
    },
  ];

  const currentJob = todaysJobs.find((job) => job.status === "in-progress");
  const nextJob = todaysJobs.find((job) => job.status === "scheduled");

  const getStatColor = (color) => {
    const colors = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      orange: "bg-orange-500",
    };
    return colors[color] || colors.blue;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "text-green-600 bg-green-100",
      "in-progress": "text-blue-600 bg-blue-100",
      scheduled: "text-yellow-600 bg-yellow-100",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-secondary-900 sm:truncate sm:text-3xl">
            My Dashboard
          </h2>
          <p className="mt-1 text-sm text-secondary-500">
            Welcome back! Here's your schedule for today
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button className="btn-outline btn-md">
            <Navigation className="h-4 w-4 mr-2" />
            Navigate
          </button>
          <button className="btn-primary btn-md">
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Job
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

      {/* Current and Next Job */}
      {(currentJob || nextJob) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Job */}
          {currentJob && (
            <div className="card border-l-4 border-l-blue-500">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-secondary-900">
                    Current Job
                  </h3>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      currentJob.status
                    )}`}
                  >
                    In Progress
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-secondary-900">
                      {currentJob.customer}
                    </h4>
                    <p className="text-sm text-secondary-600 flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {currentJob.address}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium ${getPriorityColor(
                      currentJob.priority
                    )}`}
                  >
                    {currentJob.priority} priority
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-500">Job ID:</span>
                    <span className="ml-2 font-medium">{currentJob.id}</span>
                  </div>
                  <div>
                    <span className="text-secondary-500">Type:</span>
                    <span className="ml-2 font-medium">{currentJob.type}</span>
                  </div>
                  <div>
                    <span className="text-secondary-500">Started:</span>
                    <span className="ml-2 font-medium">{currentJob.time}</span>
                  </div>
                  <div>
                    <span className="text-secondary-500">Est. Duration:</span>
                    <span className="ml-2 font-medium">
                      {currentJob.duration}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button className="btn-primary btn-sm flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Job
                  </button>
                  <button className="btn-outline btn-sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Customer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Next Job */}
          {nextJob && (
            <div className="card border-l-4 border-l-yellow-500">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-secondary-900">
                    Next Job
                  </h3>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      nextJob.status
                    )}`}
                  >
                    Scheduled
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-secondary-900">
                      {nextJob.customer}
                    </h4>
                    <p className="text-sm text-secondary-600 flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {nextJob.address}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium ${getPriorityColor(
                      nextJob.priority
                    )}`}
                  >
                    {nextJob.priority} priority
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-500">Job ID:</span>
                    <span className="ml-2 font-medium">{nextJob.id}</span>
                  </div>
                  <div>
                    <span className="text-secondary-500">Type:</span>
                    <span className="ml-2 font-medium">{nextJob.type}</span>
                  </div>
                  <div>
                    <span className="text-secondary-500">Scheduled:</span>
                    <span className="ml-2 font-medium">{nextJob.time}</span>
                  </div>
                  <div>
                    <span className="text-secondary-500">Est. Duration:</span>
                    <span className="ml-2 font-medium">{nextJob.duration}</span>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button className="btn-primary btn-sm flex-1">
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </button>
                  <button className="btn-outline btn-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Start Early
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Jobs Today */}
      <div className="card">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-secondary-900">
              Today's Schedule
            </h3>
            <Calendar className="h-5 w-5 text-secondary-400" />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {todaysJobs.map((job, index) => (
              <div
                key={job.id}
                className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                  job.status === "in-progress"
                    ? "border-blue-200 bg-blue-50"
                    : job.status === "completed"
                    ? "border-green-200 bg-green-50"
                    : "border-secondary-200 hover:bg-secondary-50"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        job.status === "completed"
                          ? "bg-green-500 text-white"
                          : job.status === "in-progress"
                          ? "bg-blue-500 text-white"
                          : "bg-secondary-200 text-secondary-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
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
                        {job.priority}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-900 mt-1">
                      {job.customer}
                    </p>
                    <p className="text-xs text-secondary-500 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {job.time} • {job.duration} • {job.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {job.status === "completed" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {job.status === "in-progress" && (
                    <button className="btn-primary btn-sm">Complete</button>
                  )}
                  {job.status === "scheduled" && (
                    <button className="btn-outline btn-sm">View Details</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
