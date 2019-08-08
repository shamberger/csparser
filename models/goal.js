'use strict';
module.exports = (sequelize, DataTypes) => {
  const Goal = sequelize.define('Goal', {
    matchCsId: DataTypes.INTEGER,
    firstTeamGoals: DataTypes.INTEGER,
    secondTeamGoals: DataTypes.INTEGER,
    goalBy: DataTypes.STRING,
    minute: DataTypes.INTEGER
  }, {});
  Goal.associate = function(models) {
    // associations can be defined here
  };
  return Goal;
};