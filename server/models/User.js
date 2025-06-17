import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import { sequelize } from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "unique_email",
        msg: "Email address already exists",
      },
      validate: {
        isEmail: {
          msg: "Please provide a valid email address",
        },
        len: {
          args: [3, 255],
          msg: "Email must be between 3 and 255 characters",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: "Password must be at least 6 characters long",
        },
      },
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [1, 50],
          msg: "First name must be between 1 and 50 characters",
        },
        notEmpty: {
          msg: "First name is required",
        },
      },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [1, 50],
          msg: "Last name must be between 1 and 50 characters",
        },
        notEmpty: {
          msg: "Last name is required",
        },
      },
    },
    role: {
      type: DataTypes.ENUM("admin", "dispatcher", "technician"),
      allowNull: false,
      defaultValue: "technician",
      validate: {
        isIn: {
          args: [["admin", "dispatcher", "technician"]],
          msg: "Role must be admin, dispatcher, or technician",
        },
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: /^[\+]?[1-9][\d]{0,15}$/,
          msg: "Please provide a valid phone number",
        },
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "users",
    indexes: [], // Disable automatic index creation
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
          user.password_changed_at = new Date();
        }
      },
    },
  }
);

// Instance methods
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.toSafeObject = function () {
  const { password, ...safeUser } = this.toJSON();
  return safeUser;
};

User.prototype.isPasswordChangedAfter = function (JWTTimestamp) {
  if (this.password_changed_at) {
    const changedTimestamp = parseInt(
      this.password_changed_at.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Class methods
User.findByEmail = function (email) {
  return this.findOne({ where: { email: email.toLowerCase() } });
};

User.findActiveUsers = function () {
  return this.findAll({ where: { is_active: true } });
};

User.findByRole = function (role) {
  return this.findAll({ where: { role, is_active: true } });
};

export default User;
