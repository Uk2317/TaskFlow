import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('RESEND_API_KEY');
    this.resend = key ? new Resend(key) : null;
    this.from = config.get<string>('EMAIL_FROM') || 'TaskFlow <onboarding@resend.dev>';
  }

  async sendTaskCreated(
    to: string,
    name: string,
    task: {
      title: string;
      status: string;
      priority: string;
      dueDate?: Date;
      location?: string;
      description?: string;
    },
  ) {
    return this.send(
      to,
      `Task created: ${task.title}`,
      `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <h2 style="color:#4f46e5">Task created</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your task <strong>${task.title}</strong> has been created.</p>
        <p>Status: ${task.status} · Priority: ${task.priority}</p>
        <p>Due: ${task.dueDate ? new Date(task.dueDate).toDateString() : '—'} · Location: ${task.location || '—'}</p>
        ${task.description ? `<p>${task.description}</p>` : ''}
        <p style="color:#94a3b8;font-size:12px">— TaskFlow</p>
      </div>`,
    );
  }

  async sendTaskCompleted(to: string, name: string, title: string) {
    return this.send(
      to,
      `Task completed: ${title}`,
      `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <h2 style="color:#059669">Nice work — task done</h2>
        <p>Hi ${name || 'there'},</p>
        <p>You marked <strong>${title}</strong> as <strong>DONE</strong>.</p>
        <p style="color:#94a3b8;font-size:12px">— TaskFlow</p>
      </div>`,
    );
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.log(`[email:skipped] ${subject} → ${to}`);
      return;
    }
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [to],
        subject,
        html,
      });
      if (error) throw new Error(error.message);
      this.logger.log(`[email:sent] ${data?.id} → ${to}`);
    } catch (err) {
      this.logger.error(`[email:failed] ${(err as Error).message}`);
    }
  }
}
