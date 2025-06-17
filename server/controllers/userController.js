import { User, ActionLog } from "../models/index.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { Op } from "sequelize";

const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    search,
    isActive,
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const whereClause = {};

  // Filter by role
  if (role) {
    whereClause.role = role;
  }

  // Filter by active status
  if (isActive !== undefined) {
    whereClause.is_active = isActive === "true"; // Use database column name
  }

  // Search by name or email
  if (search) {
    whereClause[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } }, // Use database column name
      { last_name: { [Op.iLike]: `%${search}%` } }, // Use database column name
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    order: [[sortBy, sortOrder.toUpperCase()]],
    limit: parseInt(limit),
    offset,
    attributes: { exclude: ["password"] },
  });

  // Log action
  await ActionLog.logAction(
    req.user.id,
    "READ",
    "USER",
    null,
    {
      filters: whereClause,
      pagination: { page, limit },
    },
    req
  );

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalUsers: count,
        hasNextPage: offset + parseInt(limit) < count,
        hasPrevPage: parseInt(page) > 1,
      },
    },
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
    include: [
      {
        model: ActionLog,
        as: "actionLogs",
        limit: 10,
        order: [["timestamp", "DESC"]],
      },
    ],
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Log action
  await ActionLog.logAction(req.user.id, "READ", "USER", id, null, req);

  res.json({
    success: true,
    data: { user },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove sensitive fields that shouldn't be updated this way
  delete updateData.password;
  delete updateData.id;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Only admins can update other users' roles
  if (updateData.role && req.user.role !== "admin" && req.user.id !== id) {
    return res.status(403).json({
      success: false,
      message: "Only admins can update user roles",
    });
  }

  // Users can only update their own profile (except admins)
  if (req.user.role !== "admin" && req.user.id !== id) {
    return res.status(403).json({
      success: false,
      message: "You can only update your own profile",
    });
  }

  const oldData = user.toJSON();
  await user.update(updateData);

  // Log action
  await ActionLog.logAction(
    req.user.id,
    "UPDATE",
    "USER",
    id,
    {
      oldData: { ...oldData, password: undefined },
      newData: { ...user.toJSON(), password: undefined },
    },
    req
  );

  res.json({
    success: true,
    message: "User updated successfully",
    data: { user: user.toSafeObject() },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Prevent self-deletion
  if (req.user.id === id) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own account",
    });
  }

  // Soft delete by deactivating the user
  await user.update({ is_active: false }); // Use database column name

  // Log action
  await ActionLog.logAction(
    req.user.id,
    "DELETE",
    "USER",
    id,
    {
      deletedUser: { ...user.toJSON(), password: undefined },
    },
    req
  );

  res.json({
    success: true,
    message: "User deactivated successfully",
  });
});

const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  await user.update({ is_active: true }); // Use database column name

  // Log action
  await ActionLog.logAction(req.user.id, "ACTIVATE", "USER", id, null, req);

  res.json({
    success: true,
    message: "User activated successfully",
    data: { user: user.toSafeObject() },
  });
});

const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;

  if (!["admin", "dispatcher", "technician"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role specified",
    });
  }

  const users = await User.findByRole(role);

  // Log action
  await ActionLog.logAction(req.user.id, "READ", "USER", null, { role }, req);

  res.json({
    success: true,
    data: { users: users.map((user) => user.toSafeObject()) },
  });
});

const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.findAll({
    attributes: [
      "role",
      [User.sequelize.fn("COUNT", User.sequelize.col("id")), "count"],
    ],
    where: { isActive: true },
    group: "role",
  });

  const totalUsers = await User.count({ where: { is_active: true } }); // Use database column name
  const inactiveUsers = await User.count({ where: { is_active: false } }); // Use database column name

  // Log action
  await ActionLog.logAction(req.user.id, "READ", "USER_STATS", null, null, req);

  res.json({
    success: true,
    data: {
      roleStats: stats,
      totalUsers,
      inactiveUsers,
    },
  });
});

export {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  getUsersByRole,
  getUserStats,
};
