module.exports = (sequelize, DataTypes) => {
  const Country = sequelize.define('Country', {
    name: DataTypes.STRING,
    altName: DataTypes.STRING,
    parse: DataTypes.BOOLEAN
  }, {});
  Country.associate = function(models) {
    Country.hasMany(models.Tournament, {foreignKey: 'countryAltName', sourceKey: 'altName', as: 'tournament'})
  };
  return Country;
};