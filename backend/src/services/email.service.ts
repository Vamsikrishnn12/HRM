import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { transporter } from '../config/mail';

/**
 * Resolve the templates directory.
 * In dev  (ts-node):  src/services/../templates  →  src/templates
 * In prod (compiled):  dist/services/../templates →  dist/templates  (copied by build)
 */
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

export class EmailService {
  private getSender(): string | undefined {
    return env.SMTP_FROM || env.SMTP_USER;
  }

  private async sendMail(options: Record<string, unknown>): Promise<void> {
    const sender = this.getSender();
    if (!transporter || !sender) {
      throw new Error('SMTP is not configured in the backend environment');
    }
    try {
      await transporter.sendMail({
        ...options,
        from: `"${env.SMTP_FROM_NAME}" <${sender}>`,
      });
    } catch (error: any) {
      const code = error?.code || error?.responseCode || 'SMTP_ERROR';
      const detail = error?.response || error?.message || 'SMTP connection failed';
      throw new Error(`Email delivery failed (${code}: ${detail}). Verify the SMTP credentials and sender settings.`);
    }
  }

  private loadTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templatePath}`);
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    for (const [key, value] of Object.entries(variables)) {
      // Use split/join for safe literal replacement (no regex special-char issues)
      html = html.split(`{{${key}}}`).join(value);
    }
    return html;
  }

  async sendCredentials(
    email: string,
    empId: string,
    password: string,
    firstName: string,
  ): Promise<void> {
    const subject = 'Welcome to Connect HR - Your account is ready';
    const html = this.loadTemplate('credentials', {
      firstName,
      empId,
      email,
      password,
      loginUrl: `${env.APP_URL}/login`,
      personalDetailsUrl: `${env.APP_URL}/employee/personal-details`,
      year: new Date().getFullYear().toString(),
    });

    if (transporter && this.getSender()) {
      await this.sendMail({
        to: email,
        subject,
        html,
        attachments: [
          {
            filename: 'connecthr-logo.png',
            path: path.join(TEMPLATES_DIR, 'logobg.png'),
            cid: 'connecthr-logo',
          },
        ],
      });
      console.log('Credentials email sent', { email, empId });
    } else {
      console.log('SMTP not configured - credentials generated for new employee (password redacted):', {
        email,
        empId,
      });
    }
  }

  async sendGenericEmail(
    to: string,
    subject: string,
    templateName: string,
    variables: Record<string, string>,
  ): Promise<void> {
    const html = this.loadTemplate(templateName, variables);

    if (transporter && this.getSender()) {
      await this.sendMail({
        to,
        subject,
        html,
      });
      console.log(`Email sent: ${subject}`, { to });
    } else {
      console.log(`SMTP not configured - ${subject}:`, {
        to,
        templateName,
      });
    }
  }
}
