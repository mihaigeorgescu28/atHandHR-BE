import express from "express";
import UserService from '../services/userService.js';
import BrevoService from '../services/brevoService.js'; // Import the BrevoService
import { upload } from '../utils/utils.js';

const router = express.Router();
const hostURL = process.env.REACT_APP_HOSTURL;

router.get('/getUserData/:userID', async (req, res) => {
  try {
    const userID = req.params.userID;
    const userData = await UserService.getUserDataById(userID);
    
    if (userData.length === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(200).json(userData);
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Failed to retrieve user data. Please try again later.' });
  }
});

// Handle user registration
router.post('/register', async (req, res) => {
  try {
    const registrationResult = await UserService.registerUser(req.body);

    if (registrationResult.success) {
      const { email, firstName, lastName } = req.body;

      // Access verifyEmailUID from registrationResult
      const verifyEmailUID = registrationResult.verifyEmailUID;

      const verificationURL = `${hostURL}/auth/verifyUser/${verifyEmailUID}`;

      // Additional parameters for customizing the email template
      const additionalParams = {
        firstName: `${firstName}`,
        verificationURL,
        // Add other parameters as needed based on your email template placeholders
      };

      // If registration is successful, send verification email with additional parameters
      const sendVerifyEmailResult = await BrevoService.sendVerifyEmail(
        email,
        `${firstName} ${lastName}`,
        verificationURL,
        additionalParams
      );
      const userID = registrationResult.userID;


      if (sendVerifyEmailResult.status === 200) {
         // Insert verify email history into email history table
         await UserService.insertEmailCommunicationHistory(userID, 2, verifyEmailUID);

        res.status(200).json({
          ...registrationResult,
          message: 'Your registration was successful! Please check your email inbox to activate your account.',
        });
      } else {
        res.status(sendVerifyEmailResult.status).json({
          success: false,
          message: 'Failed to send verification email. Please try again later.',
          error: sendVerifyEmailResult.data.error,
        });
      }
    } else {
      res.status(200).json(registrationResult);
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user. Please try again later.' });
  }
});






router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginResult = await UserService.loginUser(email, password);


      res.status(200).json(loginResult);
    
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login user. Please try again later.' });
  }
});

// Endpoint to handle user verification
router.post('/verifyUser', async (req, res) => {
  try {
    const { verifyEmailUID } = req.body;

    // Call userService function to verify the user
    const verificationResult = await UserService.verifyUser(verifyEmailUID);

    if (verificationResult.success) {
      if (verificationResult.alreadyVerified) {
        res.status(200).json({
          success: true,
          message: 'Email is already verified. Please try to login.',
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'User verification successful. Your account is now verified.',
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'User verification failed. Invalid verification link.',
      });
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Failed to verify user. Please try again later.' });
  }
});

// Endpoint to handle current client information
router.post('/currentClient', async (req, res) => {
  try {
    const { UserID } = req.body;

    // Call UserService function to get current client information
    const clientInfo = await UserService.getCurrentClient(UserID);

    if (clientInfo.success) {
      res.status(200).json(clientInfo);
    } else {
      res.status(404).json({ message: 'Client not found or inactive' });
    }
  } catch (error) {
    console.error('Error fetching current client:', error);
    res.status(500).json({ error: 'Failed to fetch current client. Please try again later.' });
  }
});

// Endpoint to handle user details
router.post('/getUserDetails', async (req, res) => {
  try {
    const { UserID } = req.body;

    // Call UserService function to get user details
    const userDetails = await UserService.getUserDetails(UserID);

    if (userDetails.success) {
      res.status(200).json(userDetails);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details. Please try again later.' });
  }
});


// Endpoint to disable an employee
router.post('/disableEmployee', async (req, res) => {
  const { UserID } = req.body;

  // Validate userId
  if (!UserID) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const result = await UserService.disableEmployee(UserID);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating employee status:', error);
    res.status(500).json({ message: 'Error updating employee status.' });
  }
});

// Endpoint to get line managers for a user
router.post('/getLineManagers', async (req, res) => {
  const { clientId } = req.body;

  try {
    const result = await UserService.getLineManagers(clientId);
    if (result.LineManagers) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching line managers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get roles for a user
router.post('/getRoles', async (req, res) => {
  const { clientId } = req.body;

  try {
    const result = await UserService.getRoles(clientId);
    if (result.Roles) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching line managers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get client positions for a user
router.post('/getClientPositions', async (req, res) => {
  const { clientId } = req.body;

  try {
    const result = await UserService.getClientPositions(clientId);
    if (result.Positions) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/submitUserForm', upload.single('ProfilePicture'), async (req, res) => {
  const { formType, UserID, ...fieldsToUpdate } = req.body;
  const emailaddress = { emailaddress: req.body.EmailAddress };
  const emailaddressstr = req.body.EmailAddress;
  const profilePicture = req.file;

  try {
    if (formType === 'new') {
      // Check if email address is provided
      if (!emailaddress) {
        return res.status(400).json({ error: 'The user needs to have a valid email address in order to be added' });
      }

      // Check if the email already exists
      const existingUserWithEmail = await UserService.getUserByEmailAndExcludeUserID(emailaddressstr, UserID);

      if (existingUserWithEmail.statusCode === 200) {
        // Email does not exist, proceed with inserting new user
        const insertUser = await UserService.insertUser(emailaddressstr, fieldsToUpdate, profilePicture);
        const { temporaryPassword, firstName, userID } = insertUser;
        const additionalParams = {
        firstName: `${firstName}`,
        temporaryPassword: `${temporaryPassword}`,
        // Add other parameters as needed based on your email template placeholders
      };


        // If registration is successful, send temporary password email with additional parameters
      const sendTemporaryPasswordResult = await BrevoService.sendTemporaryPasswordEmail(
        emailaddressstr,
        firstName,
        temporaryPassword,
        additionalParams
      );

      if (sendTemporaryPasswordResult.status === 200) {
        // Insert verify email history into email history table
        await UserService.insertEmailCommunicationHistory(userID, 3, temporaryPassword);

       res.status(200).json({
        success: true,
         message: 'Your registration was successful! Please check your email inbox to activate your account.',
         temporaryPassword: temporaryPassword
       });
     } else {
       res.status(sendTemporaryPasswordResult.status).json({
         success: false,
         message: 'Failed to send verification email. Please try again later.',
         error: sendTemporaryPasswordResult.data.error,
       });
     }


      } else if (existingUserWithEmail.statusCode === 404) {
        // Email already exists for another user
        return res.status(404).json({ error: 'Email Address already exists for another user' });
      } else {
        // Handle other errors
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      // Handle updating existing user
      const existingUserWithEmail = await UserService.getUserByEmailAndExcludeUserID(emailaddress, UserID);

      if (existingUserWithEmail.statusCode === 404) {
        return res.status(404).json({ error: 'Email Address already exists for another user' });
      } else if (existingUserWithEmail.statusCode === 200) {
        const result = await UserService.submitUserForm(UserID, emailaddress, fieldsToUpdate, profilePicture, formType);
        return res.status(200).json(result);
      } else {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  } catch (error) {
    // Handle errors
    console.error('Error updating/inserting user:', error);
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    } else {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});


router.get("/totalStaffOfClient", async (req, res) => {
  try {
    const { ClientID } = req.query;
    const totalStaff = await UserService.getTotalStaffOfClient(ClientID); // Use the function from UserService
    res.status(200).json(totalStaff);
  } catch (error) {
    console.error('Error fetching total staff of client:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await UserService.uploadFile(filePath);
    res.json(result);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/resetUserPassword', async (req, res) => {
  try {
    const { resetPasswordUID } = req.body;

    // Call userService function to verify the user password reset
    await UserService.resetUserPassword(resetPasswordUID);

    // If the function executes without errors, the reset password URL is valid
    res.status(200).json({
      success: true,
      message: 'Type a new password for your account.',
    });
  } catch (error) {
    console.error('Error verifying user password reset:', error);

    // If an error occurs during verification, send an appropriate error response
    if (error.status === 404) {
      res.status(404).json({
        success: false,
        message: 'User reset password URL is invalid.',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to verify user password reset. Please try again later.',
      });
    }
  }
});

// Endpoint to handle updating user password after reset
router.post('/updateResetUserPassword', async (req, res) => {
  try {
    const { newPassword, resetPasswordUID } = req.body;

    // Call userService function to update the user password
    await UserService.updateResetUserPassword(newPassword, resetPasswordUID);

    // If the function executes without errors, the password is updated successfully
    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('Error updating user password:', error);

    // If an error occurs during password update, send an appropriate error response
    res.status(500).json({
      success: false,
      message: 'Failed to update user password. Please try again later.',
    });
  }
});

// Endpoint to handle updating user password after temporary password
router.post('/updateTemporaryUserPassword', async (req, res) => {
  try {
    const { newPassword, userId } = req.body;

    // Call userService function to update the user password
    await UserService.updateTemporaryUserPassword(newPassword, userId);

    // If the function executes without errors, the password is updated successfully
    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('Error updating user password:', error);

    // If an error occurs during password update, send an appropriate error response
    res.status(500).json({
      success: false,
      message: 'Failed to update user password. Please try again later.',
    });
  }
});

// Endpoint to handle updating user password after temporary password
router.post('/checkForTemporaryPassword', async (req, res) => {
  try {
    const { userId } = req.body;

    // Call userService function to check for temporary password
    const result = await UserService.checkForTemporaryPassword(userId);

    // If the function executes without errors and success is true, user with temporary password is found
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'User with temporary password found.',
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'User with temporary password not found.',
      });
    }
  } catch (error) {
    console.error('Error finding user with temporary password:', error);

    // If an error occurs during password update, send an appropriate error response
    res.status(500).json({
      success: false,
      message: 'Failed to find user with temporary password!',
    });
  }
});


// Endpoint to get latest news for user
router.post('/viewLatestNews', async (req, res) => {
  try {
    const { clientId } = req.body;

    const result = await UserService.getLatestNews(clientId);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Success',
        news: result.news // Include the fetched news data in the response
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Something went wrong!',
      });
    }
  } catch (error) {
    console.error('Something went wrong!', error);

    // If an error occurs during password update, send an appropriate error response
    res.status(500).json({
      success: false,
      message: 'Failed to get latest news',
    });
  }
});



export default router;
