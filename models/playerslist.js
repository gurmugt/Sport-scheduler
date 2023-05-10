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
    static async createPlayers(players, id) {
      const playersArray = players.trim().split(',');
      await playersArray.forEach((player) => {
        this.create({
          name: player,
          sessionId: id,
        });
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
      const playersArray = players.trim().split(',');
      console.log('Function called');
      console.log(playersArray);
      await playersArray.forEach((name) => {
        console.log(name);
        this.update(
          {
            name,
          },
          {
            where: {
              sessionId,
            },
          },
        );
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
