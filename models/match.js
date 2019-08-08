'use strict';
module.exports = (sequelize, DataTypes) => {
  const Match = sequelize.define('Match', {
    name: DataTypes.STRING,
    csId: DataTypes.STRING,
    countryName: DataTypes.STRING,
    countryAltName: DataTypes.STRING,
    firstTeamName: DataTypes.STRING,
    secondTeamName: DataTypes.STRING,
    date: DataTypes.DATE,
    tournamentName: DataTypes.STRING,
    tournamentAltName: DataTypes.STRING,
    season: DataTypes.STRING,
    referee: DataTypes.STRING,
    firstTeamScore: DataTypes.INTEGER,
    secondTeamScore: DataTypes.INTEGER,
    firstTeamYellowCards: DataTypes.INTEGER,
    secondTeamYellowCards: DataTypes.INTEGER,
    firstTeamRedCards: DataTypes.INTEGER,
    secondTeamRedCards: DataTypes.INTEGER,
    firstTeamSubs: DataTypes.INTEGER,
    secondTeamSubs: DataTypes.INTEGER,
    firstTeamCorner: DataTypes.INTEGER,
    firstTeamCornerFirstHalf: DataTypes.INTEGER,
    secondTeamCorner: DataTypes.INTEGER,
    secondTeamCornerFirstHalf: DataTypes.INTEGER,
    firstTeamKicks: DataTypes.INTEGER,
    secondTeamKicks: DataTypes.INTEGER,
    firstTeamShotOnGoal: DataTypes.INTEGER,
    secondTeamShotOnGoal: DataTypes.INTEGER,
    firstTeamMissedKick: DataTypes.INTEGER,
    secondTeamMissedKick: DataTypes.INTEGER,
    firstTeamBlockedKick: DataTypes.INTEGER,
    secondTeamBlockedKick: DataTypes.INTEGER,
    firstTeamFouls: DataTypes.INTEGER,
    secondTeamFouls: DataTypes.INTEGER,
    firstTeamOffside: DataTypes.INTEGER,
    secondTeamOffside: DataTypes.INTEGER,
    firstTeamHandling: DataTypes.INTEGER,
    secondTeamHandling: DataTypes.INTEGER,
    firstTeamSaves: DataTypes.INTEGER,
    secondTeamSaves: DataTypes.INTEGER,
    link: DataTypes.STRING,

  }, {});
  Match.associate = function(models) {
    // associations can be defined here
  };
  return Match;
};