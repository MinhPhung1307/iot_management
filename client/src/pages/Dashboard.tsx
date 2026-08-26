import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { deviceAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { DeviceStats, Device } from '../types';

const STATUS_COLORS = {
  online: '#10B981',
  offline: '#9CA3AF',
  warning: '#F59E0B',
  error: '#EF4444',
};

const Dashboard = () => {
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const { isConnected, onDeviceUpdate } = useSocket();

  const loadStats = async () => {
    try {
      const response = await deviceAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await deviceAPI.getAll({ limit: 10 });
      setDevices(response.data.devices);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const debouncedLoadStats = useDebouncedCallback(useCallback(() => {
    loadStats();
  }, []), 2000);

  useEffect(() => {
    loadStats();
    loadDevices();
  }, []);

  useEffect(() => {
    const cleanup = onDeviceUpdate((data) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === data.deviceId
            ? { ...d, status: data.status, lastSeen: data.lastSeen }
            : d
        )
      );
      debouncedLoadStats();
    });

    return cleanup;
  }, [onDeviceUpdate, debouncedLoadStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-400';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getPieChartData = () => {
    if (!stats) return [];
    return [
      { name: 'Online', value: stats.byStatus.online },
      { name: 'Offline', value: stats.byStatus.offline },
      { name: 'Warning', value: stats.byStatus.warning },
      { name: 'Error', value: stats.byStatus.error },
    ].filter((item) => item.value > 0);
  };

  const getTypeChartData = () => {
    if (!stats) return [];
    return stats.byType.map((item) => ({
      name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
      count: parseInt(item.count as any),
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center">
          <span
            className={`inline-block w-3 h-3 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Devices</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Online</h3>
              <p className="text-2xl font-bold text-green-600">{stats.byStatus.online}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Offline</h3>
              <p className="text-2xl font-bold text-gray-500">{stats.byStatus.offline}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Warning</h3>
              <p className="text-2xl font-bold text-yellow-500">{stats.byStatus.warning}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Error</h3>
              <p className="text-2xl font-bold text-red-500">{stats.byStatus.error}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Device Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name.toLowerCase() as keyof typeof STATUS_COLORS]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Devices by Type</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getTypeChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Devices</h2>
          <Link to="/devices" className="text-sm text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link to={`/devices/${device.id}`} className="text-indigo-600 hover:text-indigo-500">
                      {device.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${getStatusColor(
                          device.status
                        )} mr-2`}
                      />
                      <span className="text-sm text-gray-700">{device.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
