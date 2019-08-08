'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Cards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      matchCsId: {
        type: Sequelize.INTEGER
      },
      firstTeamCards: {
        type: Sequelize.INTEGER
      },
      secondTeamCards: {
        type: Sequelize.INTEGER
      },
      type:{
        type: Sequelize.STRING
      },
      minute: {
        type: Sequelize.INTEGER
      },
      forTeam:{
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
    return queryInterface.dropTable('Cards');
  }
};