'use strict';
module.exports = (sequelize, DataTypes) => {
  const Sub = sequelize.define('Sub', {
    matchCsId: DataTypes.INTEGER,
    firstTeamSubs: DataTypes.INTEGER,
    secondTeamSubs: DataTypes.INTEGER,
    team: DataTypes.STRING,
    minute: DataTypes.INTEGER
  }, {});
  Sub.associate = function(models) {
    // associations can be defined here
  };
  return Sub;
};