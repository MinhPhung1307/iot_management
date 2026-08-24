import { Response } from 'express';
import DeviceGroup, { DeviceGroupMember } from '../models/DeviceGroup';
import Device from '../models/Device';
import { AuthRequest } from '../types';

export const getGroups = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
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

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error });
  }
};

export const getGroupById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const group = await DeviceGroup.findByPk(req.params.id, {
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
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group', error });
  }
};

export const createGroup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, deviceIds } = req.body;

    const existingGroup = await DeviceGroup.findOne({ where: { name } });
    if (existingGroup) {
      res.status(400).json({ message: 'Group name already exists' });
      return;
    }

    const group = await DeviceGroup.create({
      name,
      description,
      createdBy: req.user!.id,
    });

    if (deviceIds && deviceIds.length > 0) {
      await DeviceGroupMember.bulkCreate(
        deviceIds.map((deviceId: number) => ({
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

    res.status(201).json({
      message: 'Group created successfully',
      group: groupWithDevices,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error });
  }
};

export const updateGroup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const group = await DeviceGroup.findByPk(req.params.id);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    const { name, description, deviceIds } = req.body;

    await group.update({ name, description });

    if (deviceIds) {
      await DeviceGroupMember.destroy({ where: { groupId: group.id } });
      await DeviceGroupMember.bulkCreate(
        deviceIds.map((deviceId: number) => ({
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

    res.json({
      message: 'Group updated successfully',
      group: updatedGroup,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating group', error });
  }
};

export const deleteGroup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const group = await DeviceGroup.findByPk(req.params.id);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    await DeviceGroupMember.destroy({ where: { groupId: group.id } });
    await group.destroy();

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting group', error });
  }
};
