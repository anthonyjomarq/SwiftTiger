/**
 * Dashboard Components Export
 * Unified dashboard system for all user types
 */

export { default as DashboardProvider, useDashboard } from './DashboardProvider.jsx';
export { default as DashboardLayout, Dashboard, DashboardToolbar } from './DashboardLayout.jsx';
export { default as DashboardWidget } from './DashboardWidget.jsx';

// Re-export for convenience
export * from './DashboardProvider.jsx';
export * from './DashboardLayout.jsx';