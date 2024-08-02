// brevoService.js
import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';


// Load environment variables from .env file
dotenv.config();

var defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; // Use process.env to access environment variables;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();



class BrevoService {
    async sendPasswordResetEmail(email, firstName, resetURL) {
        const sendSmtpEmail = {
            to: [{ email, name: firstName }],
            templateId: 2, // Replace with your templateId
            params: { firstName, resetURL },
            headers: {
                'X-Mailin-custom': 'custom_header_1:custom_value_1|custom_header_2:custom_value_2'
            }
        };

        try {
            const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Brevo API called successfully. Returned data:', data);
            return { status: 200, data: { message: 'User password successfully reset' } };
        } catch (error) {
            console.error('Error sending email through Brevo API:', error);
            return { status: 500, data: { error: 'Failed to reset user password. Please try again later.' } };
        }
    }

  

    async sendVerifyEmail(email, fullName, verifyEmailUID, additionalParams) {
        const sendSmtpEmail = {
          to: [{ email, name: fullName, verifyUid: verifyEmailUID }],
          templateId: 3,
          params: { fullName, verifyEmailUID, ...additionalParams }, // Include additional parameters in the params object
          headers: {
            'X-Mailin-custom': 'custom_header_1:custom_value_1|custom_header_2:custom_value_2',
          },
        };
    
        try {
          const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
          console.log('Brevo API called successfully. Returned data:', data);
          return { status: 200, data: { message: 'Verify Email was sent successfully' } };
        } catch (error) {
          console.error('Error sending email through Brevo API:', error);
          return { status: 500, data: { error: 'Failed to verify email. Please try again later.' } };
        }
      }

      async sendTemporaryPasswordEmail(email, firstName, temporaryPassword) {
        const sendSmtpEmail = {
            to: [{ email, name: firstName }],
            templateId: 4, // Replace with your templateId
            params: { firstName, temporaryPassword },
            headers: {
                'X-Mailin-custom': 'custom_header_1:custom_value_1|custom_header_2:custom_value_2'
            }
        };

        try {
            const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Brevo API called successfully. Returned data:', data);
            return { status: 200, data: { message: 'User password successfully reset' } };
        } catch (error) {
            console.error('Error sending email through Brevo API:', error);
            return { status: 500, data: { error: 'Failed to reset user password. Please try again later.' } };
        }
    }
}

export default new BrevoService();
