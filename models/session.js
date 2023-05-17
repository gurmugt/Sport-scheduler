const {
  // eslint-disable-next-line no-unused-vars
  Model, Op,
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

      this.belongsTo(models.User, {
        foreignKey: {
          name: 'userId',
          allowNull: false,
        },
      });

      this.hasMany(models.playersList, {
        foreignKey: 'sessionId',
        onDelete: 'CASCADE',
      });
    }

    static createSessions({
      date, location, numPlayers, sportId, userId,
    }) {
      return this.create({
        date,
        location,
        numPlayers,
        sportId,
        userId,
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

    static async joined_sessions(sessionIds) {
      const sessions = await Promise.all(sessionIds.map((sessionId) => this.findAll({
        where: {
          id: sessionId,
        },
      })));
      return sessions.flat();
    }
  }
  Session.init(
    {
      date: DataTypes.DATE,
      location: DataTypes.STRING,
      numPlayers: DataTypes.STRING,
      sportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Sport',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Session',
    },
  );
  return Session;
};
