// Simple test to send calendar invite email directly
import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Generate calendar invite URL
function generateCalendarInviteUrl(classData, startTime, endTime) {
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: classData.title,
    dates: `${formatDate(startTime)}/${formatDate(endTime)}`,
    details: `${classData.description || ''}\n\nCoach: ${classData.coach}\nLocation: ${classData.location}\n\nBooked through Trainn`,
    location: classData.address || classData.location,
    trp: 'false'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function sendTestEmail() {
  console.log('Sending test booking confirmation email with calendar invite...');
  
  const classData = {
    title: "HIIT Bootcamp Test Class",
    description: "High-intensity interval training session focusing on cardio and strength building. Perfect for all fitness levels!",
    startTime: new Date('2025-06-27T18:00:00Z'),
    endTime: new Date('2025-06-27T19:00:00Z'),
    price: 45.00,
    address: "Central Park, New York, NY 10024",
    location: "Central Park - Sheep Meadow",
    whatToBring: "Water bottle, yoga mat, towel",
    coach: "Alex Johnson"
  };

  const booking = {
    id: 999,
    quantity: 1,
    totalAmount: 45.00
  };

  const customer = {
    firstName: "Sam",
    lastName: "Roth",
    email: "sam@trainn.pro"
  };

  // Generate calendar invite URL
  const calendarInviteUrl = generateCalendarInviteUrl(classData, classData.startTime, classData.endTime);

  // Format dates
  const formattedDate = classData.startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = classData.startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Booking Confirmed!</h1>
        <p style="color: #e8f4f8; margin: 10px 0 0 0; font-size: 16px;">Your fitness class is all set</p>
      </div>
      
      <div style="padding: 40px 20px;">
        <div style="background-color: #f8f9ff; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Class Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold; width: 30%;">Class:</td>
              <td style="padding: 8px 0; color: #333;">${classData.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
              <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
              <td style="padding: 8px 0; color: #333;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Coach:</td>
              <td style="padding: 8px 0; color: #333;">${classData.coach}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
              <td style="padding: 8px 0; color: #333;">${classData.address}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Total Cost:</td>
              <td style="padding: 8px 0; color: #333;">$${(classData.price * booking.quantity).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Spots:</td>
              <td style="padding: 8px 0; color: #333;">${booking.quantity}</td>
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
            Questions? Contact us at support@trainn.pro
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
Coach: ${classData.coach}
Location: ${classData.location}

Add to Calendar: ${calendarInviteUrl}

Important: Please arrive 10-15 minutes early for check-in. 
If you need to cancel or reschedule, please contact us at least 24 hours in advance.

Questions? Contact us at support@trainn.pro
  `;

  try {
    await mailService.send({
      to: customer.email,
      from: 'support@trainn.pro',
      subject: `Booking Confirmed: ${classData.title} - ${formattedDate}`,
      text: textContent,
      html: htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: false
        }
      }
    });

    console.log('✅ Test email sent successfully to sam@trainn.pro');
    console.log('Check your inbox for the booking confirmation with calendar invite button!');
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    return false;
  }
}

sendTestEmail();