import { Op } from "sequelize";
import User from "../models/User.js";
import { logAction } from "../services/actionLogger.js";

export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      isActive = "",
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Only add isActive filter if it's explicitly set to true or false
    if (isActive === "true") {
      where.isActive = true;
    } else if (isActive === "false") {
      where.isActive = false;
    }
    // If isActive is empty string, don't filter by it

    if (role) {
      where.role = role;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    await logAction(req, "VIEW_USERS", "USER", null, {
      filters: { search, role, isActive },
      count,
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await logAction(req, "VIEW_USER", "USER", id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent non-admins from changing roles
    if (req.user.role !== "admin" && updates.role) {
      delete updates.role;
    }

    // Update user
    await user.update(updates);

    // Log action
    await logAction(req, "UPDATE_USER", "USER", id, {
      updates: Object.keys(updates),
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate your own account",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.update({ isActive: false });

    await logAction(req, "DEACTIVATE_USER", "USER", id);

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
    });
  }
};

export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.update({ isActive: true });

    await logAction(req, "ACTIVATE_USER", "USER", id);

    res.json({
      success: true,
      message: "User activated successfully",
    });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to activate user",
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({
      where: { isActive: true },
    });

    const adminCount = await User.count({
      where: { role: "admin" },
    });

    const dispatcherCount = await User.count({
      where: { role: "dispatcher" },
    });

    const technicianCount = await User.count({
      where: { role: "technician" },
    });

    const stats = {
      totalUsers,
      activeUsers,
      byRole: {
        admin: adminCount,
        dispatcher: dispatcherCount,
        technician: technicianCount,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics",
    });
  }
};
