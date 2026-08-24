import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Device from './Device';

export class DeviceData extends Model {
  public id!: number;
  public deviceId!: number;
  public temperature!: number | null;
  public humidity!: number | null;
  public data!: object;
  public readonly timestamp!: Date;
  public readonly createdAt!: Date;
}

DeviceData.init(
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
    temperature: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    humidity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'device_data',
    timestamps: false,
    indexes: [
      {
        fields: ['deviceId', 'timestamp'],
      },
    ],
  }
);

DeviceData.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });
Device.hasMany(DeviceData, { foreignKey: 'deviceId', as: 'dataPoints' });

export default DeviceData;
