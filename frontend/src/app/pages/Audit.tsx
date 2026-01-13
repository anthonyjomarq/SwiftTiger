
import React, { useState, ChangeEvent } from 'react';
import { Shield, Filter, Download, Search } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE_CUSTOMER' 
  | 'UPDATE_CUSTOMER' 
  | 'DELETE_CUSTOMER'
  | 'CREATE_JOB' 
  | 'UPDATE_JOB' 
  | 'DELETE_JOB' 
  | 'CREATE_USER' 
  | 'UPDATE_USER'
  | 'DELETE_USER' 
  | 'ROLE_CHANGE' 
  | 'PASSWORD_CHANGE';

export function Audit() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });

  const actions: AuditAction[] = [
    'LOGIN', 'LOGOUT', 'CREATE_CUSTOMER', 'UPDATE_CUSTOMER', 'DELETE_CUSTOMER',
    'CREATE_JOB', 'UPDATE_JOB', 'DELETE_JOB', 'CREATE_USER', 'UPDATE_USER',
    'DELETE_USER', 'ROLE_CHANGE', 'PASSWORD_CHANGE'
  ];

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleActionFilterChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setActionFilter(e.target.value);
  };

  const handleDateRangeChange = (field: keyof DateRange) => (e: ChangeEvent<HTMLInputElement>): void => {
    setDateRange(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleExportLogs = (): void => {
    // Export functionality will be implemented
    console.log('Export logs functionality to be implemented');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Monitor system activity and user actions</p>
        </div>
        <button 
          className="btn btn-secondary flex items-center gap-2"
          onClick={handleExportLogs}
        >
          <Download className="h-4 w-4" />
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={handleActionFilterChange}
            className="input"
          >
            <option value="">All Actions</option>
            {actions.map(action => (
              <option key={action} value={action}>{action.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={handleDateRangeChange('start')}
            className="input"
            placeholder="Start date"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={handleDateRangeChange('end')}
            className="input"
            placeholder="End date"
          />
        </div>
      </div>

      {/* Audit Logs Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Audit logging system will be implemented here</p>
          <p className="text-sm text-gray-500 mt-2">
            Track all user actions, login events, and system changes with detailed logs
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Statistics</h3>
          <div className="text-center py-8">
            <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Action breakdown coming soon</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
          <div className="text-center py-8">
            <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">User activity stats coming soon</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Recent logs coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}