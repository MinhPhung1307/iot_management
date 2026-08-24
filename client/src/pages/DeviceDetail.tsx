import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { deviceAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { Device, DeviceData } from '../types';

interface CommandButton {
  id: string;
  label: string;
  command: string;
  params?: any;
  color: string;
  icon: React.ReactNode;
}

const DeviceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [device, setDevice] = useState<Device | null>(null);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingCommand, setSendingCommand] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [showCustomCommand, setShowCustomCommand] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const [customParams, setCustomParams] = useState('');
  const { joinDevice, leaveDevice, onDeviceData, onDeviceUpdate } = useSocket();

  // Quick command states
  const [brightness, setBrightness] = useState(80);
  const [temperature, setTemperature] = useState(25);

  useEffect(() => {
    if (id) {
      loadDevice(Number(id));
      loadDeviceData(Number(id));
      joinDevice(Number(id));
    }

    return () => {
      if (id) leaveDevice(Number(id));
    };
  }, [id]);

  useEffect(() => {
    const cleanup = onDeviceData((data) => {
      if (data.deviceId === Number(id)) {
        setDeviceData((prev) => [data, ...prev].slice(0, 100));
      }
    });

    return cleanup;
  }, [id, onDeviceData]);

  useEffect(() => {
    const cleanup = onDeviceUpdate((data) => {
      if (data.deviceId === Number(id)) {
        setDevice((prev) =>
          prev
            ? { ...prev, status: data.status, lastSeen: data.lastSeen }
            : prev
        );
      }
    });

    return cleanup;
  }, [id, onDeviceUpdate]);

  const loadDevice = async (deviceId: number) => {
    try {
      const response = await deviceAPI.getById(deviceId);
      setDevice(response.data.device);
    } catch (error) {
      console.error('Error loading device:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceData = async (deviceId: number) => {
    try {
      const response = await deviceAPI.getData(deviceId, { limit: 50 });
      setDeviceData(response.data.data);
    } catch (error) {
      console.error('Error loading device data:', error);
    }
  };

  const sendCommand = async (command: string, params: any = {}) => {
    setSendingCommand(true);
    setLastCommand(command);
    try {
      const response = await deviceAPI.sendCommand(Number(id), command, params);
      // Update device state immediately from API response
      if (response.data.device) {
        setDevice((prev) =>
          prev
            ? {
                ...prev,
                status: response.data.device.status,
                lastSeen: response.data.device.lastSeen,
              }
            : prev
        );
      }
    } catch (error) {
      console.error('Error sending command:', error);
      alert('Failed to send command');
    } finally {
      setSendingCommand(false);
      setTimeout(() => setLastCommand(null), 2000);
    }
  };

  const handleCustomCommand = async () => {
    if (!customCommand.trim()) return;
    let params = {};
    if (customParams.trim()) {
      try {
        params = JSON.parse(customParams);
      } catch {
        alert('Invalid JSON in params');
        return;
      }
    }
    await sendCommand(customCommand, params);
    setCustomCommand('');
    setCustomParams('');
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCommandButtons = (): CommandButton[] => {
    const commonButtons: CommandButton[] = [
      {
        id: 'turn_on',
        label: 'Turn On',
        command: 'turn_on',
        color: 'bg-green-600 hover:bg-green-700',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
      },
      {
        id: 'turn_off',
        label: 'Turn Off',
        command: 'turn_off',
        color: 'bg-gray-600 hover:bg-gray-700',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ),
      },
      {
        id: 'reboot',
        label: 'Reboot',
        command: 'reboot',
        color: 'bg-yellow-600 hover:bg-yellow-700',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      },
      {
        id: 'reset',
        label: 'Factory Reset',
        command: 'factory_reset',
        color: 'bg-red-600 hover:bg-red-700',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
      },
    ];

    if (device?.type === 'actuator') {
      return [
        ...commonButtons.slice(0, 2),
        {
          id: 'set_brightness',
          label: 'Set Brightness',
          command: 'set_brightness',
          params: { brightness },
          color: 'bg-purple-600 hover:bg-purple-700',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        ...commonButtons.slice(2),
      ];
    }

    return commonButtons;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!device) {
    return <div className="text-center py-8">Device not found</div>;
  }

  const chartData = deviceData
    .map((d) => ({
      time: new Date(d.timestamp).toLocaleTimeString(),
      temperature: d.temperature,
      humidity: d.humidity,
    }))
    .reverse();

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/devices')}
          className="text-indigo-600 hover:text-indigo-500 mb-2"
        >
          ← Back to Devices
        </button>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{device.name}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(
              device.status
            )}`}
          >
            {device.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Type</h3>
          <p className="text-lg font-semibold text-gray-900">{device.type}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
          <p className="text-lg font-semibold text-gray-900">{device.location || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last Seen</h3>
          <p className="text-lg font-semibold text-gray-900">
            {device.lastSeen ? formatDate(device.lastSeen) : 'Never'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Parameters</h3>
        <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(device.parameters, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Real-time Data</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                stroke="#EF4444"
                name="Temperature (°C)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="humidity"
                stroke="#3B82F6"
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Remote Control</h3>
          
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {getCommandButtons().map((btn) => (
              <button
                key={btn.id}
                onClick={() => sendCommand(btn.command, btn.params)}
                disabled={sendingCommand}
                className={`${btn.color} text-white px-4 py-3 rounded-lg flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-all`}
              >
                {btn.icon}
                <span className="text-sm font-medium">{btn.label}</span>
                {lastCommand === btn.command && (
                  <span className="text-xs opacity-75">✓ Sent</span>
                )}
              </button>
            ))}
          </div>

          {/* Brightness Control */}
          {device.type === 'actuator' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Brightness</label>
                <span className="text-sm text-gray-500">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <button
                onClick={() => sendCommand('set_brightness', { brightness })}
                disabled={sendingCommand}
                className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Apply Brightness
              </button>
            </div>
          )}

          {/* Temperature Control */}
          {device.type === 'sensor' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Temperature Threshold</label>
                <span className="text-sm text-gray-500">{temperature}°C</span>
              </div>
              <input
                type="range"
                min="16"
                max="30"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <button
                onClick={() => sendCommand('set_threshold', { temperature })}
                disabled={sendingCommand}
                className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Apply Threshold
              </button>
            </div>
          )}

          {/* Custom Command */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowCustomCommand(!showCustomCommand)}
              className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
            >
              {showCustomCommand ? '− Hide' : '+ Show'} Custom Command
            </button>
            
            {showCustomCommand && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Command</label>
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder="e.g., set_color"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Params (JSON)</label>
                  <input
                    type="text"
                    value={customParams}
                    onChange={(e) => setCustomParams(e.target.value)}
                    placeholder='{"color": "#FF5733"}'
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCustomCommand}
                    disabled={sendingCommand || !customCommand.trim()}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {sendingCommand ? 'Sending...' : 'Send Custom'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;
