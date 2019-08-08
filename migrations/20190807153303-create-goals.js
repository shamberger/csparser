'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Goals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      matchCsId: {
        type: Sequelize.INTEGER
      },
      firstTeamGoals: {
        type: Sequelize.INTEGER
      },
      secondTeamGoals: {
        type: Sequelize.INTEGER
      },
      goalBy: {
        type: Sequelize.STRING
      },
      minute: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Goals');
  }
};