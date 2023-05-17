const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class playersList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      this.belongsTo(models.Session, {
        foreignKey: {
          name: 'sessionId',
          allowNull: false,
          onDelete: 'CASCADE',
        },
      });
    }

    // eslint-disable-next-line no-empty-function
    static async createPlayers(players, name, id) {
      const playersArray = players.trim().split(',');
      await playersArray.forEach((player) => {
        this.create({
          name: player,
          sessionId: id,
        });
      });
      this.create({
        name,
        sessionId: id,
      });
    }

    static async removePlayers(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static async updatePlayers(players, sessionId) {
      await this.destroy({
        where: {
          sessionId,
        },
      });
      const playersLists = players.trim().split(','); // ['Player 1', 'Player 2', 'Player 3', ....]
      await playersLists.forEach((name) => {
        this.create({
          name,
          sessionId,
        });
      });
    }
  }

  playersList.init({
    name: DataTypes.STRING,
    sessionId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'playersList',
  });
  return playersList;
};
