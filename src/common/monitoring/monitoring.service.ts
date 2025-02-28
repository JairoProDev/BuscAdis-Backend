import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  getSystemMetrics() {
    return {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: (1 - os.freemem() / os.totalmem()) * 100,
      },
      cpu: {
        loadAvg: os.loadavg(),
        cores: os.cpus().length,
      },
      uptime: os.uptime(),
    };
  }
} 