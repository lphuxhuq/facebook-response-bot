import { DatabaseSync } from 'node:sqlite';

export interface PersistentScheduledJob {
  id: string;
  threadId: string;
  creatorId: string;
  type: string;
  payload?: any;
  runAt: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  attempt: number;
}

export class ScheduledJobRepository {
  constructor(private db: DatabaseSync) {}

  saveJob(job: PersistentScheduledJob): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO scheduled_jobs (id, thread_id, creator_id, type, payload, run_at, status, attempt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      job.id,
      job.threadId,
      job.creatorId,
      job.type,
      job.payload ? JSON.stringify(job.payload) : null,
      job.runAt,
      job.status,
      job.attempt
    );
  }

  getPendingJobs(): PersistentScheduledJob[] {
    const query = this.db.prepare(`
      SELECT * FROM scheduled_jobs WHERE status = 'PENDING' AND run_at <= ?
    `);
    const rows = query.all(Date.now()) as any[];
    return rows.map((r) => ({
      id: r.id,
      threadId: r.thread_id,
      creatorId: r.creator_id,
      type: r.type,
      payload: r.payload ? JSON.parse(r.payload) : undefined,
      runAt: r.run_at,
      status: r.status,
      attempt: r.attempt,
    }));
  }

  markCompleted(id: string): void {
    const update = this.db.prepare(`UPDATE scheduled_jobs SET status = 'EXECUTED' WHERE id = ?`);
    update.run(id);
  }
}
