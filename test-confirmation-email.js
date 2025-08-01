// Test script to send confirmation email with new format
import { MailService } from '@sendgrid/mail';
import { format, toZonedTime } from 'date-fns-tz';

if (!process.env.SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY environment variable must be set");
  process.exit(1);
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

function generateCalendarInviteUrl(classData, startTime, endTime) {
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const title = encodeURIComponent(classData.title);
  const description = encodeURIComponent(
    `${classData.description || ''}\n\nLocation: ${classData.address}\n\nBooked through Trainn`
  );
  const location = encodeURIComponent(classData.address || '');
  const startDateTime = formatDate(startTime);
  const endDateTime = formatDate(endTime);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${description}&location=${location}`;
}

async function sendTestConfirmationEmail() {
  try {
    console.log('Sending test confirmation email with updated pricing format...');
    
    const testBooking = {
      id: 999,
      quantity: 1,
      status: 'confirmed'
    };
    
    const testClassData = {
      id: 123,
      title: "Morning Yoga Flow",
      description: "A relaxing morning yoga session to start your day right",
      startTime: new Date('2025-08-02T08:00:00-08:00'),
      endTime: new Date('2025-08-02T09:00:00-08:00'),
      address: "Golden Gate Park, San Francisco, CA",
      whatToBring: "Yoga mat and water bottle",
      price: 15.00
    };
    
    const testCustomer = {
      id: 123,
      email: "kseniya.kapytouskaya+5c@gmail.com",
      firstName: "Kseniya",
      lastName: "Test"
    };
    
    const testCoach = {
      id: 456,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "coach@example.com"
    };
    
    const testPricingDetails = {
      originalPrice: 15.00,
      discountAmount: 5.00,
      finalAmount: 10.00,
      discountSource: "Referral Credit"
    };

    // Format date and time in Pacific Time
    const PACIFIC_TIMEZONE = 'America/Los_Angeles';
    const classDate = new Date(testClassData.startTime);
    const classEndTime = new Date(testClassData.endTime);
    
    // Convert to Pacific Time
    const classDatePT = toZonedTime(classDate, PACIFIC_TIMEZONE);
    const classEndTimePT = toZonedTime(classEndTime, PACIFIC_TIMEZONE);
    
    const formattedDate = format(classDatePT, 'EEEE, MMMM d, yyyy', { timeZone: PACIFIC_TIMEZONE });
    const formattedTime = format(classDatePT, 'h:mm a', { timeZone: PACIFIC_TIMEZONE }) + ' PT';

    // Generate calendar invite URL
    const calendarInviteUrl = generateCalendarInviteUrl(testClassData, classDate, classEndTime);

    const subject = `Trainn Confirmation and Receipt for ${testClassData.title} on ${formattedDate}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Trainn</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Building stronger communities through fitness and play</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Your booking is confirmed!</h2>
          
          <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
            Hi ${testCustomer.firstName}, you're all set for <strong>${testClassData.title}</strong>. 
            Here are your booking details:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Class:</td>
                <td style="padding: 8px 0; color: #333;">${testClassData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate} at ${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0; color: #333;">${testClassData.address}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Instructor:</td>
                <td style="padding: 8px 0; color: #333;">${testCoach.firstName} ${testCoach.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Spots Reserved:</td>
                <td style="padding: 8px 0; color: #333;">${testBooking.quantity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">What To Bring:</td>
                <td style="padding: 8px 0; color: #333;">${testClassData.whatToBring || 'Nothing specific required'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Paid:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">$${testPricingDetails.finalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${calendarInviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Add to Calendar
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 25px; font-size: 14px; color: #666;">
            <p><strong>Important Notes:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Please arrive 5-10 minutes early</li>
              <li>Cancellations must be made at least 24 hours in advance for a full refund</li>
              <li>Contact your instructor directly if you have any questions</li>
            </ul>
            
            <p style="margin-top: 20px;">
              Questions? Reply to this email or contact us at <a href="mailto:support@trainn.com">support@trainn.com</a>
            </p>
            
            <p style="margin-top: 20px; text-align: center; color: #999;">
              Thank you for choosing Trainn!<br>
              Building stronger communities through fitness and play
            </p>
          </div>
        </div>
      </div>
    `;

    await mailService.send({
      to: testCustomer.email,
      from: 'Trainn <noreply@trainn.com>',
      subject: subject,
      html: htmlContent,
    });

    console.log('✅ Test email sent successfully to kseniya.kapytouskaya+5c@gmail.com');
    console.log('📧 Email shows: "Total Paid: $10.00" (simplified one-line format)');
    console.log('🎯 This demonstrates the new pricing display for users with discounts');
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

sendTestConfirmationEmail();