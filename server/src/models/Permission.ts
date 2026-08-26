import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Permission extends Model {
  public id!: number;
  public name!: string;
  public resource!: string;
  public action!: string;
  public readonly createdAt!: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
    updatedAt: false,
  }
);

export default Permission;
