const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      this.belongsTo(models.Sport, {
        foreignKey: {
          name: 'sportId',
          allowNull: false,
          onDelete: 'CASCADE',
        },
      });

      this.hasMany(models.playersList, {
        foreignKey: 'sessionId',
        onDelete: 'CASCADE',
      });
    }

    static createSessions({
      date, location, numPlayers, sportId,
    }) {
      return this.create({
        date,
        location,
        numPlayers,
        sportId,
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
    sportId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};
