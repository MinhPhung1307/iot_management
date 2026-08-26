import User from './User';
import Device from './Device';
import DeviceData from './DeviceData';
import Alert from './Alert';
import CommandHistory from './CommandHistory';
import Notification from './Notification';
import DeviceGroup from './DeviceGroup';
import Schedule from './Schedule';
import Permission from './Permission';
import Policy from './Policy';
import PolicyCondition from './PolicyCondition';

Policy.hasMany(PolicyCondition, { foreignKey: 'policyId', as: 'conditions' });
PolicyCondition.belongsTo(Policy, { foreignKey: 'policyId', as: 'policy' });

export {
  User,
  Device,
  DeviceData,
  Alert,
  CommandHistory,
  Notification,
  DeviceGroup,
  Schedule,
  Permission,
  Policy,
  PolicyCondition,
};
