'use strict';
module.exports = (sequelize, DataTypes) => {
  const Tournament = sequelize.define('Tournament', {
    name: DataTypes.STRING,
    altName: DataTypes.STRING,
    countryAltName: DataTypes.STRING,
    link: DataTypes.STRING,
    allImported: DataTypes.BOOLEAN,
    status: DataTypes.STRING
  }, {});
  Tournament.associate = function(models) {
    Tournament.belongsTo(models.Country, {foreignKey: 'countryAltName', targetKey: 'altName', as: 'country'})
  };
  return Tournament;
};