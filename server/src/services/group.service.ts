import DeviceGroup, { DeviceGroupMember } from '../models/DeviceGroup';
import Device from '../models/Device';
import { NotFoundError, ConflictError } from '../middleware/AppError';

export const getGroups = async () => {
  const groups = await DeviceGroup.findAll({
    include: [
      {
        model: Device,
        as: 'devices',
        attributes: ['id', 'name', 'type', 'status'],
        through: { attributes: [] },
      },
    ],
  });

  return { groups };
};

export const getGroupById = async (id: number) => {
  const group = await DeviceGroup.findByPk(id, {
    include: [
      {
        model: Device,
        as: 'devices',
        attributes: ['id', 'name', 'type', 'status', 'location'],
        through: { attributes: [] },
      },
    ],
  });

  if (!group) {
    throw new NotFoundError('Group');
  }

  return { group };
};

export const createGroup = async (
  data: { name: string; description?: string; deviceIds?: number[] },
  userId: number
) => {
  const existingGroup = await DeviceGroup.findOne({
    where: { name: data.name },
  });
  if (existingGroup) {
    throw new ConflictError('Group name already exists');
  }

  const group = await DeviceGroup.create({
    name: data.name,
    description: data.description,
    createdBy: userId,
  });

  if (data.deviceIds && data.deviceIds.length > 0) {
    await DeviceGroupMember.bulkCreate(
      data.deviceIds.map((deviceId) => ({
        groupId: group.id,
        deviceId,
      }))
    );
  }

  const groupWithDevices = await DeviceGroup.findByPk(group.id, {
    include: [
      {
        model: Device,
        as: 'devices',
        through: { attributes: [] },
      },
    ],
  });

  return { group: groupWithDevices };
};

export const updateGroup = async (
  id: number,
  data: { name?: string; description?: string; deviceIds?: number[] }
) => {
  const group = await DeviceGroup.findByPk(id);

  if (!group) {
    throw new NotFoundError('Group');
  }

  await group.update({ name: data.name, description: data.description });

  if (data.deviceIds) {
    await DeviceGroupMember.destroy({ where: { groupId: group.id } });
    await DeviceGroupMember.bulkCreate(
      data.deviceIds.map((deviceId) => ({
        groupId: group.id,
        deviceId,
      }))
    );
  }

  const updatedGroup = await DeviceGroup.findByPk(group.id, {
    include: [
      {
        model: Device,
        as: 'devices',
        through: { attributes: [] },
      },
    ],
  });

  return { group: updatedGroup };
};

export const deleteGroup = async (id: number) => {
  const group = await DeviceGroup.findByPk(id);

  if (!group) {
    throw new NotFoundError('Group');
  }

  await DeviceGroupMember.destroy({ where: { groupId: group.id } });
  await group.destroy();
};
