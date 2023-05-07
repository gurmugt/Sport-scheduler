const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
      this.hasMany(models.playersList, {
        foreignKey: 'sessionId',
      });
    }

    static createSessions({
      date, location, numPlayers,
    }) {
      return this.create({
        date,
        location,
        numPlayers,
      });
    }

    static async removeSessions(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static updateSessions({
      date, location, numPlayers, id,
    }) {
      return this.update(
        {
          date,
          location,
          numPlayers,
        },
        {
          where: {
            id,
          },
        },
      );
    }
  }
  Session.init({
    date: DataTypes.DATE,
    location: DataTypes.STRING,
    numPlayers: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};
