import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Device from './Device';

export class DeviceGroup extends Model {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DeviceGroup.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'device_groups',
    timestamps: true,
  }
);

// Many-to-many relationship
const DeviceGroupMember = sequelize.define(
  'DeviceGroupMember',
  {
    groupId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    tableName: 'device_group_members',
    timestamps: false,
  }
);

DeviceGroup.belongsToMany(Device, {
  through: DeviceGroupMember,
  foreignKey: 'groupId',
  as: 'devices',
});

Device.belongsToMany(DeviceGroup, {
  through: DeviceGroupMember,
  foreignKey: 'deviceId',
  as: 'groups',
});

export { DeviceGroupMember };
export default DeviceGroup;
