import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { transporter } from '../config/mail';

export class EmailService {
  private loadTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      `${templateName}.html`,
    );
    let html = fs.readFileSync(templatePath, 'utf-8');

    for (const [key, value] of Object.entries(variables)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
  }

  async sendCredentials(
    email: string,
    empId: string,
    password: string,
    firstName: string,
  ): Promise<void> {
    const subject = 'Your HRMS Account Credentials';
    const html = this.loadTemplate('credentials', {
      firstName,
      empId,
      email,
      password,
      year: new Date().getFullYear().toString(),
    });

    if (transporter && env.SMTP_FROM) {
      await transporter.sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM}>`,
        to: email,
        subject,
        html,
      });
      console.log('Credentials email sent', { email, empId });
    } else {
      console.log('SMTP not configured — credentials for new employee:', {
        email,
        empId,
        password,
      });
    }
  }
}
