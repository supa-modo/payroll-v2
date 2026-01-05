import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Add password reset fields to users table
    await queryInterface.addColumn("users", "password_reset_token", {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "password_reset_token",
    });

    await queryInterface.addColumn("users", "password_reset_expires", {
      type: DataTypes.DATE,
      allowNull: true,
      field: "password_reset_expires",
    });

    // Add index on password_reset_token for faster lookups
    await queryInterface.addIndex("users", ["password_reset_token"], {
      name: "idx_users_password_reset_token",
      where: {
        password_reset_token: { [require("sequelize").Op.ne]: null },
      },
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Remove index
    await queryInterface.removeIndex("users", "idx_users_password_reset_token");

    // Remove columns
    await queryInterface.removeColumn("users", "password_reset_expires");
    await queryInterface.removeColumn("users", "password_reset_token");
  },
};

