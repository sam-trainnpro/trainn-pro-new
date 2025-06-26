import { MailService } from '@sendgrid/mail';
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
    `${classData.description || ''}\n\nLocation: ${classData.address}\n\nBooked through Trainn`
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
    const { booking, classData, customer, coach } = data;
    
    // Format date and time
    const classDate = new Date(classData.startTime!);
    const classEndTime = new Date(classData.endTime!);
    const formattedDate = classDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = classDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Generate calendar invite URL
    const calendarInviteUrl = generateCalendarInviteUrl(classData, classDate, classEndTime);

    const subject = `Trainn Confirmation and Receipt for ${classData.title} on ${formattedDate}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness and play</p>
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
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Cost:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">$${(classData.price * booking.quantity).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Spots Booked:</td>
                <td style="padding: 8px 0; color: #333;">${booking.quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Coach:</td>
                <td style="padding: 8px 0; color: #333;">${coach.firstName} ${coach.lastName}</td>
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
Coach: ${coach.firstName} ${coach.lastName}
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
    const classDate = new Date(classData.startTime!);
    const classEndTime = new Date(classData.endTime!);
    const formattedDate = classDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = classDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Generate calendar invite URL for reminder
    const calendarInviteUrl = generateCalendarInviteUrl(classData, classDate, classEndTime);

    const subject = `Reminder: ${classData.title} tomorrow at ${formattedTime}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Your Fitness Journey Awaits</p>
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
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Coach:</td>
                <td style="padding: 8px 0; color: #333;">${coach.firstName} ${coach.lastName}</td>
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
Coach: ${coach.firstName} ${coach.lastName}
Location: ${classData.location}
${classData.whatToBring ? `What to Bring: ${classData.whatToBring}` : ''}

Add to Calendar: ${calendarInviteUrl}

Please arrive 10-15 minutes early for check-in.

Questions? Contact us at support@trainn.com

Trainn - Your Fitness Journey Awaits
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
    const classDate = new Date(classData.startTime!);
    const formattedDate = classDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = classDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const subject = `Class Cancelled: ${classData.title} on ${formattedDate}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness and play</p>
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
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Coach:</td>
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
export async function sendCoachApprovalNotification(coach: User): Promise<boolean> {
  try {
    const subject = `Welcome to Trainn - Your Coach Account is Approved!`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness and play</p>
          </div>
          
          <h2 style="color: #28a745; margin-bottom: 20px;">🎉 Congratulations!</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${coach.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Great news! Your coach account has been approved and you can now start creating and managing fitness classes on Trainn.</p>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">What you can do now:</h3>
            <ul style="color: #155724; margin: 10px 0;">
              <li>Create your first fitness class</li>
              <li>Set your own pricing and schedule</li>
              <li>Manage bookings and customers</li>
              <li>Track your earnings</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://trainn.pro/create-class" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Create Your First Class</a>
          </div>
          
          <p style="color: #333; line-height: 1.6;">We're excited to have you as part of the Trainn community. Start sharing your passion for fitness and help others achieve their goals!</p>
          
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
    const classDate = new Date(classData.startTime!);
    const formattedDate = classDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = classDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const subject = `Booking Cancelled: ${classData.title} on ${formattedDate}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness and play</p>
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
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Coach:</td>
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
    const newClassDate = new Date(newClassData.startTime!);
    const formattedDate = newClassDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = newClassDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const subject = `Class Update: ${newClassData.title} on ${formattedDate}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness and play</p>
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
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Coach:</td>
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
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness and play</p>
          </div>
          
          <h2 style="color: #28a745; margin-bottom: 20px;">🎉 Welcome to Trainn!</h2>
          
          <p style="color: #333; line-height: 1.6;">Hi ${user.firstName},</p>
          <p style="color: #333; line-height: 1.6;">Welcome to Trainn! We're excited to have you join our community of fitness enthusiasts.</p>
          
          ${isCoach ? `
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">As a Coach, you can:</h3>
            <ul style="color: #1565c0; margin: 10px 0;">
              <li>Create and manage fitness classes</li>
              <li>Set your own pricing and schedule</li>
              <li>Build your fitness community</li>
              <li>Earn money doing what you love</li>
            </ul>
            <p style="color: #1565c0; margin-bottom: 0; font-size: 14px;">
              <strong>Note:</strong> Your coach account is pending approval. You'll receive an email once it's approved and you can start creating classes.
            </p>
          </div>
          ` : `
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1565c0; margin-top: 0;">As a Customer, you can:</h3>
            <ul style="color: #1565c0; margin: 10px 0;">
              <li>Browse and book fitness classes</li>
              <li>Find classes near you</li>
              <li>Connect with amazing coaches</li>
              <li>Track your fitness journey</li>
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
              Welcome to your fitness journey with Trainn!
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
  booking: Booking
): Promise<boolean> {
  try {
    const classDate = new Date(classData.startTime!);
    const formattedDate = classDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = classDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const subject = `New Booking: ${customer.firstName} ${customer.lastName} booked ${classData.title}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness and play</p>
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
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">Total Paid:</td>
                <td style="padding: 8px 0; color: #155724; font-weight: bold;">$${(classData.price * booking.quantity).toFixed(2)}</td>
              </tr>
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
          <p style="color: #666; margin: 5px 0 0 0;">Your Fitness Journey Awaits</p>
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