// SendGrid API test script
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable is not set');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'test@example.com', // Change to your recipient
  from: 'noreply@trainn.com', // Change to your verified sender
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully')
  })
  .catch((error) => {
    console.error('❌ SendGrid error:', error)
    if (error.response) {
      console.error('Response body:', error.response.body)
    }
  })