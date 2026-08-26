import { Transaction } from 'sequelize';
import DeviceData from '../models/DeviceData';
import sequelize from '../config/database';

interface PendingData {
  deviceId: number;
  temperature: number | null;
  humidity: number | null;
  data: object;
  timestamp: Date;
}

const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 100;

class BatchWriter {
  private buffer: PendingData[] = [];
  private timer: NodeJS.Timeout | null = null;
  private flushing = false;

  start(): void {
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    console.log(`BatchWriter started (interval=${FLUSH_INTERVAL_MS}ms, maxSize=${MAX_BUFFER_SIZE})`);
  }

  add(
    deviceId: number,
    telemetry: { temperature?: number; humidity?: number; [key: string]: any }
  ): void {
    this.buffer.push({
      deviceId,
      temperature: telemetry.temperature ?? null,
      humidity: telemetry.humidity ?? null,
      data: telemetry,
      timestamp: new Date(),
    });

    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;

    this.flushing = true;
    const batch = this.buffer.splice(0, this.buffer.length);

    let transaction: Transaction | null = null;
    try {
      transaction = await sequelize.transaction();
      await DeviceData.bulkCreate(batch as any, { transaction });
      await transaction.commit();
      transaction = null;
    } catch (err) {
      if (transaction) await transaction.rollback();
      console.error(`BatchWriter: bulkCreate failed (${batch.length} records), retrying individually...`);
      // Fallback: write individually so data is not lost
      for (const record of batch) {
        try {
          await DeviceData.create(record as any);
        } catch (e) {
          console.error(`BatchWriter: individual create failed for deviceId=${record.deviceId}`, e);
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.flush();
    console.log('BatchWriter stopped');
  }

  getBufferSize(): number {
    return this.buffer.length;
  }
}

export const batchWriter = new BatchWriter();
