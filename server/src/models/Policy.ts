import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Policy extends Model {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public effect!: 'permit' | 'deny';
  public priority!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Policy.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    effect: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['permit', 'deny']],
      },
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'policies',
    timestamps: true,
  }
);

export default Policy;
