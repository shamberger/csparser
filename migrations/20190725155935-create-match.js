'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Matches', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      csId: {
        type: Sequelize.STRING
      },
      countryName: {
        type: Sequelize.STRING
      },
      countryAltName: {
        type: Sequelize.STRING
      },
      firstTeamName: {
        type: Sequelize.STRING
      },
      secondTeamName: {
        type: Sequelize.STRING
      },
      date: {
        type: Sequelize.DATE
      },
      tournamentName: {
        type: Sequelize.STRING
      },tournamentAltName: {
        type: Sequelize.STRING
      },
      season: {
        type: Sequelize.STRING
      },
      referee: {
        type: Sequelize.STRING
      },
      firstTeamScore: {
        type: Sequelize.INTEGER
      },
      secondTeamScore: {
        type: Sequelize.INTEGER
      },
      firstTeamYellowCards: {
        type: Sequelize.INTEGER
      },
      secondTeamYellowCards: {
        type: Sequelize.INTEGER
      },
      firstTeamRedCards: {
        type: Sequelize.INTEGER
      },
      secondTeamRedCards: {
        type: Sequelize.INTEGER
      },
      firstTeamSubs: {
        type: Sequelize.INTEGER
      },
      secondTeamSubs: {
        type: Sequelize.INTEGER
      },
      firstTeamCorner: {
        type: Sequelize.INTEGER
      },
      firstTeamCornerFirstHalf: {
        type: Sequelize.INTEGER
      },
      secondTeamCorner: {
        type: Sequelize.INTEGER
      },
      secondTeamCornerFirstHalf: {
        type: Sequelize.INTEGER
      },
      firstTeamKicks: {
        type:Sequelize.INTEGER
      },
      secondTeamKicks: {
        type:Sequelize.INTEGER
      },
      firstTeamShotOnGoal: {
        type:Sequelize.INTEGER
      },
      secondTeamShotOnGoal: {
        type:Sequelize.INTEGER
      },
      firstTeamMissedKick: {
        type:Sequelize.INTEGER
      },
      secondTeamMissedKick: {
        type:Sequelize.INTEGER
      },
      firstTeamBlockedKick: {
        type:Sequelize.INTEGER
      },
      secondTeamBlockedKick: {
        type:Sequelize.INTEGER
      },
      firstTeamFouls: {
        type:Sequelize.INTEGER
      },
      secondTeamFouls: {
        type:Sequelize.INTEGER
      },
      firstTeamOffside: {
        type:Sequelize.INTEGER
      },
      secondTeamOffside: {
        type:Sequelize.INTEGER
      },
      firstTeamHandling: {
        type:Sequelize.INTEGER
      },
      secondTeamHandling: {
        type:Sequelize.INTEGER
      },
      firstTeamSaves: {
        type:Sequelize.INTEGER
      },
      secondTeamSaves: {
        type:Sequelize.INTEGER
      },
      link: {
        type: Sequelize.STRING
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
    return queryInterface.dropTable('Matches');
  }
};