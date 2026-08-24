import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Device from './Device';

export class Alert extends Model {
  public id!: number;
  public deviceId!: number;
  public type!: string;
  public message!: string;
  public severity!: string;
  public isResolved!: boolean;
  public readonly createdAt!: Date;
}

Alert.init(
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'info',
      validate: {
        isIn: [['info', 'warning', 'critical']],
      },
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'alerts',
    timestamps: true,
    updatedAt: false,
  }
);

Alert.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });
Device.hasMany(Alert, { foreignKey: 'deviceId', as: 'alerts' });

export default Alert;
