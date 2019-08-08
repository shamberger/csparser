'use strict';
module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define('Card', {
    matchCsId: DataTypes.INTEGER,
    firstTeamCards: DataTypes.INTEGER,
    secondTeamCards: DataTypes.INTEGER,
    minute: DataTypes.INTEGER,
    type: DataTypes.STRING,
    forTeam: DataTypes.INTEGER
  }, {});
  Card.associate = function(models) {
    // associations can be defined here
  };
  return Card;
};