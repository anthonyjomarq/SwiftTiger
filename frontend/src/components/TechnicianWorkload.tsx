import React from 'react';
import { User, Clock, Briefcase, AlertTriangle } from 'lucide-react';
import { TechnicianWorkload as TechnicianWorkloadType, JobPriority } from '../types';

interface TechnicianWorkloadProps {
  technicians: TechnicianWorkloadType[];
  isLoading: boolean;
  onTechnicianSelect: (technician: TechnicianWorkloadType) => void;
  selectedTechnician?: TechnicianWorkloadType | null;
}

const TechnicianWorkload: React.FC<TechnicianWorkloadProps> = ({ 
  technicians, 
  isLoading, 
  onTechnicianSelect, 
  selectedTechnician 
}) => {
  const getWorkloadColor = (totalHours: number): string => {
    if (totalHours === 0) return 'bg-gray-200';
    if (totalHours < 4) return 'bg-green-200';
    if (totalHours < 7) return 'bg-yellow-200';
    return 'bg-red-200';
  };

  const getWorkloadTextColor = (totalHours: number): string => {
    if (totalHours === 0) return 'text-gray-600';
    if (totalHours < 4) return 'text-green-800';
    if (totalHours < 7) return 'text-yellow-800';
    return 'text-red-800';
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getWorkloadBarColor = (totalHours: number): string => {
    if (totalHours === 0) return 'bg-gray-300';
    if (totalHours < 4) return 'bg-green-500';
    if (totalHours < 7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPriorityJobsCount = (technician: TechnicianWorkloadType, priority: JobPriority): number => {
    return technician.jobs.filter(job => job.priority === priority).length;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Workload</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading workload...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Technician Workload</h3>
        <User className="h-5 w-5 text-gray-400" />
      </div>

      {technicians.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No technicians found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {technicians.map((technician) => {
            const totalHours = Math.round(technician.totalDuration / 60 * 10) / 10;
            const isSelected = selectedTechnician?.id === technician.id;
            
            return (
              <div
                key={technician.id}
                onClick={() => onTechnicianSelect(technician)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-primary-300 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Technician Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{technician.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{technician.role}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkloadColor(totalHours)} ${getWorkloadTextColor(totalHours)}`}>
                    {totalHours === 0 ? 'Available' : `${totalHours}h scheduled`}
                  </div>
                </div>

                {/* Job Statistics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{technician.jobCount}</div>
                    <div className="text-xs text-gray-500">Jobs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatDuration(technician.totalDuration)}
                    </div>
                    <div className="text-xs text-gray-500">Duration</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {getPriorityJobsCount(technician, 'High')}
                    </div>
                    <div className="text-xs text-gray-500">High Priority</div>
                  </div>
                </div>

                {/* Workload Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Workload</span>
                    <span>{Math.round((totalHours / 8) * 100)}% of 8h day</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getWorkloadBarColor(totalHours)}`}
                      style={{ width: `${Math.min((totalHours / 8) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Job List Preview */}
                {technician.jobs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">Scheduled Jobs:</p>
                    <div className="space-y-1">
                      {technician.jobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              job.priority === 'High' ? 'bg-red-500' :
                              job.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="text-gray-600 truncate max-w-[120px]">{job.jobName}</span>
                          </div>
                          <span className="text-gray-500">{formatDuration(job.estimatedDuration || 0)}</span>
                        </div>
                      ))}
                      {technician.jobs.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          +{technician.jobs.length - 3} more jobs
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Workload Summary */}
      {technicians.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Team Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{technicians.length}</div>
              <div className="text-xs text-gray-500">Technicians</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {technicians.filter(t => t.totalDuration === 0).length}
              </div>
              <div className="text-xs text-gray-500">Available</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {technicians.filter(t => t.totalDuration > 0 && t.totalDuration < 420).length}
              </div>
              <div className="text-xs text-gray-500">Partial</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {technicians.filter(t => t.totalDuration >= 420).length}
              </div>
              <div className="text-xs text-gray-500">Full</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianWorkload;