'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Subs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      matchCsId: {
        type: Sequelize.INTEGER
      },
      firstTeamSubs: {
        type: Sequelize.INTEGER
      },
      secondTeamSubs: {
        type: Sequelize.INTEGER
      },
      team: {
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
    return queryInterface.dropTable('Subs');
  }
};