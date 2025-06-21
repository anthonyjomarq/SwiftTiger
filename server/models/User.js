import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "../config/database.js";

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
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "last_name",
    },
    role: {
      type: DataTypes.ENUM("admin", "dispatcher", "technician"),
      allowNull: false,
      defaultValue: "technician",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    lastLogin: {
      type: DataTypes.DATE,
      field: "last_login",
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "password_changed_at",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "Bio cannot exceed 500 characters",
        },
      },
    },

    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: "Department cannot exceed 100 characters",
        },
      },
    },

    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: "Location cannot exceed 255 characters",
        },
      },
    },

    profilePictureUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "profile_picture_url",
      validate: {
        isUrl: {
          msg: "Profile picture must be a valid URL",
        },
      },
    },
  },
  {
    tableName: "users",
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
          user.passwordChangedAt = new Date();
        }
      },
    },
  }
);

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

User.prototype.getPublicProfile = function () {
  const values = this.get();
  delete values.password;
  return values;
};

User.prototype.getBasicInfo = function () {
  return {
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
  };
};

export default User;
