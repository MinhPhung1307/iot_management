import mqtt from 'mqtt';
import dotenv from 'dotenv';
import Device from '../models/Device';
import DeviceData from '../models/DeviceData';
import PubSubService, { PubSubChannels } from '../services/pubsub.service';

dotenv.config();

class MQTTClient {
  private client: mqtt.MqttClient | null = null;
  private brokerUrl: string;
  private topic: string;
  private pubsub: PubSubService | null = null;

  constructor() {
    this.brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
    this.topic = process.env.MQTT_TOPIC || 'iot/devices';
  }

  setPubSub(pubsub: PubSubService): void {
    this.pubsub = pubsub;
  }

  connect(): void {
    const options: mqtt.IClientOptions = {};

    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;

    if (username) {
      options.username = username;
    }
    if (password) {
      options.password = password;
    }

    this.client = mqtt.connect(this.brokerUrl, options);

    this.client.on('connect', () => {
      console.log('MQTT connected to broker');

      this.client?.subscribe(`${this.topic}/#`, (err) => {
        if (!err) {
          console.log(`Subscribed to topic: ${this.topic}/#`);
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        await this.handleMessage(topic, payload);
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    this.client.on('error', (err) => {
      console.error('MQTT connection error:', err.message);
    });

    this.client.on('offline', () => {
      console.log('MQTT client offline');
    });

    this.client.on('reconnect', () => {
      console.log('MQTT client reconnecting...');
    });
  }

  private async handleMessage(topic: string, payload: any): Promise<void> {
    const topicParts = topic.split('/');
    const deviceId = topicParts[2];
    const messageType = topicParts[3];

    if (!deviceId) return;

    // Ignore command messages (only process data messages)
    if (messageType === 'command') return;

    const device = await Device.findOne({ where: { name: deviceId } });

    if (!device) {
      console.log(`Device not found: ${deviceId}`);
      return;
    }

    await device.update({
      status: payload.status || 'online',
      lastSeen: new Date(),
    });

    if (payload.data) {
      await DeviceData.create({
        deviceId: device.id,
        temperature: payload.data.temperature || null,
        humidity: payload.data.humidity || null,
        data: payload.data,
        timestamp: new Date(),
      });
    }

    if (!this.pubsub) return;

    // Publish device status update
    this.pubsub.publish(PubSubChannels.DEVICE_UPDATE, {
      id: device.id,
      name: device.name,
      status: payload.status || 'online',
      lastSeen: new Date(),
    });

    // Publish telemetry data (was missing before)
    if (payload.data) {
      this.pubsub.publish(PubSubChannels.DEVICE_DATA, {
        deviceId: device.id,
        temperature: payload.data.temperature || null,
        humidity: payload.data.humidity || null,
        timestamp: new Date(),
      });
    }
  }

  publish(topic: string, message: any): void {
    if (!this.client || !this.client.connected) {
      console.error('MQTT client not connected');
      return;
    }

    const payload = JSON.stringify(message);
    this.client.publish(topic, payload, (err) => {
      if (err) {
        console.error('MQTT publish error:', err);
      } else {
        console.log(`MQTT published to ${topic}:`, message);
      }
    });
  }

  sendCommand(deviceName: string, command: any): void {
    const topic = `${this.topic}/${deviceName}/command`;
    this.publish(topic, command);
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      console.log('MQTT client disconnected');
    }
  }
}

export const mqttClient = new MQTTClient();
