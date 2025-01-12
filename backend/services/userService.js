// services/userService.js
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { generateRandomKey } from '../utils/utils.js';
import bcrypt from 'bcryptjs';



const UserService = {
  getUserDataById: (userID, clientID) => {
    const userDataQuery = `
      SELECT 
        us.UserID,
        us.FirstName,
        us.LastName,
        CONCAT(us.FirstName, ' ', us.LastName) as 'FullName',
        us.EmailAddress,
        us.CompanyEmailAddress,
        us.PhoneNumber,
        us.CompanyPhoneNumber,
        DATE(us.DOB) as DateOfBirth,
        us.WorkingShiftHours,
        CONCAT(
          COALESCE(us.HolidayEntitelementLeftDays, 0),
          IF(COALESCE(us.HolidayEntitelementLeftDays, 0) <> 1, ' days, ', ' day, '),
          COALESCE(us.HolidayEntitelementLeftHours, 0),
          IF(COALESCE(us.HolidayEntitelementLeftHours, 0) <> 1, ' hours', ' hour')
        ) as HolidayEntitlement,        
        us.HolidayEntitelementLeftDays,
        us.HolidayEntitelementLeftHours,
        us.PositionID,
        p.PositionName,
        us.EmployeeNumber,
        us.ExEmployee,
        us.NINO,
        us.LineManagerID,
        CONCAT(us1.FirstName, ' ', us1.LastName) as 'LineManager',
        DATE(us.JoinedDate) as JoinedDate,
        us.Salary,
        us.BuildingNameNumber,
        us.StreetName,
        us.TownCity,
        us.Country,
        us.PostalCode,
        us.ProfilePicture,
        us.RoleID,
        ro.RoleName as 'Role'

      FROM user us
      LEFT JOIN position p on us.PositionID = p.PositionID
      LEFT JOIN user us1 on us1.UserID = us.LineManagerID
      LEFT JOIN role ro on ro.RoleID = us.RoleID
      WHERE us.UserID = ? AND us.ClientID = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(userDataQuery, [userID, clientID], (error, result) => {
        if (error) {
          reject(error);
        } else {
          const userData = result.map((item) => ({
            UserID: item.UserID,
            FirstName: item.FirstName || "",
            LastName: item.LastName || "",
            FullName: item.FullName || "",
            EmailAddress: item.EmailAddress || "",
            CompanyEmailAddress: item.CompanyEmailAddress || "",
            PhoneNumber: item.PhoneNumber || "",
            CompanyPhoneNumber: item.CompanyPhoneNumber || "",
            DOB: item.DateOfBirth || "",
            WorkingShiftHours: item.WorkingShiftHours || "8",
            HolidayEntitlement: item.HolidayEntitlement || "",
            HolidayEntitelementLeftDays: item.HolidayEntitelementLeftDays || "0",
            HolidayEntitelementLeftHours: item.HolidayEntitelementLeftHours || "0",
            PositionID : item.PositionID || "",
            Position : item.PositionName || "",
            EmployeeNumber : item.EmployeeNumber || "",
            ExEmployee: item.ExEmployee || "",
            NINO: item.NINO || "",
            LineManagerID: item.LineManagerID || "",
            LineManager: item.LineManager || "",
            JoinedDate: item.JoinedDate || "",
            Salary: item.Salary || "",
            BuildingNameNumber: item.BuildingNameNumber || "",
            StreetName: item.StreetName || "",
            TownCity: item.TownCity || "",
            Country: item.Country || "",
            PostalCode: item.PostalCode || "",
            ProfilePicture: item.ProfilePicture || "",
            RoleID: item.RoleID || "",
            Role: item.Role || "",
            
          }));
          resolve(userData);
        }
      });
    });
  },
  

// registerUser 
registerUser: (userData) => {
  return new Promise((resolve, reject) => {
    const checkExistingEmailAddress = 'SELECT COUNT(*) AS NumberOfUsersFound FROM user WHERE EmailAddress = ?';
    const getClientIdQuery = 'SELECT ClientID FROM client WHERE UniqueIdentifier = ?';
    const insertUserQuery = 'INSERT INTO user (`ClientID`, `EmailAddress`, `Password`, `FirstName`, `LastName`, `DOB`, `Status`, `VerifyEmailUID`, `RoleID`) VALUES (?)';

    const emailValues = [userData.email];

    // Check if the email address already exists
    db.query(checkExistingEmailAddress, emailValues, (err, existingUsersResult) => {
      if (err) {
        reject(err);
      } else {
        const existingUsers = existingUsersResult[0];

        if (existingUsers && existingUsers.NumberOfUsersFound > 0) {
          resolve({
            success: false,
            message: 'The selected email address already exists on our system. Please try a different one or contact your administrator!',
          });
        } else {
          // Fetch ClientID based on UniqueIdentifier
          const uidValues = [userData.uid];
          db.query(getClientIdQuery, uidValues, (uidErr, uidResult) => {
            if (uidErr) {
              reject(uidErr);
            } else {
              const clientInfo = uidResult[0];

              if (!clientInfo || !clientInfo.ClientID) {
                resolve({
                  success: false,
                  message: 'Failed to register user. Client not found',
                  error: 'No rows affected during user registration.',
                });
              } else {
                // Generate VerifyEmailUID using uuid library
                const verifyEmailUID = uuidv4();

                const insertValues = [
                  clientInfo.ClientID,
                  userData.email,
                  userData.password,
                  userData.firstName,
                  userData.lastName,
                  userData.DOB,
                  'Active',
                  verifyEmailUID,
                  2,
                ];

                db.query(insertUserQuery, [insertValues], (insertErr, result) => {
                  if (insertErr) {
                    reject(insertErr);
                  } else {
                    if (result && result.affectedRows > 0) {
                      // Return userID along with other data upon successful registration
                      const userID = result.insertId;
                      resolve({
                        success: true,
                        message: 'Your registration was successful! Please check your email to activate your account.',
                        verifyEmailUID,
                        userID // Include userID in the response
                      });
                    } else {
                      resolve({
                        success: false,
                        message: 'Failed to register user. Please try again later.',
                        error: 'No rows affected during user registration.',
                      });
                    }
                  }
                });
              }
            }
          });
        }
      }
    });
  });
}
,


 // Function to log in user
 loginUser: (email, password) => {
  return new Promise((resolve, reject) => {
    const checkTempPasswordSQL = 'SELECT UserID, VerifiedEmail, Status FROM user WHERE EmailAddress = ? AND TemporaryPasswordUID = ?';
    const checkLoginMatchSQL = 'SELECT COUNT(*) AS UserFound, UserID, VerifiedEmail, RoleID, Status FROM user WHERE EmailAddress = ? AND Password = ?';

    const values = [email, password];

    db.query(checkTempPasswordSQL, values, (tempErr, tempResult) => {
      if (tempErr) {
        reject(tempErr);
      } else {
        if (tempResult.length === 1) {
          const userID = tempResult[0].UserID;
          const isVerified = tempResult[0].VerifiedEmail === 'Yes';
          const status = tempResult[0].Status;

          if (status !== 'Active') {
            resolve({
              success: false,
              message: 'This account is not active! Please check with your administrator!'
            });
          } else {
            resolve({
              success: true,
              message: 'Temporary password found',
              temporaryPasswordFound: true,
              UserID: userID,
              VerifiedEmail: isVerified
            });
          }
        } else {
          db.query(checkLoginMatchSQL, values, (err, result) => {
            if (err) {
              reject(err);
            } else {
              if (result[0].UserFound === 0) {
                resolve({
                  success: false,
                  message: 'Invalid email or password.'
                });
              } else if (result[0].UserFound === 1) {
                const userID = result[0].UserID;
                const roleID = result[0].RoleID;
                const isVerified = result[0].VerifiedEmail === 'Yes';
                const status = result[0].Status;

                if (status !== 'Active') {
                  resolve({
                    success: false,
                    message: 'This account is not active! Please check with your administrator!'
                  });
                } else if (isVerified) {
                  resolve({
                    success: true,
                    message: 'Login successful',
                    UserID: userID,
                    RoleID: roleID,
                    VerifiedEmail: isVerified,
                    temporaryPasswordFound: false // No temporary password
                  });
                } else {
                  resolve({
                    success: false,
                    message: 'Email not verified! Please check your email inbox for the verification link.'
                  });
                }
              } else {
                resolve({
                  success: false,
                  message: 'Multiple users found. Contact your administrator.'
                });
              }
            }
          });
        }
      }
    });
  });
},




  // Function to verify user based on VerifyEmailUID
verifyUser: (verifyEmailUID) => {
  return new Promise((resolve, reject) => {
    // SQL query to retrieve UserID and VerifiedEmail status based on VerifyEmailUID
    const getUserInfoQuery = 'SELECT UserID, VerifiedEmail FROM user WHERE VerifyEmailUID = ?';
    const updateVerifiedStatusQuery = 'UPDATE user SET VerifiedEmail = ? WHERE UserID = ?';

    db.query(getUserInfoQuery, [verifyEmailUID], (err, result) => {
      if (err) {
        reject(err);
      } else {
        const user = result[0];

        if (user && user.UserID) {
          const userID = user.UserID;
          const isVerified = user.VerifiedEmail === 'Yes';

          if (isVerified) {
            // User is already verified
            resolve({ 
              success: true, 
              alreadyVerified: true, // Include this if the user is already verified
              message: 'Email is already verified. Please try to login.' 
            });
            
          } else {

            // Update VerifiedEmail status
            db.query(updateVerifiedStatusQuery, ['Yes', userID], (updateErr, updateResult) => {
              if (updateErr) {
                reject(updateErr);
              } else {
                // Check if the update was successful
                if (updateResult.affectedRows > 0) {
                  resolve({ success: true, message: 'Email verification successful. Your account is now verified.' });
                } else {
                  resolve({ success: false, message: 'Email verification failed. Unable to update verification status.' });
                }
              }
            });
          }
        } else {
          resolve({ success: false, message: 'User not found with the provided verification link.' });
        }
      }
    });
  });
},

// Function to get current client information based on UserID
getCurrentClient: (UserID) => {
  return new Promise((resolve, reject) => {
    const currentClientID = "SELECT ClientID, ClientName, HolidaySystem, DailyShiftTracker, LatLongTracker, WorkingWeekends, HolidayEntitlementDefaultDays, HolidayEntitlementDefaultHours FROM client WHERE ClientID IN (SELECT ClientID from user WHERE UserID = ?) AND Status = 'Active' ";

    db.query(currentClientID, UserID, (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result && result.length > 0) {
          const clientInfo = {
            success: true,
            message: 'Success',
            ClientID: result[0].ClientID,
            ClientName: result[0].ClientName,
            HolidaySystem: result[0].HolidaySystem,
            DailyShiftTracker: result[0].DailyShiftTracker,
            LatLongTracker: result[0].LatLongTracker,
            WorkingWeekends: result[0].WorkingWeekends,
            HolidayEntitlementDefaultDays: result[0].HolidayEntitlementDefaultDays,
            HolidayEntitlementDefaultHours: result[0].HolidayEntitlementDefaultHours
          };
          resolve(clientInfo);
        } else {
          resolve({ success: false, message: 'Client not found or inactive' });
        }
      }
    });
  });
},

getUserDetails: (UserID) => {
  return new Promise((resolve, reject) => {
    const userDetailsQuery = `
    SELECT 
    FirstName,
    LastName,
    EmailAddress,
    CONCAT(FirstName, ' ', LastName) AS FullName, 
    ProfilePicture,
    CASE 
        WHEN (
            SELECT DATEDIFF(MIN(StartDateTime), CURDATE()) 
            FROM leave_request 
            WHERE StartDateTime > CURDATE()
            AND LeaveTypeID = 1
            AND StatusID = 2
            AND leave_request.UserID = lere.UserID
        ) = 0 THEN 'Now'
        ELSE COALESCE(
            (
                SELECT DATEDIFF(MIN(StartDateTime), CURDATE()) 
                FROM leave_request 
                WHERE StartDateTime > CURDATE()
                AND LeaveTypeID = 1
                AND StatusID = 2
                AND leave_request.UserID = lere.UserID
            ), 
            'N/A'
        ) 
    END AS DaysUntilNextHoliday
FROM 
    user 
LEFT JOIN 
    leave_request lere ON lere.UserID = user.UserID 
WHERE 
    user.UserID = ?
LIMIT 1;
`;

    db.query(userDetailsQuery, UserID, (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result && result[0] && result[0].FullName) {
          const userDetails = {
            success: true,
            message: 'Success',
            FirstName: result[0].FirstName,
            FullName: result[0].FullName,
            EmailAddress: result[0].EmailAddress,
            ProfilePic: result[0].ProfilePicture,
            DaysUntilNextHoliday: result[0].DaysUntilNextHoliday
          };
          resolve(userDetails);
        } else {
          resolve({ success: false, message: 'User not found' });
        }
      }
    });
  });
},

 // Function to handle daily shift actions (sign in/out)
 handleDailyShift: (UserID, password, Latitude, Longitude) => {
  return new Promise((resolve, reject) => {
    // Generator unique identifier
    const UniqueShiftIdentifier = generateRandomKey(32);

    // PW check before proceeding to sign in/out
    const checkPasswordQuery = "SELECT COUNT(*) AS UserFound, UserID FROM user WHERE UserID = ? AND Password = ?";
    const checkPasswordValues = [UserID, password];

    db.query(checkPasswordQuery, checkPasswordValues, (passwordErr, passwordResult) => {
      if (passwordErr) {
        reject(passwordErr);
      } else {
        if (passwordResult[0].UserFound === 1) {
          // Inserting new daily record
          const insertDailyShiftQuery = "INSERT INTO user_shift_times (`UserID`,`ActionTypeID`,`UniqueShiftIdentifier`, `DateTime`, `Latitude`, `Longitude`, `Finished`) VALUES (?, ?, ?, NOW(), ?, ?, ?)";
          const insertValues = [UserID, 1, UniqueShiftIdentifier, Latitude, Longitude, 0];

          // Get primary ID & date
          const existingDailyShiftQuery = "SELECT UserShiftTimeID, DateTime, UniqueShiftIdentifier FROM user_shift_times WHERE UserID = ? AND ActionTypeID = 1 AND Finished = 0 AND DateTime IS NOT NULL ORDER BY UserShiftTimeID DESC LIMIT 1";

          db.query(existingDailyShiftQuery, UserID, (shiftErr, shiftResult) => {
            if (shiftErr) {
              reject(shiftErr);
            } else {
              if (shiftResult.length === 0) {
                // Record not found, do the insert
                db.query(insertDailyShiftQuery, insertValues, (insertErr) => {
                  if (insertErr) {
                    resolve({ status: 500, response: { message: "Error", error: insertErr } });
                  } else {
                    resolve({ status: 200, response: { message: "You have successfully signed in for today!", Action: 'Sign In' } });
                  }
                });
              } else if (shiftResult.length > 0) {
                // Record found, do the update
                const updateDailyShiftQuery = "UPDATE user_shift_times SET Finished = 1 WHERE UniqueShiftIdentifier = ?";
                const updateValues = [shiftResult[0].UniqueShiftIdentifier];

                const insertValues = [UserID, 2, shiftResult[0].UniqueShiftIdentifier, Latitude, Longitude, 1];

                db.query(insertDailyShiftQuery, insertValues, (insertErr) => {
                  if (insertErr) {
                    resolve({ status: 500, response: { message: "Error", error: insertErr } });
                  } else {
                    resolve({ status: 200, response: { message: "You have successfully signed out for today!", Action: "Sign Out" } });
                  }
                });

                db.query(updateDailyShiftQuery, updateValues);
              }
            }
          });
        } else {
          resolve({ status: 400, response: { message: "The password you have entered does not seem to match the one previously used to login! Please try again." } });
        }
      }
    });
  });
},

// Function to disable an employee
disableEmployee: (UserID) => {
  return new Promise((resolve, reject) => {
    // Perform SQL update to disable employee
    const disableEmployeeQuery = 'UPDATE User SET Status = ? WHERE UserID = ?';
    const values = ['In-Active', UserID];

    db.query(disableEmployeeQuery, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({ message: 'Employee successfully disabled.' });
      }
    });
  });
},

 // Function to get line managers for a user
 getLineManagers: (clientId) => {
  return new Promise((resolve, reject) => {
    // Construct SQL SELECT query
    const selectQuery = `
      SELECT UserID, CONCAT_WS(' ', NULLIF(FirstName, ''), NULLIF(LastName, '')) AS FullName
      FROM user
      WHERE ClientID = ?
      AND Status = 'Active'
    `;

    // Execute the query
    db.query(selectQuery, [clientId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results.length > 0) {
          const lineManagers = results.map(result => ({
            value: result.UserID, // Assuming UserID is the ID property
            label: result.FullName,
          }));
          resolve({ LineManagers: lineManagers });
        } else {
          resolve({ error: 'Line Managers not found' });
        }
      }
    });
  });
},

 // Function to get line managers for a user
 getRoles: (clientId) => {
  return new Promise((resolve, reject) => {
    // Construct SQL SELECT query
    const selectQuery = `
      SELECT RoleID, RoleName FROM role WHERE Status = 'Active'
    `;

    // Execute the query
    db.query(selectQuery, (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results.length > 0) {
          const roles = results.map(result => ({
            value: result.RoleID, // Assuming UserID is the ID property
            label: result.RoleName,
          }));
          resolve({ Roles: roles });
        } else {
          resolve({ error: 'Roles not found' });
        }
      }
    });
  });
},

// Function to get client positions for a user
getClientPositions: (clientId) => {
  return new Promise((resolve, reject) => {
    // Construct SQL SELECT query
    const selectQuery = `
      SELECT po.PositionID, po.PositionName
      FROM position po
      WHERE po.ClientID = ?
      AND po.Status = 'Active'
    `;

    // Execute the query
    db.query(selectQuery, [clientId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results.length > 0) {
          const positions = results.map(result => ({
            value: result.PositionID,
            label: result.PositionName,
          }));
          resolve({ Positions: positions });
        } else {
          resolve({ error: 'Positions not found' });
        }
      }
    });
  });
},

// Function to update user data and profile picture
submitUserForm: (UserID, emailaddress, fieldsToUpdate, profilePicture, formType) => {
  return new Promise((resolve, reject) => {
      // Construct SQL UPDATE query
      let updateQuery = 'UPDATE user SET';
      const queryParams = [];

      // Add fields to SET clause dynamically based on availability
      Object.entries(fieldsToUpdate).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          // Check if value is an object
          if (typeof value === 'object' && value !== null && 'value' in value) {
            updateQuery += ` ${key} = ?,`;
            queryParams.push(value.value); // Use the value property
          } else {
            updateQuery += ` ${key} = ?,`;
            queryParams.push(value);
          }
        } else {
          updateQuery += ` ${key} = NULL,`; // Set to NULL if value is undefined, empty, or null
        }
      });

      // Remove the trailing comma
      updateQuery = updateQuery.slice(0, -1);

      // Append profile picture update if available
      if (profilePicture) {
        updateQuery += ', ProfilePicture = ?';
        queryParams.push(profilePicture.filename);
      }

      // Add the WHERE clause
      updateQuery += ' WHERE UserID = ?';
      queryParams.push(UserID);

      // Check if there are fields to update
      if (queryParams.length <= 1) {
        resolve({ message: 'No fields to update' });
      }

      // Execute the query
      db.query(updateQuery, queryParams, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve({ message: 'User updated successfully' });
        }
      });
    
  });
},

insertUser: (emailAddress, fieldsToUpdate, profilePicture) => {
  return new Promise((resolve, reject) => {
    // Construct SQL INSERT query
    let insertQuery = 'INSERT INTO user SET ?';
    // Generate unique identifier for temporary password
    const temporaryPasswordUID = generateRandomKey(8);
    const trimmedPassword = temporaryPasswordUID.trim(); // Trim leading and trailing whitespace
    const temporaryPasswordUIDHash = bcrypt.hashSync(trimmedPassword, '$2a$10$CwTycUXWue0Thq9StjUM0u');

    // Add TemporaryPasswordUID to fieldsToUpdate
    fieldsToUpdate.TemporaryPasswordUID = temporaryPasswordUIDHash;
    fieldsToUpdate.PositionID = fieldsToUpdate.PositionID.value;
    fieldsToUpdate.LineManagerID = fieldsToUpdate.LineManagerID.value;

    

    const newUser = {
      ...fieldsToUpdate, // Use fieldsToUpdate only
      ProfilePicture: profilePicture ? profilePicture.filename : null
    };
    
    // Replace empty string values with NULL
    Object.keys(newUser).forEach(key => {
      if (newUser[key] === '') {
        newUser[key] = null;
      }
    });

    // Execute the query
    db.query(insertQuery, newUser, (err, results) => {
      if (err) {
        reject(err);
      } else {
        // Get the userID of the inserted user
        const userID = results.insertId;

        // Resolve with the inserted user data including the userID
        resolve({
          message: 'User inserted successfully',
          temporaryPassword: temporaryPasswordUID,
          userID: userID, // Pass the userID here
          firstName: fieldsToUpdate.firstname
        });
      }
    });
  });
},






getUserByEmailAndExcludeUserID: (EmailAddress, UserID) => {

  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM user WHERE EmailAddress = ? AND UserID != ?';

    db.query(query, [EmailAddress, UserID], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        reject(err);
      } else {
        if (results.length > 0) {
          // User found with a different user ID
          reject({ statusCode: 400, message: 'Email Address already exists for another user' });
        } else {
          // User not found
          resolve({ statusCode: 200, message: 'Email Address not found for any other user' });
        }
      }
    });
  });
},




// Function to get total staff of a client
getTotalStaffOfClient : (ClientID) => {
  return new Promise((resolve, reject) => {
    const totalStaffOfClientQuery = `
      SELECT 
        UserID,
        CONCAT_WS(' ', NULLIF(FirstName, ''), NULLIF(LastName, '')) AS 'FullName',
        EmailAddress,
        DATE_FORMAT(DOB, '%d/%m/%Y') as DateOfBirth,
        WorkingShiftHours,
        CONCAT(
          HolidayEntitelementLeftDays,
          IF(HolidayEntitelementLeftDays > 1 OR HolidayEntitelementLeftDays = 0, ' days, ', ' day, '),
          HolidayEntitelementLeftHours,
          IF(HolidayEntitelementLeftHours > 1 OR HolidayEntitelementLeftHours = 0, ' hours', ' hour')
        ) as HolidayEntitlement,
        PositionName,
        EmployeeNumber
      FROM user
      LEFT JOIN position p on user.PositionID = p.PositionID
      WHERE user.ClientID = ?
      AND user.Status = 'Active'
    `;
    const values = [ClientID];
    
    db.query(totalStaffOfClientQuery, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const totalStaff = result.map(item => ({
          UserID: item.UserID,
          FullName: item.FullName,
          EmailAddress: item.EmailAddress,
          DOB: item.DateOfBirth,
          WorkingShiftHours: item.WorkingShiftHours,
          HolidayEntitlement: item.HolidayEntitlement,
          Position: item.PositionName,
          EmployeeNumber: item.EmployeeNumber
        }));
        resolve(totalStaff);
      }
    });
  })
},

uploadFile: (filePath) => {
  return new Promise((resolve, reject) => {
    // Process the file path (e.g., save it in the database)
    // Here, you can save 'filePath' in the database or use it as needed
    // For example, you can return the file path as a response
    resolve({ filePath });
  });
},

// Function to generate reset password UID and update user record
generateResetUserPassword: (UserID) => {
  return new Promise((resolve, reject) => {
    // Generate UUID for reset password UID
    const resetPasswordUID = uuidv4();

    // SQL query to update user record with reset password UID
    const updateResetPasswordUIDQuery = `
      UPDATE user 
      SET ResetPasswordUID = ? 
      WHERE UserID = ?
    `;
    
    const values = [resetPasswordUID, UserID];

    // Execute SQL update
    db.query(updateResetPasswordUIDQuery, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        // Resolve with resetPasswordUID directly
        resolve(resetPasswordUID);
      }
    });
  });
},

 // Function to verify UI of the reset of user password based on ResetPasswordUID
 resetUserPassword: (resetPasswordUID) => {
  return new Promise((resolve, reject) => {
    // SQL query to retrieve ResetPasswordUID based on UserID
    const getResetPasswordUIDQuery = 'SELECT ResetPasswordUID FROM user WHERE ResetPasswordUID = ?';

    db.query(getResetPasswordUIDQuery, [resetPasswordUID], (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.length > 0) {
          // ResetPasswordUID exists, resolve with success message
          resolve({ success: true, message: 'Type a new password for your account.' });
        } else {
          // ResetPasswordUID not found, reject with error message
          reject({ success: false, message: 'User reset password URL is invalid.' });
        }
      }
    });
  });
},

 // Function to update user password after reset
 updateResetUserPassword: (newPassword, resetPasswordUID) => {
  return new Promise((resolve, reject) => {
    // SQL query to update user password and reset password UID
    const updateResetPasswordQuery = `
      UPDATE user 
      SET Password = ?, 
          LastPasswordResetDate = NOW(), 
          ResetPasswordUID = NULL 
      WHERE ResetPasswordUID = ?
      LIMIT 1
    `;


    db.query(updateResetPasswordQuery, [newPassword, resetPasswordUID], (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.affectedRows > 0) {
          resolve();
        } else {
          reject(new Error('Invalid reset password UID.'));
        }
      }
    });
  });
},

 // Function to update user password after reset
 insertEmailCommunicationHistory: (userId, emailTemplateId, UID) => {
  return new Promise((resolve, reject) => {
    // Assuming you have a MySQL connection object named 'connection'
    const query = `
      INSERT INTO email_history (EmailTemplateID, UserID, UID, DateTimeSent)
      VALUES (?, ?, ?, NOW())
    `;

    db.query(query, [emailTemplateId, userId, UID], (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
},

 // Function to update user password after reset
 updateTemporaryUserPassword: (newPassword, userId) => {
  return new Promise((resolve, reject) => {
    // SQL query to update user password and reset password UID
    const updateTemporaryPasswordQuery = `
      UPDATE user 
      SET Password = ?, 
          LastTemporaryPasswordDate = NOW(), 
          TemporaryPasswordUID = NULL,
          VerifiedEmail = 'Yes'
      WHERE UserID = ?
      LIMIT 1
    `;


    db.query(updateTemporaryPasswordQuery, [newPassword, userId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.affectedRows > 0) {
          resolve();
        } else {
          reject(new Error('Invalid reset password UID.'));
        }
      }
    });
  });
},

 // Function to check if user has temporary password to change
 checkForTemporaryPassword: (userId) => {
  return new Promise((resolve, reject) => {
    // SQL query to check if the user has a temporary password
    const checkForTemporaryPasswordQuery = `
      SELECT UserID FROM user
      WHERE UserID = ?
      AND TemporaryPasswordUID IS NOT NULL
      AND TemporaryPasswordUID != ''
    `;

    db.query(checkForTemporaryPasswordQuery, [userId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.length > 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false });
        }
      }
    });
  });
},


// Function to get latest news for client
getLatestNews: (clientId) => {
  return new Promise((resolve, reject) => {
    // SQL query to fetch latest news
    const getLatestNewsQuery = `
      SELECT 
        lane.Title, 
        lane.Content, 
        lane.ModifiedDate,
        lane.Colour,
        ic.IconName,
        CASE 
        WHEN TIMESTAMPDIFF(SECOND, lane.CreatedDate, CURRENT_TIMESTAMP()) < 60 THEN
            CASE TIMESTAMPDIFF(SECOND, lane.CreatedDate, CURRENT_TIMESTAMP())
                WHEN 1 THEN '1 second ago'
                ELSE CONCAT(TIMESTAMPDIFF(SECOND, lane.CreatedDate, CURRENT_TIMESTAMP()), ' seconds ago')
            END
        WHEN TIMESTAMPDIFF(MINUTE, lane.CreatedDate, CURRENT_TIMESTAMP()) < 60 THEN
            CASE TIMESTAMPDIFF(MINUTE, lane.CreatedDate, CURRENT_TIMESTAMP())
                WHEN 1 THEN '1 minute ago'
                ELSE CONCAT(TIMESTAMPDIFF(MINUTE, lane.CreatedDate, CURRENT_TIMESTAMP()), ' minutes ago')
            END
        WHEN TIMESTAMPDIFF(HOUR, lane.CreatedDate, CURRENT_TIMESTAMP()) < 24 THEN
            CASE TIMESTAMPDIFF(HOUR, lane.CreatedDate, CURRENT_TIMESTAMP())
                WHEN 1 THEN '1 hour ago'
                ELSE CONCAT(TIMESTAMPDIFF(HOUR, lane.CreatedDate, CURRENT_TIMESTAMP()), ' hours ago')
            END
        ELSE
            CASE DATEDIFF(CURRENT_DATE(), lane.CreatedDate)
                WHEN 1 THEN '1 day ago'
                ELSE CONCAT(DATEDIFF(CURRENT_DATE(), lane.CreatedDate), ' days ago')
            END
    END AS DaysSinceModified
      FROM 
        latest_news lane
      LEFT JOIN icons ic on ic.IconID = lane.IconID
      WHERE 
        lane.Status = 'Active'
        AND lane.ClientID = ?
      ORDER BY lane.LatestNewsID DESC
      LIMIT 5;
    `;

    db.query(getLatestNewsQuery, [clientId], (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.length > 0) {
          resolve({ success: true, news: result }); // Include the fetched news data in the resolve
        } else {
          resolve({ success: true, news: [] }); // Return empty array if no news found
        }
      }
    });
  });
},

// Function to get line managers for a user
getCompanyDocumentGroups: (clientId) => {
  return new Promise((resolve, reject) => {
    // Construct SQL SELECT query
    const selectQuery = `
      SELECT DocumentGroupID, DocumentGroupName FROM document_group dogr
      WHERE dogr.ClientID = ?
      AND dogr.Status = 1
    `;

    // Execute the query
    db.query(selectQuery, [clientId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results.length > 0) {
          const companyDocumentGroups = results.map(result => ({
            value: result.DocumentGroupID, // Assuming UserID is the ID property
            label: result.DocumentGroupName,
          }));
          resolve({ CompanyDocumentGroups: companyDocumentGroups });
        } else {
          resolve({ error: 'Company Documents not found' });
        }
      }
    });
  });
},

// Function to get client ID by user ID
getClientIdByUserId: (userId) => {
  return new Promise((resolve, reject) => {
    // Construct SQL SELECT query
    const selectQuery = `
      SELECT ClientID FROM user 
      WHERE UserID = ? 
      AND Status = 'Active' 
      LIMIT 1
    `;

    // Execute the query
    db.query(selectQuery, [userId], (err, results) => {
      if (err) {
        console.error('❌ Error fetching ClientID for UserID:', err);
        reject(err); // Reject with the error
      } else {
        if (results.length > 0 && results[0].ClientID) {
          console.log('✅ ClientID retrieved for UserID:', results[0].ClientID);
          resolve(results[0].ClientID); // Resolve with the ClientID
        } else {
          console.warn('❌ No ClientID found for UserID:', userId);
          resolve(null); // Resolve with null if no ClientID found
        }
      }
    });
  });
},
  
};

export default UserService;
