import express from "express";
import BrevoService from "../services/brevoService.js";
import UserService from "../services/userService.js";

const hostURL = process.env.REACT_APP_HOSTURL;



const router = express.Router();

router.post('/resetUserPassword', async (req, res) => {
    try {
        const userID = req.body.UserID;

        // Log the entire request body
        console.log('Received request body:', req.body);

        // Check if the userID is provided
        if (!userID) {
            return res.status(400).json({ error: 'UserID is required for password reset' });
        }

        console.log('Received reset password request for userID:', userID);

        // Fetch the user's email and first name from the user service
        const userData = await UserService.getUserDataById(userID);

        if (!userData) {
            console.log('User not found for userID:', userID);
            return res.status(404).json({ error: 'User not found' });
        }

        const { FirstName, EmailAddress } = userData[0]; // Assuming userData is an array with a single object

        // Generate reset password URL & fetch the string to send in email
        const resetUID = await UserService.generateResetUserPassword(userID);

        const resetURL = `${hostURL}/auth/resetUserPassword/${resetUID}`;

        if (!resetURL) {
            console.log('User not found for userID:', userID);
            return res.status(404).json({ error: 'User not found' });
        }

        // Send the email through Brevo API
        const result = await BrevoService.sendPasswordResetEmail(EmailAddress, FirstName, resetURL);

         // Insert reset password history into email history table
         await UserService.insertEmailCommunicationHistory(userID, 1, resetUID);

        // Return the result to the client
        res.status(result.status).json(result.data);
    } catch (error) {
        console.error('Error resetting user password:', error);
        res.status(500).json({ error: 'Failed to reset user password. Please try again later.' });
    }
});



export default router;
