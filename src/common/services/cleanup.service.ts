import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CleanupService {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    const tempDir = path.join(process.cwd(), 'temp');
    await this.cleanDirectory(tempDir);
  }

  private async cleanDirectory(directory: string): Promise<void> {
    try {
      const files = await fs.readdir(directory);
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        if (Date.now() - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      // Manejar error
    }
  }
} 