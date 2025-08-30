import React from 'react';
import { Plus, Search, Users, Briefcase, Calendar, FileText } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'search' | 'users' | 'jobs' | 'calendar' | 'files' | 'plus';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search',
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  const iconComponents = {
    search: Search,
    users: Users,
    jobs: Briefcase,
    calendar: Calendar,
    files: FileText,
    plus: Plus
  };

  const IconComponent = iconComponents[icon];

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <IconComponent className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;