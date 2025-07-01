import { useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES } from "../config/constants";

export const usePermissions = () => {
  const { user, hasPermission } = useAuth();

  // Memoized permission checks for common operations
  const permissions = useMemo(
    () => ({
      // Job permissions
      jobs: {
        create: hasPermission("jobs.create"),
        read: hasPermission("jobs.read"),
        update: hasPermission("jobs.update"),
        delete: hasPermission("jobs.delete"),
        assign: hasPermission("jobs.assign"),
        complete: hasPermission("jobs.complete"),
      },

      // Customer permissions
      customers: {
        create: hasPermission("customers.create"),
        read: hasPermission("customers.read"),
        update: hasPermission("customers.update"),
        delete: hasPermission("customers.delete"),
      },

      // User management permissions
      users: {
        create: hasPermission("users.create"),
        read: hasPermission("users.read"),
        update: hasPermission("users.update"),
        delete: hasPermission("users.delete"),
        assignRoles: hasPermission("users.assign_roles"),
      },

      // Dashboard permissions
      dashboard: {
        view: hasPermission("dashboard.view"),
        viewAnalytics: hasPermission("dashboard.analytics"),
        viewReports: hasPermission("dashboard.reports"),
      },

      // Route planning permissions
      routes: {
        view: hasPermission("routes.view"),
        create: hasPermission("routes.create"),
        update: hasPermission("routes.update"),
        delete: hasPermission("routes.delete"),
        optimize: hasPermission("routes.optimize"),
      },

      // Real-time features
      realtime: {
        viewLocations: hasPermission("realtime.locations"),
        viewStatus: hasPermission("realtime.status"),
        updateStatus: hasPermission("realtime.update_status"),
      },
    }),
    [hasPermission]
  );

  // Check if user can perform multiple actions
  const canPerform = useCallback(
    (actions) => {
      if (!Array.isArray(actions)) {
        actions = [actions];
      }
      return actions.every((action) => hasPermission(action));
    },
    [hasPermission]
  );

  // Check if user has any of the specified permissions
  const canPerformAny = useCallback(
    (actions) => {
      if (!Array.isArray(actions)) {
        actions = [actions];
      }
      return actions.some((action) => hasPermission(action));
    },
    [hasPermission]
  );

  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.role === USER_ROLES.ADMIN || hasPermission("admin");
  }, [user?.role, hasPermission]);

  // Check if user is technician
  const isTechnician = useMemo(() => {
    return user?.role === USER_ROLES.TECHNICIAN || hasPermission("technician");
  }, [user?.role, hasPermission]);

  // Check if user is manager
  const isManager = useMemo(() => {
    return user?.role === USER_ROLES.MANAGER || hasPermission("manager");
  }, [user?.role, hasPermission]);

  // Get user's role-based capabilities
  const capabilities = useMemo(() => {
    const caps = {
      canManageJobs:
        permissions.jobs.create ||
        permissions.jobs.update ||
        permissions.jobs.delete,
      canManageCustomers:
        permissions.customers.create ||
        permissions.customers.update ||
        permissions.customers.delete,
      canManageUsers:
        permissions.users.create ||
        permissions.users.update ||
        permissions.users.delete,
      canViewDashboard: permissions.dashboard.view,
      canViewRoutes: permissions.routes.view,
      canViewRealtime:
        permissions.realtime.viewLocations || permissions.realtime.viewStatus,
    };

    return caps;
  }, [permissions]);

  // Check if user can access a specific feature
  const canAccess = useCallback(
    (feature) => {
      const featurePermissions = {
        jobs: permissions.jobs.read,
        customers: permissions.customers.read,
        users: permissions.users.read,
        dashboard: permissions.dashboard.view,
        routes: permissions.routes.view,
        realtime:
          permissions.realtime.viewLocations || permissions.realtime.viewStatus,
      };

      return featurePermissions[feature] || false;
    },
    [permissions]
  );

  return {
    // Permission objects
    permissions,

    // Permission check functions
    hasPermission,
    canPerform,
    canPerformAny,
    canAccess,

    // Role checks
    isAdmin,
    isTechnician,
    isManager,

    // Capabilities
    capabilities,

    // User info
    user,
  };
};
