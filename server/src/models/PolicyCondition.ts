import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class PolicyCondition extends Model {
  public id!: number;
  public policyId!: number;
  public subjectAttr!: string | null;
  public resourceAttr!: string | null;
  public actionAttr!: string | null;
  public environmentAttr!: string | null;
  public operator!: string;
  public value!: string;
  public readonly createdAt!: Date;
}

PolicyCondition.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    policyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'policies',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    subjectAttr: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    resourceAttr: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    actionAttr: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    environmentAttr: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    operator: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'policy_conditions',
    timestamps: true,
    updatedAt: false,
  }
);

export default PolicyCondition;
