import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Device extends Model {
  public id!: number;
  public name!: string;
  public type!: string;
  public location!: string;
  public status!: string;
  public lastSeen!: Date | null;
  public parameters!: object;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Device.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['sensor', 'actuator', 'gateway']],
      },
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'offline',
      validate: {
        isIn: [['online', 'offline', 'warning', 'error']],
      },
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'devices',
    timestamps: true,
  }
);

export default Device;
