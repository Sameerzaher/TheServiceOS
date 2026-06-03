/**
 * Messaging Service
 * שירות שליחת הודעות SMS ו-WhatsApp
 */

export interface MessageOptions {
  to: string; // Phone number with country code (e.g., +972501234567)
  message: string;
  type: 'sms' | 'whatsapp';
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export interface MessageProvider {
  sendSMS(to: string, message: string): Promise<MessageResult>;
  sendWhatsApp(to: string, message: string): Promise<MessageResult>;
}

/**
 * Twilio Provider (מומלץ - תומך בSMS וWhatsApp)
 */
class TwilioProvider implements MessageProvider {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private whatsappNumber: string;

  constructor(accountSid: string, authToken: string, phoneNumber: string, whatsappNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumber = phoneNumber;
    this.whatsappNumber = whatsappNumber;
  }

  async sendSMS(to: string, message: string): Promise<MessageResult> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: to,
            From: this.phoneNumber,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Messaging] Twilio SMS error:', error);
        return { success: false, error, provider: 'twilio' };
      }

      const data = await response.json();
      return { 
        success: true, 
        messageId: data.sid,
        provider: 'twilio'
      };
    } catch (error) {
      console.error('[Messaging] Twilio SMS exception:', error);
      return { 
        success: false, 
        error: String(error),
        provider: 'twilio'
      };
    }
  }

  async sendWhatsApp(to: string, message: string): Promise<MessageResult> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: `whatsapp:${to}`,
            From: `whatsapp:${this.whatsappNumber}`,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[Messaging] Twilio WhatsApp error:', error);
        return { success: false, error, provider: 'twilio' };
      }

      const data = await response.json();
      return { 
        success: true, 
        messageId: data.sid,
        provider: 'twilio'
      };
    } catch (error) {
      console.error('[Messaging] Twilio WhatsApp exception:', error);
      return { 
        success: false, 
        error: String(error),
        provider: 'twilio'
      };
    }
  }
}

/**
 * Console Provider (למצב פיתוח - מדפיס לקונסול)
 */
class ConsoleProvider implements MessageProvider {
  async sendSMS(to: string, message: string): Promise<MessageResult> {
    console.log('\n📱 ════════════════════════════════════════════════');
    console.log('📱 SMS Message (Development Mode - Not Sent)');
    console.log('📱 ════════════════════════════════════════════════');
    console.log(`To: ${to}`);
    console.log('─────────────────────────────────────────────────');
    console.log(message);
    console.log('════════════════════════════════════════════════\n');
    return { success: true, provider: 'console' };
  }

  async sendWhatsApp(to: string, message: string): Promise<MessageResult> {
    console.log('\n💚 ════════════════════════════════════════════════');
    console.log('💚 WhatsApp Message (Development Mode - Not Sent)');
    console.log('💚 ════════════════════════════════════════════════');
    console.log(`To: ${to}`);
    console.log('─────────────────────────────────────────────────');
    console.log(message);
    console.log('════════════════════════════════════════════════\n');
    return { success: true, provider: 'console' };
  }
}

/**
 * Messaging Service Instance
 */
class MessagingService {
  private provider: MessageProvider;

  constructor() {
    const messagingProvider = process.env.MESSAGING_PROVIDER || 'console';
    
    switch (messagingProvider) {
      case 'twilio':
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
        const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
        
        if (!accountSid || !authToken || !phoneNumber) {
          console.warn('[Messaging] Twilio credentials missing, falling back to console');
          this.provider = new ConsoleProvider();
        } else {
          this.provider = new TwilioProvider(
            accountSid,
            authToken,
            phoneNumber,
            whatsappNumber || phoneNumber
          );
        }
        break;
      
      case 'console':
      default:
        this.provider = new ConsoleProvider();
        break;
    }
  }

  /**
   * Send a message (SMS or WhatsApp)
   */
  async send(options: MessageOptions): Promise<MessageResult> {
    const { to, message, type } = options;

    // Validate phone number
    if (!to || !to.startsWith('+')) {
      return {
        success: false,
        error: 'מספר טלפון לא תקין - חייב להתחיל ב-+ וקוד מדינה',
      };
    }

    // Send based on type
    if (type === 'whatsapp') {
      return await this.provider.sendWhatsApp(to, message);
    } else {
      return await this.provider.sendSMS(to, message);
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    clientPhone: string,
    clientName: string,
    appointmentDate: Date,
    businessName: string,
    type: 'sms' | 'whatsapp' = 'whatsapp'
  ): Promise<MessageResult> {
    const dateStr = appointmentDate.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    
    const timeStr = appointmentDate.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `שלום ${clientName} 👋

תזכורת לתור שלך ב-${businessName}:
📅 ${dateStr}
🕐 ${timeStr}

אם צריך לשנות/לבטל, אנא עדכן אותנו.

בברכה,
${businessName}`;

    return await this.send({
      to: clientPhone,
      message,
      type,
    });
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(
    clientPhone: string,
    clientName: string,
    amount: number,
    businessName: string,
    type: 'sms' | 'whatsapp' = 'whatsapp'
  ): Promise<MessageResult> {
    const message = `שלום ${clientName} 👋

תזכורת ידידותית לתשלום:
💰 סכום: ₪${amount}

ניתן לשלם במזומן/העברה/אשראי.

תודה רבה!
${businessName}`;

    return await this.send({
      to: clientPhone,
      message,
      type,
    });
  }

  /**
   * Send custom message
   */
  async sendCustomMessage(
    clientPhone: string,
    message: string,
    type: 'sms' | 'whatsapp' = 'whatsapp'
  ): Promise<MessageResult> {
    return await this.send({
      to: clientPhone,
      message,
      type,
    });
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
