import { MailService } from '@sendgrid/mail';
import { format, toZonedTime } from 'date-fns-tz';
import type { Class, User, Booking } from '../shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

function generateCalendarInviteUrl(classData: Class, startTime: Date, endTime: Date): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const title = encodeURIComponent(classData.title);
  const description = encodeURIComponent(
    `${classData.description || ''}\n\nLocation: ${classData.address}${classData.toFindUs ? `\n\nHow to Find Us: ${classData.toFindUs}` : ''}\n\nBooked through Trainn`
  );
  const location = encodeURIComponent(classData.address || '');
  const startDateTime = formatDate(startTime);
  const endDateTime = formatDate(endTime);

  // Generate Google Calendar URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${description}&location=${location}`;

  return googleCalendarUrl;
}

interface BookingConfirmationData {
  booking: Booking;
  classData: Class;
  customer: User;
  coach: User;
  pricingDetails?: {
    originalPrice: number;
    discountAmount: number;
    finalAmount: number;
    discountSource: string; // e.g., "Referral Credit", "Promo Code", etc.
  };
}

export async function sendBookingConfirmation(
  data: BookingConfirmationData
): Promise<boolean> {
  console.log('Starting email confirmation process...');
  console.log('Email data:', {
    customerEmail: data.customer.email,
    className: data.classData.title,
    bookingId: data.booking.id
  });
  
  try {
    const { booking, classData, customer, coach, pricingDetails } = data;
    
    // Format date and time in Pacific Time
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const classDate = new Date(classData.startTime!);
    const classEndTime = new Date(classData.endTime!);
    
    // Convert to Pacific Time
    const classDatePT = toZonedTime(classDate, PACIFIC_TIMEZONE);
    const classEndTimePT = toZonedTime(classEndTime, PACIFIC_TIMEZONE);
    
    const formattedDate = format(classDatePT, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedTime = format(classDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    // Generate calendar invite URL (calendar invites use UTC)
    const calendarInviteUrl = generateCalendarInviteUrl(classData, classDate, classEndTime);

    const subject = `Trainn Confirmation and Receipt for ${classData.title} on ${formattedDate}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Booking Confirmation</h2>
          
          <p style="color: #333; line-height: 1.6;">
            Thank you for choosing Trainn.<br>
            A receipt of your purchase is shown below. Please retain this email receipt for your records.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class Name:</td>
                <td style="padding: 8px 0; color: #333;">${classData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate} at ${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">What To Bring:</td>
                <td style="padding: 8px 0; color: #333;">${classData.whatToBring || 'Nothing specific required'}</td>
              </tr>
              ${classData.toFindUs ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">How To Find Us:</td>
                <td style="padding: 8px 0; color: #333;">${classData.toFindUs}</td>
              </tr>
              ` : ''}
              ${pricingDetails && pricingDetails.discountAmount > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Paid:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">$${pricingDetails.finalAmount.toFixed(2)}</td>
              </tr>
              ` : `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Cost:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">$${(classData.price * booking.quantity).toFixed(2)}</td>
              </tr>
              `}
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Spots Booked:</td>
                <td style="padding: 8px 0; color: #333;">${booking.quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Provider:</td>
                <td style="padding: 8px 0; color: #333;">${coach.firstName} ${coach.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class Description:</td>
                <td style="padding: 8px 0; color: #333;">${classData.description || 'No description available'}</td>
              </tr>
            </table>
          </div>
          
          ${classData.location ? `
          <div style="margin: 25px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Location:</h3>
            <p style="color: #666; margin: 0;">${classData.location}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${calendarInviteUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              📅 Add to Calendar
            </a>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
              Click above to add this class to your calendar
            </p>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #1565c0; margin: 0; font-size: 14px;">
              <strong>Important:</strong> Please arrive 10-15 minutes early for check-in. 
              If you need to cancel or reschedule, please contact us at least 24 hours in advance.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.com
            </p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
              This is an automated confirmation email from Trainn.
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
Thank you for choosing Trainn.
A receipt of your purchase is shown below. Please retain this email receipt for your records.

BOOKING DETAILS:
Class Name: ${classData.title}
Date & Time: ${formattedDate} at ${formattedTime}
What To Bring: ${classData.whatToBring || 'Nothing specific required'}
Total Cost: $${(classData.price * booking.quantity).toFixed(2)}
Spots Booked: ${booking.quantity}
Provider: ${coach.firstName} ${coach.lastName}
Class Description: ${classData.description || 'No description available'}
${classData.location ? `Location: ${classData.location}` : ''}

Add to Calendar: ${calendarInviteUrl}

Important: Please arrive 10-15 minutes early for check-in. 
If you need to cancel or reschedule, please contact us at least 24 hours in advance.

Questions? Contact us at support@trainn.com
    `;

    // Note: The 'from' email must be verified in SendGrid before emails can be sent
    // Go to SendGrid Dashboard > Settings > Sender Authentication to verify your sender email
    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro', // Verified sender email from SendGrid
      subject: subject,
      text: textContent,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: false
        }
      }
    });

    console.log(`Booking confirmation email sent to ${customer.email} for class ${classData.title}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: 'support@trainn.pro', // Verified sender email from SendGrid
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Class reminder email (24 hours before)
export async function sendClassReminder(
  customer: User,
  classData: Class,
  coach: User
): Promise<boolean> {
  try {
    // Format date and time in Pacific Time
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const classDate = new Date(classData.startTime!);
    const classEndTime = new Date(classData.endTime!);
    
    // Convert to Pacific Time
    const classDatePT = toZonedTime(classDate, PACIFIC_TIMEZONE);
    
    const formattedDate = format(classDatePT, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedTime = format(classDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    // Generate calendar invite URL for reminder
    const calendarInviteUrl = generateCalendarInviteUrl(classData, classDate, classEndTime);

    const subject = `Reminder: ${classData.title} tomorrow at ${formattedTime}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Outdoor fitness and creative classes for adults and kids</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Class Reminder</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${customer.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Just a friendly reminder that you have a class coming up tomorrow!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class:</td>
                <td style="padding: 8px 0; color: #333;">${classData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate} at ${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Provider:</td>
                <td style="padding: 8px 0; color: #333;">${coach.firstName} ${coach.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class Description:</td>
                <td style="padding: 8px 0; color: #333;">${classData.description || 'No description available'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0; color: #333;">${classData.location}</td>
              </tr>
              ${classData.whatToBring ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">What to Bring:</td>
                <td style="padding: 8px 0; color: #333;">${classData.whatToBring}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${calendarInviteUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              📅 Add to Calendar
            </a>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
              Add this class to your calendar as a reminder
            </p>
          </div>

          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #1565c0; margin: 0; font-size: 14px;">
              <strong>Remember:</strong> Please arrive 10-15 minutes early for check-in. 
              Looking forward to seeing you there!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.com
            </p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
Class Reminder

Hi ${customer.firstName},

Just a friendly reminder that you have a class coming up tomorrow!

Class: ${classData.title}
Date: ${formattedDate} at ${formattedTime}
Provider: ${coach.firstName} ${coach.lastName}
Class Description: ${classData.description || 'No description available'}
Location: ${classData.location}
${classData.whatToBring ? `What to Bring: ${classData.whatToBring}` : ''}

Add to Calendar: ${calendarInviteUrl}

Please arrive 10-15 minutes early for check-in.

Questions? Contact us at support@trainn.com

Trainn - Outdoor fitness and creative classes for adults and kids
    `;

    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro',
      subject: subject,
      text: textContent,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: false
        }
      }
    });

    console.log(`Class reminder sent to ${customer.email} for ${classData.title}`);
    return true;
  } catch (error) {
    console.error('Class reminder email error:', error);
    return false;
  }
}

// Class cancellation notification
export async function sendClassCancellationNotification(
  customer: User,
  classData: Class,
  coach: User,
  reason?: string
): Promise<boolean> {
  try {
    // Format date and time in Pacific Time
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const classDate = new Date(classData.startTime!);
    
    // Convert to Pacific Time
    const classDatePT = toZonedTime(classDate, PACIFIC_TIMEZONE);
    
    const formattedDate = format(classDatePT, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedTime = format(classDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    const subject = `Class Cancelled: ${classData.title} on ${formattedDate}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #dc3545; margin-bottom: 20px;">Class Cancellation Notice</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${customer.firstName},</p>
          <p style="color: #333; line-height: 1.6;">We're sorry to inform you that the following class has been cancelled:</p>
          
          <div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc3545;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class:</td>
                <td style="padding: 8px 0; color: #333;">${classData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate} at ${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Provider:</td>
                <td style="padding: 8px 0; color: #333;">${coach.firstName} ${coach.lastName}</td>
              </tr>
              ${reason ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Reason:</td>
                <td style="padding: 8px 0; color: #333;">${reason}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p style="color: #333; line-height: 1.6;">Your payment will be automatically refunded to your original payment method within 3-5 business days.</p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #1565c0; margin: 0; font-size: 14px;">
              <strong>We apologize for any inconvenience.</strong> Browse our other available classes or contact us if you need assistance finding a replacement.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.com
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro',
      bcc: 'sam@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`Class cancellation notification sent to ${customer.email} for ${classData.title}`);
    return true;
  } catch (error) {
    console.error('Class cancellation email error:', error);
    return false;
  }
}

// Coach approval notification
// Promo code approval request notification to admin
export async function sendPromoCodeApprovalRequest(
  coach: User,
  promoCode: any,
  isEdit: boolean = false
): Promise<boolean> {
  try {
    const action = isEdit ? 'edited' : 'created';
    const subject = `Promo Code ${isEdit ? 'Edit' : 'Creation'} Requires Approval - ${promoCode.code}`;

    const discountDisplay = promoCode.discountType === 'percentage' 
      ? `${promoCode.discountValue}%`
      : `$${(promoCode.discountValue / 100).toFixed(2)}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Admin Notification</p>
          </div>
          
          <h2 style="color: #f59e0b; margin-bottom: 20px;">⚠️ Promo Code Approval Required</h2>
          
          <p style="color: #333; line-height: 1.6;">
            Provider <strong>${coach.firstName} ${coach.lastName}</strong> has ${action} a promo code that requires your approval.
          </p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Promo Code Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Code:</td>
                <td style="padding: 8px 0; color: #92400e;">${promoCode.code}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Name:</td>
                <td style="padding: 8px 0; color: #92400e;">${promoCode.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Discount:</td>
                <td style="padding: 8px 0; color: #92400e;">${discountDisplay} ${promoCode.discountType === 'fixed' ? 'fixed amount' : 'percentage off'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Provider:</td>
                <td style="padding: 8px 0; color: #92400e;">${coach.firstName} ${coach.lastName} (${coach.email})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Valid Period:</td>
                <td style="padding: 8px 0; color: #92400e;">${new Date(promoCode.validFrom).toLocaleDateString()} - ${new Date(promoCode.validUntil).toLocaleDateString()}</td>
              </tr>
              ${promoCode.usageLimit ? `
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Usage Limit:</td>
                <td style="padding: 8px 0; color: #92400e;">${promoCode.usageLimit} uses</td>
              </tr>
              ` : ''}
              ${promoCode.description ? `
              <tr>
                <td style="padding: 8px 0; color: #92400e; font-weight: bold;">Description:</td>
                <td style="padding: 8px 0; color: #92400e;">${promoCode.description}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trainn.pro/admin/promo-codes" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Review & Approve Promo Code</a>
          </div>
          
          <p style="color: #333; line-height: 1.6; font-size: 14px;">
            Please review this promo code in the admin panel and approve or deny it as appropriate.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              This is an automated notification from Trainn
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: 'sam@trainn.pro',
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`Promo code approval request sent to admin for code: ${promoCode.code} (${action} by ${coach.email})`);
    return true;
  } catch (error) {
    console.error('Promo code approval request email error:', error);
    return false;
  }
}

export async function sendCoachApprovalNotification(coach: User): Promise<boolean> {
  try {
    const subject = `Welcome to Trainn - Your Provider Account is Approved!`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #28a745; margin-bottom: 20px;">🎉 Congratulations!</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${coach.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Great news! Your provider account has been approved and you can now start creating and managing fitness, sports, or creative classes on Trainn.</p>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">What you can do now:</h3>
            <ul style="color: #155724; margin: 10px 0;">
              <li>Create your first class</li>
              <li>Set your own pricing and schedule</li>
              <li>Manage bookings and customers</li>
              <li>Track your earnings</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trainn.pro/create-class" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Create Your First Class</a>
          </div>
          
          <p style="color: #333; line-height: 1.6;">We're excited to have you as part of the Trainn community. Start sharing your passion and help others achieve their goals!</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.com
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: coach.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`Coach approval notification sent to ${coach.email}`);
    return true;
  } catch (error) {
    console.error('Coach approval email error:', error);
    return false;
  }
}

// Booking cancellation confirmation
export async function sendBookingCancellationConfirmation(
  customer: User,
  classData: Class,
  coach: User,
  refundAmount: number
): Promise<boolean> {
  try {
    // Format date and time in Pacific Time
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const classDate = new Date(classData.startTime!);
    
    // Convert to Pacific Time
    const classDatePT = toZonedTime(classDate, PACIFIC_TIMEZONE);
    
    const formattedDate = format(classDatePT, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedTime = format(classDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    const subject = `Booking Cancelled: ${classData.title} on ${formattedDate}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Booking Cancellation Confirmed</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${customer.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Your booking cancellation has been processed successfully.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #333; margin-top: 0;">Cancelled Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class:</td>
                <td style="padding: 8px 0; color: #333;">${classData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate} at ${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Provider:</td>
                <td style="padding: 8px 0; color: #333;">${coach.firstName} ${coach.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Refund Amount:</td>
                <td style="padding: 8px 0; color: #28a745; font-weight: bold;">$${refundAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #1565c0; margin: 0; font-size: 14px;">
              <strong>Refund Processing:</strong> Your refund will be processed to your original payment method within 3-5 business days.
            </p>
          </div>
          
          <p style="color: #333; line-height: 1.6;">We hope to see you in another class soon!</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.com
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro',
      bcc: 'sam@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`Booking cancellation confirmation sent to ${customer.email} for ${classData.title}`);
    return true;
  } catch (error) {
    console.error('Booking cancellation email error:', error);
    return false;
  }
}

// Class schedule update notification
export async function sendClassScheduleUpdateNotification(
  customer: User,
  oldClassData: Class,
  newClassData: Class,
  coach: User,
  changes: string[]
): Promise<boolean> {
  try {
    // Format date and time in Pacific Time
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const newClassDate = new Date(newClassData.startTime!);
    
    // Convert to Pacific Time
    const newClassDatePT = toZonedTime(newClassDate, PACIFIC_TIMEZONE);
    
    const formattedDate = format(newClassDatePT, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedTime = format(newClassDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    const subject = `Class Update: ${newClassData.title} on ${formattedDate}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #fd7e14; margin-bottom: 20px;">Class Schedule Update</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${customer.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Your upcoming class has been updated. Here are the new details:</p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #fd7e14;">
            <h3 style="color: #856404; margin-top: 0;">What's Changed:</h3>
            <ul style="color: #856404; margin: 10px 0;">
              ${changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #333; margin-top: 0;">Updated Class Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class:</td>
                <td style="padding: 8px 0; color: #333;">${newClassData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate} at ${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Provider:</td>
                <td style="padding: 8px 0; color: #333;">${coach.firstName} ${coach.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0; color: #333;">${newClassData.location}</td>
              </tr>
              ${newClassData.whatToBring ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">What to Bring:</td>
                <td style="padding: 8px 0; color: #333;">${newClassData.whatToBring}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p style="color: #333; line-height: 1.6;">Your booking remains confirmed. Please make note of any changes, especially to the time or location.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.com
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro',
      bcc: 'sam@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`Class schedule update notification sent to ${customer.email} for ${newClassData.title}`);
    return true;
  } catch (error) {
    console.error('Class schedule update email error:', error);
    return false;
  }
}

// Welcome email for new users
export async function sendWelcomeEmail(user: User): Promise<boolean> {
  try {
    const isCoach = user.role === 'coach';
    const subject = `Welcome to Trainn, ${user.firstName}!`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #28a745; margin-bottom: 20px;">🎉 Welcome to Trainn!</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${user.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Welcome to Trainn! We're excited to have you join our community.</p>
          
          ${isCoach ? `
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">As a Provider, you can:</h3>
            <ul style="color: #1565c0; margin: 10px 0;">
              <li>Create and manage classes</li>
              <li>Set your own pricing and schedule</li>
              <li>Build your fitness or creative community</li>
              <li>Earn money doing what you love</li>
            </ul>
            <p style="color: #1565c0; margin-bottom: 0; font-size: 14px;">
              <strong>Note:</strong> Your provider account is pending approval. You'll receive an email once it's approved and you can start creating classes.
            </p>
          </div>
          ` : `
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">As a Customer, you can:</h3>
            <ul style="color: #1565c0; margin: 10px 0;">
              <li>Browse and book classes</li>
              <li>Find classes near you</li>
              <li>Connect with amazing providers</li>
              <li>Track your journey</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trainn.pro" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Browse Classes</a>
          </div>
          `}
          
          <p style="color: #333; line-height: 1.6;">If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.com
            </p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
              Welcome to your fitness, sports and creative journey with Trainn!
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: user.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Welcome email error:', error);
    return false;
  }
}

// Coach notification for new bookings
export async function sendNewBookingNotificationToCoach(
  coach: User,
  customer: User,
  classData: Class,
  booking: Booking,
  packageInfo?: {
    isPackageBooking: boolean;
    perClassAmount?: number;
    packageTitle?: string;
  }
): Promise<boolean> {
  try {
    // DEBUG: Log package info being passed to email function
    console.log('📧 [EMAIL DEBUG] packageInfo received:', JSON.stringify(packageInfo, null, 2));
    if (packageInfo?.isPackageBooking) {
      console.log('📧 [EMAIL DEBUG] This is a package booking');
      console.log('📧 [EMAIL DEBUG] perClassAmount:', packageInfo.perClassAmount);
      console.log('📧 [EMAIL DEBUG] packageTitle:', packageInfo.packageTitle);
      console.log('📧 [EMAIL DEBUG] booking.quantity:', booking.quantity);
      console.log('📧 [EMAIL DEBUG] classData.price:', classData.price);
    } else {
      console.log('📧 [EMAIL DEBUG] This is NOT a package booking');
    }
    
    // Format date and time in Pacific Time
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const classDate = new Date(classData.startTime!);
    
    // Convert to Pacific Time
    const classDatePT = toZonedTime(classDate, PACIFIC_TIMEZONE);
    
    const formattedDate = format(classDatePT, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedTime = format(classDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    const subject = `New Booking: ${customer.firstName} ${customer.lastName} booked ${classData.title}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #28a745; margin-bottom: 20px;">🎉 New Booking!</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${coach.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Great news! You have a new booking for one of your classes.</p>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Customer:</td>
                <td style="padding: 8px 0; color: #155724;">${customer.firstName} ${customer.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Class:</td>
                <td style="padding: 8px 0; color: #155724;">${classData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #155724;">${formattedDate} at ${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Spots Booked:</td>
                <td style="padding: 8px 0; color: #155724;">${booking.quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">${packageInfo?.isPackageBooking ? 'Per-Class Cost:' : 'Total Paid:'}</td>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">$${packageInfo?.isPackageBooking && packageInfo.perClassAmount ? (packageInfo.perClassAmount * booking.quantity).toFixed(2) : (classData.price * booking.quantity).toFixed(2)}</td>
              </tr>
              ${packageInfo?.isPackageBooking ? `
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Booked With:</td>
                <td style="padding: 8px 0; color: #155724;">Package: ${packageInfo.packageTitle || 'Package'}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trainn.pro/my-classes" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Class Details</a>
          </div>
          
          <p style="color: #333; line-height: 1.6;">Keep up the great work! Your students love training with you.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.com
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: coach.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`New booking notification sent to coach ${coach.email} for ${classData.title}`);
    return true;
  } catch (error) {
    console.error('New booking notification email error:', error);
    return false;
  }
}

// Password reset email template
export async function sendPasswordResetEmail(
  email: string, 
  resetToken: string, 
  firstName: string
): Promise<boolean> {
  // Use production domain for password reset links
  const baseUrl = 'https://trainn.pro';
  const resetUrl = `${baseUrl}/auth?tab=reset&token=${resetToken}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Outdoor fitness and creative classes for adults and kids</p>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
        
        <p style="color: #333; line-height: 1.6;">Hello ${firstName},</p>
        <p style="color: #333; line-height: 1.6;">We received a request to reset your password for your Trainn account. If you didn't make this request, you can safely ignore this email.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Your Password</a>
        </div>
        
        <p style="color: #333; line-height: 1.6;">Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 14px; color: #333;">${resetUrl}</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
          <p style="color: #856404; margin: 0; font-weight: bold;">This link will expire in 1 hour for security reasons.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            Questions? Contact us at support@trainn.com
          </p>
          <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
            This is an automated email from Trainn.
          </p>
        </div>
      </div>
    </div>
  `;

  const textContent = `
Password Reset Request - Trainn

Hello ${firstName},

We received a request to reset your password for your Trainn account. If you didn't make this request, you can safely ignore this email.

To reset your password, click on the following link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you have any questions, please contact our support team at support@trainn.com.

Best regards,
The Trainn Team
  `;

  try {
    await mailService.send({
      to: email,
      from: 'noreply@trainn.pro',
      subject: 'Reset Your Password - Trainn',
      text: textContent,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: false
        }
      }
    });
    return true;
  } catch (error) {
    console.error('SendGrid password reset email error:', error);
    return false;
  }
}

export async function sendNewCoachNotificationToAdmin(coach: User): Promise<boolean> {
  try {
    const textContent = `
New Provider Registration - Trainn

A new provider has registered on the Trainn platform and requires approval.

Provider Details:
Name: ${coach.firstName} ${coach.lastName}
Email: ${coach.email}
Phone: ${coach.phone || 'Not provided'}
Registration Date: ${new Date().toLocaleDateString()}

Areas of Expertise: ${coach.areasOfExpertise || 'Not specified'}
Bio: ${coach.bio || 'Not provided'}

Please log in to the admin panel to review and approve this provider profile.

Best regards,
The Trainn Team
    `;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Provider Registration - Trainn</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">New Provider Registration</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Admin Notification</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-bottom: 25px;">A new provider has registered on the Trainn platform and requires approval.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0; font-size: 18px;">Provider Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6c757d; width: 30%;">Name:</td>
              <td style="padding: 8px 0;">${coach.firstName} ${coach.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Email:</td>
              <td style="padding: 8px 0;">${coach.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Phone:</td>
              <td style="padding: 8px 0;">${coach.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6c757d;">Registration Date:</td>
              <td style="padding: 8px 0;">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        ${coach.areasOfExpertise ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #495057; margin-top: 0;">Areas of Expertise:</h4>
          <p style="margin: 0;">${coach.areasOfExpertise}</p>
        </div>
        ` : ''}
        
        ${coach.bio ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #495057; margin-top: 0;">Bio:</h4>
          <p style="margin: 0;">${coach.bio}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #6c757d; margin-bottom: 20px;">Please log in to the admin panel to review and approve this provider profile.</p>
        </div>
        
        <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d;">
          <p style="margin: 0;">Best regards,<br>The Trainn Team</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await mailService.send({
      to: 'sam@trainn.pro',
      from: 'support@trainn.pro',
      subject: 'New Provider Registration - Approval Required',
      text: textContent,
      html: htmlContent,
    });

    console.log('Admin notification email sent successfully for new coach:', coach.email);
    return true;
  } catch (error) {
    console.error('Failed to send admin notification for new coach:', error);
    return false;
  }
}

// Send promo code approval notification to coach
export async function sendPromoCodeApprovalEmail(coach: User, promoCode: any): Promise<boolean> {
  try {
    const subject = `Promo Code Approved: ${promoCode.code}`;
    
    const discountText = promoCode.discountType === 'percentage' 
      ? `${promoCode.discountValue}% off`
      : `$${promoCode.discountValue} off`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #28a745; margin-bottom: 20px;">🎉 Promo Code Approved!</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${coach.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Great news! Your promo code has been approved and is now active on the platform.</p>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">Approved Promo Code Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Code:</td>
                <td style="padding: 8px 0; color: #155724; font-size: 18px; font-weight: bold;">${promoCode.code}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Discount:</td>
                <td style="padding: 8px 0; color: #155724;">${discountText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Usage Limit:</td>
                <td style="padding: 8px 0; color: #155724;">${promoCode.usageLimit || 'Unlimited'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Valid Until:</td>
                <td style="padding: 8px 0; color: #155724;">${new Date(promoCode.validUntil).toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #333; line-height: 1.6;">Your promo code is now live and customers can start using it to book your classes. You can share this code with your community to encourage bookings.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trainn.pro/promo-codes" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Manage Promo Codes</a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.pro
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: coach.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`Promo code approval email sent to ${coach.email} for code: ${promoCode.code}`);
    return true;
  } catch (error) {
    console.error('Promo code approval email error:', error);
    return false;
  }
}

// Send promo code rejection notification to coach
export async function sendPromoCodeRejectionEmail(coach: User, promoCode: any): Promise<boolean> {
  try {
    const subject = `Promo Code Not Approved: ${promoCode.code}`;
    
    const discountText = promoCode.discountType === 'percentage' 
      ? `${promoCode.discountValue}% off`
      : `$${promoCode.discountValue} off`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #dc3545; margin-bottom: 20px;">Promo Code Update</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${coach.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Thank you for submitting your promo code. After review, we're unable to approve this particular code at this time.</p>
          
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #721c24; margin-top: 0;">Promo Code Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #721c24; font-weight: bold;">Code:</td>
                <td style="padding: 8px 0; color: #721c24; font-size: 18px; font-weight: bold;">${promoCode.code}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #721c24; font-weight: bold;">Discount:</td>
                <td style="padding: 8px 0; color: #721c24;">${discountText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #721c24; font-weight: bold;">Status:</td>
                <td style="padding: 8px 0; color: #721c24;">Not Approved</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #333; line-height: 1.6;">This code has been deactivated and won't be available for customer use. If you'd like to learn more about why this code wasn't approved or discuss different promotional options, please don't hesitate to reach out to our support team.</p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #1565c0; margin: 10px 0;">
              <li>Create a new promo code with different terms</li>
              <li>Contact our support team to discuss promotional strategies</li>
              <li>Review our promo code guidelines in your provider dashboard</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:support@trainn.pro" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Contact Support</a>
            <a href="https://trainn.pro/promo-codes" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Create New Code</a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.pro
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: coach.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`Promo code rejection email sent to ${coach.email} for code: ${promoCode.code}`);
    return true;
  } catch (error) {
    console.error('Promo code rejection email error:', error);
    return false;
  }
}

interface BookingAdminNotificationData {
  booking: Booking;
  classData: Class;
  customer: User;
  coach: User;
  bookingType: 'paid' | 'promo_code' | 'credits' | 'package';
  paymentAmount?: number; // Amount paid in cents (0 for free bookings)
}

export async function sendBookingAdminNotification(
  data: BookingAdminNotificationData
): Promise<boolean> {
  console.log('Sending admin notification for new booking...');
  console.log('Booking data:', {
    bookingId: data.booking.id,
    className: data.classData.title,
    customerEmail: data.customer.email,
    bookingType: data.bookingType
  });
  
  try {
    const { booking, classData, customer, coach, bookingType, paymentAmount = 0 } = data;
    
    // Format date and time in Pacific Time
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const classDate = new Date(classData.startTime!);
    const classEndTime = new Date(classData.endTime!);
    
    // Convert to Pacific Time
    const classDatePT = toZonedTime(classDate, PACIFIC_TIMEZONE);
    const classEndTimePT = toZonedTime(classEndTime, PACIFIC_TIMEZONE);
    
    const formattedDate = format(classDatePT, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedTime = `${format(classDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE })} - ${format(classEndTimePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE })} PT`;

    // Format booking type for display
    const getBookingTypeDisplay = (type: string) => {
      switch (type) {
        case 'paid': return 'Paid Booking';
        case 'promo_code': return 'Promo Code';
        case 'credits': return 'Account Credits';
        case 'package': return 'Package Usage';
        default: return 'Unknown';
      }
    };

    // Format coach name (with business name if applicable)
    const getCoachDisplayName = (coach: User) => {
      if (coach.displayBusinessName && coach.businessName) {
        return `${coach.firstName} ${coach.lastName} (${coach.businessName})`;
      }
      return `${coach.firstName} ${coach.lastName}`;
    };

    const subject = `New Booking: ${classData.title} - ${formattedDate}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">New Booking Notification</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">📅 New Class Booking</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; width: 30%;">Booking ID:</td>
                <td style="padding: 8px 0; color: #333;">#${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class Name:</td>
                <td style="padding: 8px 0; color: #333;">${classData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate}<br>${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Provider:</td>
                <td style="padding: 8px 0; color: #333;">${getCoachDisplayName(coach)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0; color: #333;">${classData.address || classData.location}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0;">👤 Customer Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #666; font-weight: bold; width: 30%;">Name:</td>
                <td style="padding: 5px 0; color: #333;">${customer.firstName} ${customer.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; font-weight: bold;">Email:</td>
                <td style="padding: 5px 0; color: #333;"><a href="mailto:${customer.email}" style="color: #1976d2;">${customer.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; font-weight: bold;">Phone:</td>
                <td style="padding: 5px 0; color: #333;">${customer.phone || 'Not provided'}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f1f8e9; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #388e3c; margin: 0 0 15px 0;">💳 Payment Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #666; font-weight: bold; width: 30%;">Booking Type:</td>
                <td style="padding: 5px 0; color: #333;">${getBookingTypeDisplay(bookingType)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; font-weight: bold;">Quantity:</td>
                <td style="padding: 5px 0; color: #333;">${booking.quantity} ${booking.quantity === 1 ? 'spot' : 'spots'}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; font-weight: bold;">Amount Paid:</td>
                <td style="padding: 5px 0; color: #333;">$${(paymentAmount / 100).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              This is an automated notification from the Trainn booking system.
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: 'sam@trainn.pro',
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
    });

    console.log(`✅ Admin notification sent to sam@trainn.pro for booking #${booking.id}`);
    return true;
  } catch (error) {
    console.error('❌ Admin notification email error:', error);
    return false;
  }
}

interface PostClassFeedbackData {
  booking: Booking;
  classData: Class;
  customer: User;
  coach: User;
}

export async function sendPostClassFeedbackEmail(
  data: PostClassFeedbackData
): Promise<boolean> {
  
  try {
    const { booking, classData, customer, coach } = data;
    
    const subject = `Trainn Class Feedback + Your Next Class`;
    
    // Determine if this was a kids or adult class based on age group
    const ageGroupFilter = classData.ageGroup === 'Kids' ? 'Kids' : 'Adults';
    const categoryFilter = classData.categoryId || '';
    
    // Build URLs with appropriate filters
    const reviewUrl = `https://trainn.pro/review?classId=${classData.id}&bookingId=${booking.id}`;
    const bookAnotherUrl = `https://trainn.pro/classes?ageGroup=${ageGroupFilter}&category=${categoryFilter}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
            Hi ${customer.firstName || 'there'},
          </p>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
            Thanks for joining us for <strong>${classData.title}</strong> with <strong>${coach.firstName} ${coach.lastName}</strong>! Your next step is simple:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <div style="margin-bottom: 20px;">
              <div style="margin-bottom: 15px;">
                <span style="color: #333; font-weight: bold;">Tell us about your experience:</span>
              </div>
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="${reviewUrl}" 
                   style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Rate the Class
                </a>
              </div>
            </div>
            
            <div>
              <div style="margin-bottom: 15px;">
                <span style="color: #333; font-weight: bold;">Lock in your next session:</span>
              </div>
              <div style="text-align: center;">
                <a href="${bookAnotherUrl}" 
                   style="background-color: #28a745; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Book Another Class
                </a>
              </div>
            </div>
          </div>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
            Your future self will thank you. 🙌
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px;">
            <p style="color: #333; margin: 0 0 5px 0; font-size: 16px;">
              See you soon,
            </p>
            <p style="color: #333; margin: 0; font-size: 16px;">
              Sam from Trainn
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at support@trainn.pro
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: false,
        },
      },
    });

    console.log(`✅ Post-class feedback email sent to ${customer.email} for class ${classData.title}`);
    return true;
  } catch (error) {
    console.error('❌ Post-class feedback email error:', error);
    return false;
  }
}

interface WeeklyNewsletterData {
  customer: User;
  upcomingKidsClasses: Array<Class & { coach: User }>;
  upcomingAdultClasses: Array<Class & { coach: User }>;
  newProviders: Array<User>;
  recentReviews: Array<{ 
    review: any; 
    customer: User; 
    coach: User; 
    classData: Class;
  }>;
}

interface PackagePurchaseConfirmationData {
  packagePurchase: any; // PackagePurchase type
  packageDetails: any; // ClassPackage type  
  customer: User;
  coach: User;
  pricingDetails?: {
    originalPrice: number;
    discountAmount: number;
    finalAmount: number;
    stripeFee: number;
    appliedCredits?: number;
  };
}

export async function sendPackagePurchaseConfirmation(
  data: PackagePurchaseConfirmationData
): Promise<boolean> {
  try {
    console.log('📧 [PACKAGE] Starting package purchase confirmation email send...');
    const { packagePurchase, packageDetails, customer, coach, pricingDetails } = data;
    console.log('📧 [PACKAGE] Email data received:', {
      customerEmail: customer.email,
      packageTitle: packageDetails.title,
      coachName: `${coach.firstName} ${coach.lastName}`,
      purchaseDate: packagePurchase.purchase_date || packagePurchase.purchaseDate
    });
    
    // Format date 
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const purchaseDate = toZonedTime(new Date(packagePurchase.purchase_date || packagePurchase.purchaseDate), PACIFIC_TIMEZONE);
    const formattedPurchaseDate = format(purchaseDate, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedPurchaseTime = format(purchaseDate, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    // Format expiration date if available
    let expirationInfo = '';
    const expirationDate = packagePurchase.expiration_date || packagePurchase.expirationDate;
    if (expirationDate) {
      const expDate = toZonedTime(new Date(expirationDate), PACIFIC_TIMEZONE);
      const formattedExpirationDate = format(expDate, 'MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
      expirationInfo = `
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Expires:</td>
          <td style="padding: 8px 0; color: #333;">${formattedExpirationDate}</td>
        </tr>
      `;
    }

    const subject = `Trainn Package Purchase Confirmation - ${packageDetails.title}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Package Purchase Confirmation</h2>
          
          <p style="color: #333; line-height: 1.6;">
            Thank you for purchasing a class package with Trainn!<br>
            Your package is now active and ready to use. Booking details are shown below.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Package:</td>
                <td style="padding: 8px 0; color: #333;">${packageDetails.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Coach:</td>
                <td style="padding: 8px 0; color: #333;">
                  ${coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`}
                  ${coach.displayBusinessName && coach.businessName ? `<br><span style="color: #666; font-size: 14px;">with ${coach.firstName} ${coach.lastName}</span>` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Classes Included:</td>
                <td style="padding: 8px 0; color: #333;">${packagePurchase.class_count || packagePurchase.classCount} classes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Remaining Classes:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">${packagePurchase.remaining_classes || packagePurchase.remainingClasses} classes</td>
              </tr>
              ${expirationInfo}
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Purchase Date:</td>
                <td style="padding: 8px 0; color: #333;">${formattedPurchaseDate} at ${formattedPurchaseTime}</td>
              </tr>
              ${pricingDetails ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Paid:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">$${pricingDetails.finalAmount.toFixed(2)}</td>
              </tr>
              ${pricingDetails.appliedCredits ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Credits Applied:</td>
                <td style="padding: 8px 0; color: #059669;">-$${pricingDetails.appliedCredits.toFixed(2)}</td>
              </tr>
              ` : ''}
              ` : ''}
            </table>
          </div>
          
          ${packageDetails.description ? `
          <div style="margin: 25px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Package Details</h3>
            <p style="color: #666; line-height: 1.6;">${packageDetails.description}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #e0f7fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #333; margin: 0 0 15px 0;">How to Use Your Package</h3>
            <p style="color: #666; margin: 0; line-height: 1.6;">
              Visit your bookings page to see available classes from ${coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`}. 
              When you book a class, it will automatically use one of your package credits.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trainn.pro/bookings" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View My Packages
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at <a href="mailto:support@trainn.pro" style="color: #2563eb;">support@trainn.pro</a>
            </p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
              Trainn - Building stronger communities through fitness, creativity and play
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: false
        }
      }
    });

    console.log(`📧 [PACKAGE] ✅ Package purchase confirmation email sent to ${customer.email} for package ${packageDetails.title}`);
    return true;
  } catch (error) {
    console.error('📧 [PACKAGE] ❌ Package purchase confirmation email error:', error);
    return false;
  }
}

interface PackagePurchaseNotificationData {
  packagePurchase: any; // PackagePurchase type
  packageDetails: any; // ClassPackage type  
  customer: User;
  coach: User;
  pricingDetails?: {
    coachPayout: number;
    totalAmount: number;
  };
}

export async function sendPackagePurchaseNotification(
  data: PackagePurchaseNotificationData  
): Promise<boolean> {
  try {
    console.log('📧 [PACKAGE] Starting package purchase notification email to coach...');
    const { packagePurchase, packageDetails, customer, coach, pricingDetails } = data;
    console.log('📧 [PACKAGE] Notification email data:', {
      coachEmail: coach.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      packageTitle: packageDetails.title,
      purchaseDate: packagePurchase.purchase_date || packagePurchase.purchaseDate
    });
    
    // Format date 
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const purchaseDate = toZonedTime(new Date(packagePurchase.purchase_date || packagePurchase.purchaseDate), PACIFIC_TIMEZONE);
    const formattedPurchaseDate = format(purchaseDate, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedPurchaseTime = format(purchaseDate, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    const subject = `New Package Purchase - ${customer.firstName} ${customer.lastName} bought your ${packageDetails.title}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness, creativity and play</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">🎉 New Package Purchase!</h2>
          
          <p style="color: #333; line-height: 1.6;">
            Great news! ${customer.firstName} ${customer.lastName} just purchased your "${packageDetails.title}" package.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Customer:</td>
                <td style="padding: 8px 0; color: #333;">${customer.firstName} ${customer.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Package:</td>
                <td style="padding: 8px 0; color: #333;">${packageDetails.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Classes Purchased:</td>
                <td style="padding: 8px 0; color: #333;">${packagePurchase.class_count || packagePurchase.classCount} classes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Purchase Date:</td>
                <td style="padding: 8px 0; color: #333;">${formattedPurchaseDate} at ${formattedPurchaseTime}</td>
              </tr>
              ${pricingDetails ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Package Value:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">$${pricingDetails.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Your Potential Earnings:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">$${(pricingDetails.totalAmount * 0.85).toFixed(2)}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
            <h3 style="color: #333; margin: 0 0 15px 0;">What happens next?</h3>
            <p style="color: #666; margin: 0; line-height: 1.6;">
              • ${customer.firstName} can now book your classes using their package credits<br>
              • You'll receive earnings for each class they attend<br>
              • Payouts are processed automatically 24 hours after each class completion
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trainn.pro/my-classes" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View My Classes
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              Questions? Contact us at <a href="mailto:support@trainn.pro" style="color: #2563eb;">support@trainn.pro</a>
            </p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
              Trainn - Building stronger communities through fitness, creativity and play
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: coach.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: false
        }
      }
    });

    console.log(`📧 [PACKAGE] ✅ Package purchase notification email sent to coach ${coach.email} for package ${packageDetails.title}`);
    return true;
  } catch (error) {
    console.error('📧 [PACKAGE] ❌ Package purchase notification email error:', error);
    return false;
  }
}

export async function sendWeeklyNewsletterEmail(
  data: WeeklyNewsletterData
): Promise<boolean> {
  try {
    const { customer, upcomingKidsClasses, upcomingAdultClasses, newProviders, recentReviews } = data;
    
    // Format date range for the week
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    
    const weekStart = format(toZonedTime(today, PACIFIC_TIMEZONE), 'MMM d', { timeZone: PACIFIC_TIMEZONE });
    const weekEnd = format(toZonedTime(nextWeek, PACIFIC_TIMEZONE), 'MMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    
    const subject = `This Week on Trainn: ${upcomingKidsClasses.length + upcomingAdultClasses.length} Classes Await! 🏃‍♀️`;
    
    // Helper function to format class cards
    const formatClassCard = (classData: Class & { coach: User; bookedCount: number }, index: number) => {
      const classDate = new Date(classData.startTime!);
      const classDatePT = toZonedTime(classDate, PACIFIC_TIMEZONE);
      const dayName = format(classDatePT, 'EEEE', { timeZone: PACIFIC_TIMEZONE });
      const monthDay = format(classDatePT, 'MMM d', { timeZone: PACIFIC_TIMEZONE });
      const timeSlot = format(classDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';
      
      const classDetailUrl = `https://trainn.pro/classes/${classData.id}?utm_source=newsletter&utm_campaign=weekly_${weekStart.replace(' ', '_')}`;
      
      // Get available spots
      const availableSpots = classData.capacity - (classData.bookedCount || 0);
      
      return `
        <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin: 12px 0; background: white;">
          <div style="margin-bottom: 12px;">
            <h3 style="color: #2563eb; font-size: 18px; margin: 0 0 8px 0;">
              ${classData.title}
            </h3>
            <div style="color: #6b7280; font-size: 14px;">
              with ${classData.coach.firstName} ${classData.coach.lastName}
            </div>
          </div>
          
          <div style="margin: 12px 0;">
            <div style="margin: 4px 0;">📅 ${dayName}, ${monthDay} at ${timeSlot}</div>
            <div style="margin: 4px 0;">📍 ${classData.location || classData.address}</div>
            <div style="margin: 4px 0;">👥 ${availableSpots} spots available</div>
            <div style="font-weight: 600; color: #059669; margin: 4px 0;">💰 $${classData.price}</div>
          </div>
          
          <div style="margin-top: 16px;">
            <a href="${classDetailUrl}" 
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Book Now
            </a>
          </div>
        </div>
      `;
    };

    // Format provider spotlight cards
    const formatProviderCard = (provider: User & { categoryNames: string[] }) => {
      // Use profile image if available, otherwise use initials
      const profileImageUrl = provider.profileImage || provider.googleProfilePicture;
      const imageElement = profileImageUrl ? 
        `<img src="${profileImageUrl.startsWith('http') ? profileImageUrl : 'https://trainn.pro' + profileImageUrl}" 
             alt="${provider.firstName} ${provider.lastName}" 
             style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e5e5; display: block; margin: 0 auto 10px auto;" />` :
        `<div style="width: 60px; height: 60px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 10px auto;">
           ${provider.firstName.charAt(0)}${provider.lastName.charAt(0)}
         </div>`;
      
      const categoryText = provider.categoryNames && provider.categoryNames.length > 0 
        ? provider.categoryNames.join(', ') 
        : (provider.areasOfExpertise || 'New provider on Trainn');
      
      return `
        <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 12px 0; background: white; text-align: center;">
          <div style="margin-bottom: 15px;">
            ${imageElement}
            <h3 style="color: #333; font-size: 18px; margin: 0;">
              ${provider.displayBusinessName && provider.businessName ? provider.businessName : `${provider.firstName} ${provider.lastName}`}
            </h3>
            ${provider.displayBusinessName && provider.businessName ? 
              `<div style="color: #6b7280; font-size: 14px; margin-top: 4px;">with ${provider.firstName} ${provider.lastName}</div>` : 
              ''
            }
          </div>
          
          <div style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
            ${categoryText}
          </div>
          
          <a href="https://trainn.pro/coaches/${provider.id}?utm_source=newsletter" 
             style="background: #059669; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
            View Classes
          </a>
        </div>
      `;
    };

    // Format review cards
    const formatReviewCard = (reviewData: { review: any; customer: User; coach: User; classData: Class }) => {
      const stars = '★'.repeat(reviewData.review.rating) + '☆'.repeat(5 - reviewData.review.rating);
      const reviewDate = format(new Date(reviewData.review.createdAt), 'MMM d', { timeZone: PACIFIC_TIMEZONE });
      
      return `
        <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin: 12px 0; background: white;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <div style="color: #f59e0b; font-size: 16px; margin-bottom: 4px;">${stars}</div>
              <div style="font-weight: 600; color: #333; font-size: 14px;">
                ${reviewData.customer.firstName} ${reviewData.customer.lastName.charAt(0)}.
              </div>
            </div>
            <div style="color: #6b7280; font-size: 12px;">${reviewDate}</div>
          </div>
          
          <div style="color: #333; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">
            "${reviewData.review.comment}"
          </div>
          
          <div style="color: #6b7280; font-size: 13px;">
            About <strong>${reviewData.coach.firstName} ${reviewData.coach.lastName}</strong>'s 
            "${reviewData.classData.title}"
          </div>
        </div>
      `;
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 300;">Your Weekly Trainn Digest</h1>
            <p style="margin: 8px 0 0 0; font-size: 18px; opacity: 0.9;">
              Week of ${weekStart} - ${weekEnd}
            </p>
            <p style="margin: 16px 0 0 0; font-size: 16px; opacity: 0.8;">
              Hi ${customer.firstName}! ✨ ${upcomingKidsClasses.length + upcomingAdultClasses.length} amazing classes await you this week
            </p>
          </div>

          <div style="padding: 30px;">
            
            ${upcomingKidsClasses.length > 0 ? `
            <!-- Kids Classes Section -->
            <div style="margin-bottom: 40px;">
              <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">
                🧒 Kids Classes This Week (${upcomingKidsClasses.length})
              </h2>
              
              <div>
                ${upcomingKidsClasses.slice(0, 5).map(classData => formatClassCard(classData, 0)).join('')}
              </div>
              
              ${upcomingKidsClasses.length > 5 ? `
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://trainn.pro/classes?ageGroup=Kids&utm_source=newsletter" 
                   style="color: #2563eb; text-decoration: none; font-weight: 500;">
                  View All ${upcomingKidsClasses.length} Kids Classes →
                </a>
              </div>
              ` : ''}
            </div>
            ` : ''}

            ${upcomingAdultClasses.length > 0 ? `
            <!-- Adult Classes Section -->
            <div style="margin-bottom: 40px;">
              <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">
                💪 Adult Classes This Week (${upcomingAdultClasses.length})
              </h2>
              
              <div>
                ${upcomingAdultClasses.slice(0, 7).map(classData => formatClassCard(classData, 0)).join('')}
              </div>
              
              ${upcomingAdultClasses.length > 7 ? `
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://trainn.pro/classes?ageGroup=Adults&utm_source=newsletter" 
                   style="color: #2563eb; text-decoration: none; font-weight: 500;">
                  View All ${upcomingAdultClasses.length} Adult Classes →
                </a>
              </div>
              ` : ''}
            </div>
            ` : ''}

            ${newProviders.length > 0 ? `
            <!-- New Provider Spotlight -->
            <div style="margin-bottom: 40px;">
              <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0; border-bottom: 2px solid #059669; padding-bottom: 8px;">
                ✨ New Provider Spotlight
              </h2>
              
              <p style="color: #666; margin: 0 0 20px 0; line-height: 1.5;">
                Welcome our newest providers to the Trainn community! 
                ${newProviders.length === 1 ? 'Discover what they bring' : 'Explore what they bring'} to our growing family.
              </p>
              
              <div>
                ${newProviders.slice(0, 3).map(provider => formatProviderCard(provider)).join('')}
              </div>
            </div>
            ` : ''}

            ${recentReviews.length > 0 ? `
            <!-- Customer Reviews Section -->
            <div style="margin-bottom: 40px;">
              <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
                💬 What Our Community Is Saying
              </h2>
              
              <p style="color: #666; margin: 0 0 20px 0; line-height: 1.5;">
                Real experiences from Trainn community members just like you.
              </p>
              
              <div>
                ${recentReviews.slice(0, 3).map(review => formatReviewCard(review)).join('')}
              </div>
            </div>
            ` : ''}

            <!-- Footer CTA -->
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Ready to Get Active?</h3>
              <p style="color: #666; margin: 0 0 20px 0; line-height: 1.5;">
                Browse all available classes and find your next adventure
              </p>
              <a href="https://trainn.pro/classes?utm_source=newsletter" 
                 style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Explore All Classes
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e5e5;">
            <div style="margin-bottom: 15px;">
              <a href="https://trainn.pro" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Browse Classes</a>
              <span style="color: #ccc;">•</span>
              <a href="https://trainn.pro/profile" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Your Account</a>
              <span style="color: #ccc;">•</span>
              <a href="https://trainn.pro/faq" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Help</a>
            </div>
            
            <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.5;">
              Questions? Contact us at <a href="mailto:support@trainn.pro" style="color: #2563eb;">support@trainn.pro</a>
            </p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
              This weekly digest is sent to active Trainn community members. 
              <a href="https://trainn.pro/profile" style="color: #999;">Manage email preferences</a>
            </p>
          </div>

        </div>
      </div>
    `;

    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro',
      subject: subject,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: false
        }
      }
    });

    console.log(`✅ Weekly newsletter sent to ${customer.email} (${upcomingKidsClasses.length} kids, ${upcomingAdultClasses.length} adult classes)`);
    return true;
  } catch (error) {
    console.error('❌ Weekly newsletter email error:', error);
    return false;
  }
}