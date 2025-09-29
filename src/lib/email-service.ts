import {
  getOrderCreatedTemplate,
  getOrderApprovedTemplate,
  getOrderRejectedTemplate,
  getProcurementTemplate,
  type OrderCreatedData,
  type OrderApprovedData,
  type OrderRejectedData,
  type ProcurementData
} from './email-templates';
import { MAILJET_TEMPLATES, createTemplateVariables, type TemplateVariables } from './mailjet-templates';

export interface EmailConfig {
  apiKey: string;
  apiSecret: string;
}

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailTemplate {
  from: EmailRecipient;
  to: EmailRecipient[];
  subject: string;
  textContent: string;
  htmlContent: string;
}

export interface TemplateEmailData {
  templateId: number;
  variables: TemplateVariables;
  to: EmailRecipient[];
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  private async getMailjetInstance() {
    try {
      const Mailjet = await import('node-mailjet');
      return new (Mailjet as any).default({
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
      });
    } catch (error) {
      console.error('Failed to initialize Mailjet:', error);
      throw new Error('Failed to initialize Mailjet client');
    }
  }

  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const mailjet = await this.getMailjetInstance();

      const request = mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: template.from.email,
              Name: template.from.name,
            },
            To: template.to.map(recipient => ({
              Email: recipient.email,
              Name: recipient.name,
            })),
            Subject: template.subject,
            TextPart: template.textContent,
            HTMLPart: template.htmlContent,
          },
        ],
      });

      const response = await request;
      const success = response.body.Messages[0].Status === 'success';
      
      if (success) {
        console.log('Email sent successfully to:', template.to.map(t => t.email).join(', '));
      } else {
        console.error('Email sending failed:', response.body);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTemplateEmail(data: TemplateEmailData): Promise<boolean> {
    try {
      const mailjet = await this.getMailjetInstance();

      const request = mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            To: data.to.map(recipient => ({
              Email: recipient.email,
              Name: recipient.name,
            })),
            TemplateID: data.templateId,
            TemplateLanguage: true,
            Variables: data.variables,
          },
        ],
      });

      const response = await request;
      const success = response.body.Messages[0].Status === 'success';
      
      if (success) {
        console.log('Template email sent successfully to:', data.to.map(t => t.email).join(', '));
        console.log('Using template sender settings from Mailjet');
      } else {
        console.error('Template email sending failed:', response.body);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending template email:', error);
      throw error;
    }
  }

  async notifyOrderCreated(data: OrderCreatedData): Promise<boolean> {
    if (MAILJET_TEMPLATES.ORDER_CREATED > 0) {
      const templateData: TemplateEmailData = {
        templateId: MAILJET_TEMPLATES.ORDER_CREATED,
        variables: createTemplateVariables(data),
        to: [{
          email: data.supervisorEmail,
          name: data.supervisorName
        }]
      };
      return await this.sendTemplateEmail(templateData);
    } else {
      const emailTemplate = getOrderCreatedTemplate(data);
      
      const template: EmailTemplate = {
        from: {
          email: 'rawich.cc@gmail.com',
          name: 'Bederly'
        },
        to: [{
          email: data.supervisorEmail,
          name: data.supervisorName
        }],
        subject: emailTemplate.subject,
        textContent: emailTemplate.textContent,
        htmlContent: emailTemplate.htmlContent
      };

      return await this.sendEmail(template);
    }
  }

  async notifyOrderCreatedWithTemplate(data: OrderCreatedData): Promise<boolean> {
    if (MAILJET_TEMPLATES.ORDER_CREATED > 0) {
      const templateData: TemplateEmailData = {
        templateId: MAILJET_TEMPLATES.ORDER_CREATED,
        variables: createTemplateVariables(data),
        to: [{
          email: data.supervisorEmail,
          name: data.supervisorName
        }]
      };
      return await this.sendTemplateEmail(templateData);
    } else {
      throw new Error('Mailjet Template ID not configured');
    }
  }

  async notifyOrderApproved(data: OrderApprovedData): Promise<boolean> {
    if (MAILJET_TEMPLATES.ORDER_APPROVED > 0) {
      const templateData: TemplateEmailData = {
        templateId: MAILJET_TEMPLATES.ORDER_APPROVED,
        variables: createTemplateVariables(data),
        to: [{
          email: data.requesterEmail,
          name: data.requesterName
        }]
      };
      return await this.sendTemplateEmail(templateData);
    } else {
      const emailTemplate = getOrderApprovedTemplate(data);
      
      const template: EmailTemplate = {
        from: {
          email: 'rawich.cc@gmail.com',
          name: 'Bederly'
        },
        to: [{
          email: data.requesterEmail,
          name: data.requesterName
        }],
        subject: emailTemplate.subject,
        textContent: emailTemplate.textContent,
        htmlContent: emailTemplate.htmlContent
      };

      return await this.sendEmail(template);
    }
  }

  async notifyOrderApprovedWithTemplate(data: OrderApprovedData): Promise<boolean> {
    if (MAILJET_TEMPLATES.ORDER_APPROVED > 0) {
      const templateData: TemplateEmailData = {
        templateId: MAILJET_TEMPLATES.ORDER_APPROVED,
        variables: createTemplateVariables(data),
        to: [{
          email: data.requesterEmail,
          name: data.requesterName
        }]
      };
      return await this.sendTemplateEmail(templateData);
    } else {
      throw new Error('Mailjet Template ID not configured');
    }
  }

  async notifyOrderRejected(data: OrderRejectedData): Promise<boolean> {
    if (MAILJET_TEMPLATES.ORDER_REJECTED > 0) {
      const templateData: TemplateEmailData = {
        templateId: MAILJET_TEMPLATES.ORDER_REJECTED,
        variables: createTemplateVariables(data),
        to: [{
          email: data.requesterEmail,
          name: data.requesterName
        }]
      };
      return await this.sendTemplateEmail(templateData);
    } else {
      const emailTemplate = getOrderRejectedTemplate(data);
      
      const template: EmailTemplate = {
        from: {
          email: 'rawich.cc@gmail.com',
          name: 'Bederly'
        },
        to: [{
          email: data.requesterEmail,
          name: data.requesterName
        }],
        subject: emailTemplate.subject,
        textContent: emailTemplate.textContent,
        htmlContent: emailTemplate.htmlContent
      };

      return await this.sendEmail(template);
    }
  }

  async notifyOrderRejectedWithTemplate(data: OrderRejectedData): Promise<boolean> {
    if (MAILJET_TEMPLATES.ORDER_REJECTED > 0) {
      const templateData: TemplateEmailData = {
        templateId: MAILJET_TEMPLATES.ORDER_REJECTED,
        variables: createTemplateVariables(data),
        to: [{
          email: data.requesterEmail,
          name: data.requesterName
        }]
      };
      return await this.sendTemplateEmail(templateData);
    } else {
      throw new Error('Mailjet Template ID not configured');
    }
  }

  async notifyProcurement(data: ProcurementData & { procurementEmail: string }): Promise<boolean> {
    if (MAILJET_TEMPLATES.PROCUREMENT_NOTIFICATION > 0) {
      const templateData: TemplateEmailData = {
        templateId: MAILJET_TEMPLATES.PROCUREMENT_NOTIFICATION,
        variables: createTemplateVariables(data),
        to: [{
          email: data.procurementEmail,
          name: data.procurementName
        }]
      };
      return await this.sendTemplateEmail(templateData);
    } else {
      const emailTemplate = getProcurementTemplate(data);
      
      const template: EmailTemplate = {
        from: {
          email: 'rawich.cc@gmail.com',
          name: 'Bederly'
        },
        to: [{
          email: data.procurementEmail,
          name: data.procurementName
        }],
        subject: emailTemplate.subject,
        textContent: emailTemplate.textContent,
        htmlContent: emailTemplate.htmlContent
      };

      return await this.sendEmail(template);
    }
  }

  async notifyProcurementWithTemplate(data: ProcurementData & { procurementEmail: string }): Promise<boolean> {
    if (MAILJET_TEMPLATES.PROCUREMENT_NOTIFICATION > 0) {
      const templateData: TemplateEmailData = {
        templateId: MAILJET_TEMPLATES.PROCUREMENT_NOTIFICATION,
        variables: createTemplateVariables(data),
        to: [{
          email: data.procurementEmail,
          name: data.procurementName
        }]
      };
      return await this.sendTemplateEmail(templateData);
    } else {
      throw new Error('Mailjet Template ID not configured');
    }
  }

}

export function createEmailService(): EmailService {
  const apiKey = import.meta.env.MAILJET_API_KEY;
  const apiSecret = import.meta.env.MAILJET_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    throw new Error('Mailjet API credentials not found. Please check your .env.local file.');
  }

  return new EmailService({
    apiKey,
    apiSecret
  });
}