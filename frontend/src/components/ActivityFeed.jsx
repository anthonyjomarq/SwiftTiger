import React, { useState, useEffect } from "react";
import axios from "axios";

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityFeed();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivityFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivityFeed = async () => {
    try {
      const response = await axios.get("/api/activity-feed");
      setActivities(response.data.updates);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="border-l-2 border-blue-500 pl-3 py-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user_name}</span>
                    <span className="text-gray-600"> updated </span>
                    <span className="font-medium">{activity.job_title}</span>
                    {activity.customer_name && (
                      <span className="text-gray-600">
                        {" "}
                        for {activity.customer_name}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.content}
                  </p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatTimeAgo(activity.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
