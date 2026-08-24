import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Device from './Device';

export class CommandHistory extends Model {
  public id!: number;
  public deviceId!: number;
  public command!: string;
  public params!: object | null;
  public status!: string;
  public response!: object | null;
  public sentBy!: number;
  public readonly createdAt!: Date;
}

CommandHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Device,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    command: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    params: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'sent', 'success', 'failed', 'timeout']],
      },
    },
    response: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    sentBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'command_history',
    timestamps: true,
    updatedAt: false,
  }
);

CommandHistory.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });
Device.hasMany(CommandHistory, { foreignKey: 'deviceId', as: 'commands' });

export default CommandHistory;
