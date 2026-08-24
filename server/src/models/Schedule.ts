import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Device from './Device';

export class Schedule extends Model {
  public id!: number;
  public deviceId!: number;
  public name!: string;
  public command!: string;
  public params!: object | null;
  public cronExpression!: string | null;
  public scheduledTime!: Date | null;
  public isActive!: boolean;
  public lastRun!: Date | null;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Schedule.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    command: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    params: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    cronExpression: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    scheduledTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastRun: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'schedules',
    timestamps: true,
  }
);

Schedule.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });
Device.hasMany(Schedule, { foreignKey: 'deviceId', as: 'schedules' });

export default Schedule;
