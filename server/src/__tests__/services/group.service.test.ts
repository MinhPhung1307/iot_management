import { AppError } from '../../middleware/AppError';

jest.mock('../../models/DeviceGroup', () => {
  const mockModel: any = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const mockMember: any = {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockModel,
    DeviceGroupMember: mockMember,
  };
});

jest.mock('../../models/Device', () => {
  const mockModel: any = {};
  return { __esModule: true, default: mockModel };
});

import DeviceGroup, { DeviceGroupMember } from '../../models/DeviceGroup';
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../../services/group.service';

const mockDeviceGroup = DeviceGroup as any;
const mockDeviceGroupMember = DeviceGroupMember as any;

describe('group.service', () => {
  const fakeGroup = {
    id: 1,
    name: 'Sensor Group',
    description: 'All sensors',
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    update: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGroups', () => {
    it('should return all groups with devices', async () => {
      mockDeviceGroup.findAll.mockResolvedValue([fakeGroup]);

      const result = await getGroups();

      expect(mockDeviceGroup.findAll).toHaveBeenCalledWith({
        include: [
          expect.objectContaining({
            as: 'devices',
            attributes: ['id', 'name', 'type', 'status'],
          }),
        ],
      });
      expect(result.groups).toEqual([fakeGroup]);
    });
  });

  describe('getGroupById', () => {
    it('should return group with devices', async () => {
      mockDeviceGroup.findByPk.mockResolvedValue(fakeGroup);

      const result = await getGroupById(1);

      expect(mockDeviceGroup.findByPk).toHaveBeenCalledWith(1, {
        include: [
          expect.objectContaining({
            as: 'devices',
            attributes: ['id', 'name', 'type', 'status', 'location'],
          }),
        ],
      });
      expect(result.group).toBe(fakeGroup);
    });

    it('should throw NotFoundError when group does not exist', async () => {
      mockDeviceGroup.findByPk.mockResolvedValue(null);

      await expect(getGroupById(999)).rejects.toThrow(AppError);

      try {
        await getGroupById(999);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).message).toBe('Group not found');
      }
    });
  });

  describe('createGroup', () => {
    it('should create group without deviceIds', async () => {
      mockDeviceGroup.findOne.mockResolvedValue(null);
      mockDeviceGroup.create.mockResolvedValue(fakeGroup);
      mockDeviceGroup.findByPk.mockResolvedValue(fakeGroup);

      const result = await createGroup(
        { name: 'Sensor Group', description: 'All sensors' },
        1
      );

      expect(mockDeviceGroup.create).toHaveBeenCalledWith({
        name: 'Sensor Group',
        description: 'All sensors',
        createdBy: 1,
      });
      expect(mockDeviceGroupMember.bulkCreate).not.toHaveBeenCalled();
      expect(result.group).toBe(fakeGroup);
    });

    it('should create group with deviceIds', async () => {
      mockDeviceGroup.findOne.mockResolvedValue(null);
      mockDeviceGroup.create.mockResolvedValue(fakeGroup);
      mockDeviceGroup.findByPk.mockResolvedValue(fakeGroup);
      mockDeviceGroupMember.bulkCreate.mockResolvedValue([]);

      await createGroup(
        { name: 'Sensor Group', deviceIds: [1, 2, 3] },
        1
      );

      expect(mockDeviceGroupMember.bulkCreate).toHaveBeenCalledWith([
        { groupId: 1, deviceId: 1 },
        { groupId: 1, deviceId: 2 },
        { groupId: 1, deviceId: 3 },
      ]);
    });

    it('should throw ConflictError if name already exists', async () => {
      mockDeviceGroup.findOne.mockResolvedValue(fakeGroup);

      await expect(
        createGroup({ name: 'Sensor Group' }, 1)
      ).rejects.toThrow(AppError);

      try {
        await createGroup({ name: 'Sensor Group' }, 1);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(409);
        expect((e as AppError).message).toBe('Group name already exists');
      }

      expect(mockDeviceGroup.create).not.toHaveBeenCalled();
    });
  });

  describe('updateGroup', () => {
    it('should update group fields', async () => {
      const existingGroup = {
        ...fakeGroup,
        update: jest.fn(),
      };
      mockDeviceGroup.findByPk
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(fakeGroup);

      await updateGroup(1, {
        name: 'Updated Group',
        description: 'Updated desc',
      });

      expect(existingGroup.update).toHaveBeenCalledWith({
        name: 'Updated Group',
        description: 'Updated desc',
      });
    });

    it('should update deviceIds', async () => {
      const existingGroup = {
        ...fakeGroup,
        update: jest.fn(),
      };
      mockDeviceGroup.findByPk
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(fakeGroup);
      mockDeviceGroupMember.destroy.mockResolvedValue([]);
      mockDeviceGroupMember.bulkCreate.mockResolvedValue([]);

      await updateGroup(1, { deviceIds: [4, 5] });

      expect(mockDeviceGroupMember.destroy).toHaveBeenCalledWith({
        where: { groupId: 1 },
      });
      expect(mockDeviceGroupMember.bulkCreate).toHaveBeenCalledWith([
        { groupId: 1, deviceId: 4 },
        { groupId: 1, deviceId: 5 },
      ]);
    });

    it('should not call destroy/bulkCreate if deviceIds not provided', async () => {
      const existingGroup = {
        ...fakeGroup,
        update: jest.fn(),
      };
      mockDeviceGroup.findByPk
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(fakeGroup);

      await updateGroup(1, { name: 'New Name' });

      expect(mockDeviceGroupMember.destroy).not.toHaveBeenCalled();
      expect(mockDeviceGroupMember.bulkCreate).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when group does not exist', async () => {
      mockDeviceGroup.findByPk.mockResolvedValue(null);

      await expect(updateGroup(999, { name: 'test' })).rejects.toThrow(AppError);

      try {
        await updateGroup(999, { name: 'test' });
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });

  describe('deleteGroup', () => {
    it('should delete group and its members', async () => {
      const destroyableGroup = {
        ...fakeGroup,
        destroy: jest.fn(),
      };
      mockDeviceGroup.findByPk.mockResolvedValue(destroyableGroup);
      mockDeviceGroupMember.destroy.mockResolvedValue([]);

      await deleteGroup(1);

      expect(mockDeviceGroupMember.destroy).toHaveBeenCalledWith({
        where: { groupId: 1 },
      });
      expect(destroyableGroup.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when group does not exist', async () => {
      mockDeviceGroup.findByPk.mockResolvedValue(null);

      await expect(deleteGroup(999)).rejects.toThrow(AppError);

      try {
        await deleteGroup(999);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });
});
