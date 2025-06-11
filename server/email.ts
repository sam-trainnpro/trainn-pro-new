import { MailService } from '@sendgrid/mail';
import type { Class, User, Booking } from '../shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

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

Important: Please arrive 10-15 minutes early for check-in. 
If you need to cancel or reschedule, please contact us at least 24 hours in advance.

Questions? Contact us at support@trainn.com
    `;

    // Note: The 'from' email must be verified in SendGrid before emails can be sent
    // Go to SendGrid Dashboard > Settings > Sender Authentication to verify your sender email
    await mailService.send({
      to: customer.email,
      from: 'noreply@trainn.com', // Replace with your verified sender email from SendGrid
      subject: subject,
      text: textContent,
      html: htmlContent,
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
      from: 'noreply@trainn.com', // Replace with your verified sender email from SendGrid
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}