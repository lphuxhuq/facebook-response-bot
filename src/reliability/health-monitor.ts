import { logger } from '../utils/logger.js';

export type TransportHealthStatus = 'CONNECTED' | 'DEGRADED' | 'PAUSED' | 'AUTH_ERROR' | 'DISCONNECTED';

export class HealthMonitor {
  private status: TransportHealthStatus = 'CONNECTED';
  private pauseReason: string = '';
  private botEnabled: boolean = true;

  constructor(initialEnabled: boolean = true) {
    this.botEnabled = initialEnabled;
    if (!this.botEnabled) {
      this.status = 'PAUSED';
      this.pauseReason = 'Disabled via configuration (BOT_ENABLED=false)';
    }
  }

  getStatus(): { status: TransportHealthStatus; botEnabled: boolean; reason: string } {
    return {
      status: this.status,
      botEnabled: this.botEnabled,
      reason: this.pauseReason,
    };
  }

  pause(reason: string = 'Manually paused'): void {
    this.status = 'PAUSED';
    this.pauseReason = reason;
    logger.warn({ reason }, 'Bot execution paused via HealthMonitor');
  }

  resume(): void {
    this.status = 'CONNECTED';
    this.pauseReason = '';
    logger.info('Bot execution resumed');
  }

  setAuthError(reason: string): void {
    this.status = 'AUTH_ERROR';
    this.pauseReason = reason;
    logger.fatal({ reason }, 'Transport authentication error: Bot paused to protect account');
  }

  isExecutionAllowed(): boolean {
    return this.botEnabled && this.status !== 'PAUSED' && this.status !== 'AUTH_ERROR';
  }
}
