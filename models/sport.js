const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    static associate(models) {
      this.hasMany(models.Session, {
        foreignKey: 'sportId',
      });
    }

    static createSport(name) {
      return this.create({
        name,
      });
    }
  }

  Sport.init({
    name: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Sport',
  });

  return Sport;
};
