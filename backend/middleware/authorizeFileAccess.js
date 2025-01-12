import UserService from '../services/userService.js';

export async function authorizeFileAccess(req, res, next) {
  const userId = req.user?.UserID; // Extract `UserID` from `req.user`, set by `authenticateToken`
  const requestedFilePath = req.path; // Get the requested file path

  if (!userId) {
    return res.status(400).json({ message: 'Bad Request: User ID is missing' });
  }

  // Extract `clientId` from the file path (e.g., `/3/company_documents/...`)
  const fileClientId = requestedFilePath.split('/')[1];
  if (!fileClientId || isNaN(fileClientId)) {
    return res.status(400).json({ message: 'Bad Request: Invalid file path' });
  }


  try {
    // Call `getClientIdByUserId` from UserService to fetch the user's ClientID
    const userClientId = await UserService.getClientIdByUserId(userId);

    if (!userClientId) {
      console.error('❌ Unauthorized: Client ID not found for user');
      return res.status(403).json({ message: 'Unauthorized: Client ID not found' });
    }


    // Compare the `ClientID` from the file path with the one retrieved from the database
    if (fileClientId !== userClientId.toString()) {
      return res.status(403).json({ message: 'Unauthorized: Access denied' });
    }

    // Allow access if client IDs match
    next();
  } catch (err) {
    console.error('❌ Error in authorizeFileAccess:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
