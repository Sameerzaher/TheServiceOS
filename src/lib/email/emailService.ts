/**
 * Email Service
 * שירות שליחת אימיילים - תומך ב-Resend, SendGrid, או SMTP
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailProvider {
  send(options: EmailOptions): Promise<{ success: boolean; error?: string }>;
}

/**
 * Resend Provider (מומלץ - פשוט וזול)
 */
class ResendProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Email] Resend error:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('[Email] Resend exception:', error);
      return { success: false, error: String(error) };
    }
  }
}

/**
 * Console Provider (למצב פיתוח - מדפיס לקונסול)
 */
class ConsoleProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    console.log('\n📧 ═══════════════════════════════════════════════');
    console.log('📧 Email (Development Mode - Not Actually Sent)');
    console.log('📧 ═══════════════════════════════════════════════');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('─────────────────────────────────────────────────');
    console.log(options.text || 'No text version');
    console.log('─────────────────────────────────────────────────');
    console.log('HTML:', options.html.substring(0, 200) + '...');
    console.log('═══════════════════════════════════════════════\n');
    return { success: true };
  }
}

/**
 * Email Service Instance
 */
class EmailService {
  private provider: EmailProvider;

  constructor() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'console';
    
    switch (emailProvider) {
      case 'resend':
        const resendApiKey = process.env.RESEND_API_KEY;
        const fromEmail = process.env.EMAIL_FROM || 'noreply@serviceos.com';
        
        if (!resendApiKey) {
          console.warn('[Email] RESEND_API_KEY not found, falling back to console');
          this.provider = new ConsoleProvider();
        } else {
          this.provider = new ResendProvider(resendApiKey, fromEmail);
        }
        break;
      
      case 'console':
      default:
        this.provider = new ConsoleProvider();
        break;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, resetToken: string, userName: string): Promise<boolean> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
    .warning { background: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 איפוס סיסמה</h1>
    </div>
    <div class="content">
      <p>שלום ${userName},</p>
      <p>קיבלנו בקשה לאיפוס הסיסמה שלך ב-ServiceOS.</p>
      <p>לחץ על הכפתור למטה כדי לאפס את הסיסמה:</p>
      <center>
        <a href="${resetUrl}" class="button">איפוס סיסמה</a>
      </center>
      <p>או העתק והדבק את הקישור הזה בדפדפן:</p>
      <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all;">${resetUrl}</p>
      <div class="warning">
        <strong>⚠️ חשוב:</strong> הקישור תקף ל-1 שעה בלבד.
      </div>
      <p>אם לא ביקשת לאפס את הסיסמה, אפשר להתעלם מהאימייל הזה.</p>
    </div>
    <div class="footer">
      <p>ServiceOS - מערכת ניהול עסקית חכמה</p>
      <p>האימייל נשלח אוטומטית, אין להשיב עליו</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
שלום ${userName},

קיבלנו בקשה לאיפוס הסיסמה שלך ב-ServiceOS.

כדי לאפס את הסיסמה, לחץ על הקישור הזה:
${resetUrl}

הקישור תקף ל-1 שעה בלבד.

אם לא ביקשת לאפס את הסיסמה, אפשר להתעלם מהאימייל הזה.

ServiceOS - מערכת ניהול עסקית חכמה
    `.trim();

    const result = await this.provider.send({
      to,
      subject: '🔐 איפוס סיסמה - ServiceOS',
      html,
      text,
    });

    return result.success;
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(to: string, verificationToken: string, userName: string): Promise<boolean> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ אימות כתובת אימייל</h1>
    </div>
    <div class="content">
      <p>שלום ${userName},</p>
      <p>ברוכים הבאים ל-ServiceOS! 🎉</p>
      <p>כדי להשלים את ההרשמה, אנא אמת את כתובת האימייל שלך:</p>
      <center>
        <a href="${verifyUrl}" class="button">אמת אימייל</a>
      </center>
      <p>או העתק והדבק את הקישור הזה בדפדפן:</p>
      <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all;">${verifyUrl}</p>
      <p>אחרי האימות תוכל להתחיל להשתמש בכל התכונות של המערכת.</p>
    </div>
    <div class="footer">
      <p>ServiceOS - מערכת ניהול עסקית חכמה</p>
      <p>האימייל נשלח אוטומטית, אין להשיב עליו</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
שלום ${userName},

ברוכים הבאים ל-ServiceOS! 🎉

כדי להשלים את ההרשמה, אנא אמת את כתובת האימייל שלך:
${verifyUrl}

אחרי האימות תוכל להתחיל להשתמש בכל התכונות של המערכת.

ServiceOS - מערכת ניהול עסקית חכמה
    `.trim();

    const result = await this.provider.send({
      to,
      subject: '✉️ אימות אימייל - ServiceOS',
      html,
      text,
    });

    return result.success;
  }

  /**
   * Send welcome email (after verification)
   */
  async sendWelcome(to: string, userName: string): Promise<boolean> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
    .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-right: 4px solid #8b5cf6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ברוכים הבאים!</h1>
    </div>
    <div class="content">
      <p>שלום ${userName},</p>
      <p>חשבונך אומת בהצלחה! אתה יכול להתחיל להשתמש ב-ServiceOS.</p>
      <h3>מה אפשר לעשות במערכת?</h3>
      <div class="feature">📅 <strong>ניהול תורים</strong> - תזמון ומעקב אחר כל התורים</div>
      <div class="feature">👥 <strong>ניהול לקוחות</strong> - כל המידע במקום אחד</div>
      <div class="feature">💰 <strong>מעקב תשלומים</strong> - חשבוניות וקבלות אוטומטיות</div>
      <div class="feature">📊 <strong>דוחות ואנליטיקה</strong> - הבן את העסק שלך טוב יותר</div>
      <center>
        <a href="${appUrl}" class="button">התחל עכשיו</a>
      </center>
      <p>אם יש שאלות, אנחנו כאן לעזור!</p>
    </div>
    <div class="footer">
      <p>ServiceOS - מערכת ניהול עסקית חכמה</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
שלום ${userName},

חשבונך אומת בהצלחה! אתה יכול להתחיל להשתמש ב-ServiceOS.

מה אפשר לעשות במערכת?
- ניהול תורים
- ניהול לקוחות
- מעקב תשלומים
- דוחות ואנליטיקה

התחל עכשיו: ${appUrl}

ServiceOS - מערכת ניהול עסקית חכמה
    `.trim();

    const result = await this.provider.send({
      to,
      subject: '🎉 ברוכים הבאים ל-ServiceOS!',
      html,
      text,
    });

    return result.success;
  }
}

// Export singleton instance
export const emailService = new EmailService();
