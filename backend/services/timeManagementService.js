import db from '../db.js';
import { generateRandomKey } from '../utils/utils.js';


const TimeManagementService = {
 
// Function to handle daily shift actions (sign in/out)
handleDailyShift: (UserID, password, Latitude, Longitude) => {
  return new Promise((resolve, reject) => {
    // Generate unique identifier
    const UniqueShiftIdentifier = generateRandomKey(32);

    // PW check before proceeding to sign in/out
    const checkPasswordQuery = "SELECT COUNT(*) AS UserFound, UserID FROM user WHERE UserID = ? AND Password = ?";
    const checkPasswordValues = [UserID, password];

    db.query(checkPasswordQuery, checkPasswordValues, (passwordErr, passwordResult) => {
      if (passwordErr) {
        reject(passwordErr);
      } else {
        if (passwordResult[0].UserFound === 1) {
          // Check if the current day is a weekend and if the user can work on weekends
          const weekendCheckQuery = `
            SELECT 
              CASE
                WHEN DAYOFWEEK(CURDATE()) IN (1, 7) THEN 'Weekend'
                ELSE 'Weekday'
              END AS CurrentDayType, 
              WorkingWeekends
            FROM client
            WHERE ClientID = (SELECT ClientID FROM user WHERE UserID = ?)
          `;
          const weekendCheckValues = [UserID];

          db.query(weekendCheckQuery, weekendCheckValues, (weekendErr, weekendResult) => {
            if (weekendErr) {
              reject(weekendErr);
            } else {
              const { CurrentDayType, WorkingWeekends } = weekendResult[0];
              if (CurrentDayType === 'Weekend' && WorkingWeekends === 'No') {
                resolve({ status: 200, response: { message: "You are not allowed to sign in on weekend days or bank holidays. Please contact your administrator for more information!" } });
              } else {
                // Check if the user is on leave
                const leaveRequestQuery = `
                  SELECT le.UserID, le.LeaveRequestID, CURDATE(), le.StartDateTime, le.EndDateTime 
                  FROM leave_request le
                  WHERE le.UserID = ?
                  AND CURDATE() BETWEEN DATE(le.StartDateTime) AND DATE(le.EndDateTime)
                  AND le.StatusID = 2
                `;
                const leaveRequestValues = [UserID];

                db.query(leaveRequestQuery, leaveRequestValues, (leaveErr, leaveResult) => {
                  if (leaveErr) {
                    reject(leaveErr);
                  } else {
                    if (leaveResult.length > 0) {
                      resolve({ status: 200, response: { message: "You cannot sign in today as records show you are on leave." } });
                    } else {
                      // Check if there's already a sign-in record for today
                      const existingRecordQuery = "SELECT UserShiftTimeID FROM user_shift_times WHERE UserID = ? AND ActionTypeID = 2 AND DATE(DateTime) = CURDATE()";
                      const existingRecordValues = [UserID];

                      db.query(existingRecordQuery, existingRecordValues, (existingErr, existingResult) => {
                        if (existingErr) {
                          reject(existingErr);
                        } else {
                          if (existingResult.length > 0) {
                            resolve({ status: 200, response: { message: "You have already signed in for today, please come back tomorrow." } });
                          } else {
                            // Proceed with inserting or updating the daily shift record
                            const insertDailyShiftQuery = "INSERT INTO user_shift_times (`UserID`, `ActionTypeID`, `UniqueShiftIdentifier`, `DateTime`, `Latitude`, `Longitude`, `Finished`) VALUES (?, ?, ?, NOW(), ?, ?, ?)";
                            const insertValues = [UserID, 1, UniqueShiftIdentifier, Latitude, Longitude, 0];

                            // Get primary ID & date of existing unfinished shift record
                            const existingDailyShiftQuery = "SELECT UserShiftTimeID, DateTime, UniqueShiftIdentifier FROM user_shift_times WHERE UserID = ? AND ActionTypeID = 1 AND Finished = 0 AND DateTime IS NOT NULL ORDER BY UserShiftTimeID DESC LIMIT 1";

                            db.query(existingDailyShiftQuery, UserID, (shiftErr, shiftResult) => {
                              if (shiftErr) {
                                reject(shiftErr);
                              } else {
                                if (shiftResult.length === 0) {
                                  // No unfinished record found, insert a new one
                                  db.query(insertDailyShiftQuery, insertValues, (insertErr) => {
                                    if (insertErr) {
                                      resolve({ status: 500, response: { message: "Error", error: insertErr } });
                                    } else {
                                      resolve({ status: 200, response: { message: "You have successfully signed in for today!", Action: 'Sign In' } });
                                    }
                                  });
                                } else if (shiftResult.length > 0) {
                                  // Unfinished record found, update it and insert a new sign-out record
                                  const updateDailyShiftQuery = "UPDATE user_shift_times SET Finished = 1 WHERE UniqueShiftIdentifier = ?";
                                  const updateValues = [shiftResult[0].UniqueShiftIdentifier];

                                  const insertSignOutValues = [UserID, 2, shiftResult[0].UniqueShiftIdentifier, Latitude, Longitude, 1];

                                  db.query(insertDailyShiftQuery, insertSignOutValues, (insertErr) => {
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
                          }
                        }
                      });
                    }
                  }
                });
              }
            }
          });
        } else {
          resolve({ status: 200, response: { message: "The password you have entered does not seem to match the one previously used to login! Please try again." } });
        }
      }
    });
  });
},



// Function to handle current shift actions
handleCurrentShift: (UserID) => {
  return new Promise((resolve, reject) => {
    const existingDailyShiftQuery = `
    SELECT 
    user_shift_times.UserShiftTimeID,  
    CONCAT(     
        IF(DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%k') > 0,     
            CONCAT(DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%k'),     
            IF(DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%k') = 1, ' hour', ' hours')), 
        ''),  
        IF(DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%i') > 0,   
            CONCAT(IF(DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%k') > 0, ', ', ''),     
            DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%i'), 
            IF(DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%i') = 1, ' minute', ' minutes')),     
        ''),      
        IF(DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%s') > 0, 
            CONCAT(
                IF((DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%k') > 0 OR DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%i') > 0), ', ', ''),                 
                DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%s'), 
                IF(DATE_FORMAT(TIMEDIFF(NOW(), DateTime), '%s') = 1, ' second', ' seconds')
            ), 
        '')     
    ) AS ShiftDuration 
FROM 
    user_shift_times 
WHERE 
    UserID = ?
    AND ActionTypeID = 1 
    AND Finished = 0 
    AND DateTime IS NOT NULL 
ORDER BY 
    UserShiftTimeID DESC 
LIMIT 1;
`;

    db.query(existingDailyShiftQuery, UserID, (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result.length === 0) {
          resolve({ status: 200, response: { Action: 'Sign In' } });
        } else if (result.length > 0) {
          resolve({ status: 200, response: { Action: 'Sign Out', ShiftDuration: result[0].ShiftDuration } });
        }
      }
    });
  });
},

 // Function to handle SignInOutReportToday
 handleSignInOutReportToday: (ClientID, ActionTypeID) => {
  return new Promise((resolve, reject) => {
    const SignInOutReportToday = `
      SELECT
        (SELECT COUNT(DISTINCT UserID) FROM user_shift_times usshti_inner WHERE usshti_inner.ActionTypeID = us.ActionTypeID AND DATE(usshti_inner.DateTime) = CURDATE()) AS NumberOfUsersSignedInOut,
        ((SELECT COUNT(*) FROM user WHERE ClientID = u.ClientID AND user.Status = 'Active') -  (SELECT COUNT(DISTINCT UserID) FROM user_shift_times usshti_inner WHERE usshti_inner.ActionTypeID = us.ActionTypeID AND DATE(usshti_inner.DateTime) = CURDATE())) AS NumberOfUsersNotSignedInOut,
        (SELECT COUNT(*) FROM user WHERE ClientID = u.ClientID  AND user.Status = 'Active') AS TotalUsers,
        ROUND(((SELECT COUNT(DISTINCT UserID) FROM user_shift_times usshti_inner WHERE usshti_inner.ActionTypeID = us.ActionTypeID AND DATE(usshti_inner.DateTime) = CURDATE()) / (SELECT COUNT(*) FROM user WHERE ClientID = u.ClientID AND user.Status = 'Active')) * 100, 0) AS PercentageOfUsersSignedInOutToday
      FROM user_shift_times us
      LEFT JOIN user u ON u.UserID = us.UserID
      WHERE u.ClientID = ?
      AND us.ActionTypeID = ?
      GROUP BY u.ClientID;
    `;

    db.query(SignInOutReportToday, [ClientID, ActionTypeID], (err, result) => {
      if (err) {
        reject(err);
      } else {
        if (result && result.length > 0) { // Check if result contains rows
          const NumberOfUsersSignedInOut = result[0].NumberOfUsersSignedInOut;
          const NumberOfUsersNotSignedInOut = result[0].NumberOfUsersNotSignedInOut;
          const PercentageOfUsersSignedInOutToday = result[0].PercentageOfUsersSignedInOutToday;
          
          const responseObject = {
            SignInOutPending: [NumberOfUsersSignedInOut, NumberOfUsersNotSignedInOut],
            PercentageOfUsersSignedInOutToday,
          };
          
          resolve(responseObject);
        } else {
          // No rows found, return an empty response
          resolve({
            SignInOutPending: [0, 0],
            PercentageOfUsersSignedInOutToday: 0
          });
        }
      }
    });
  });
},

// Function to handle SignInOutLastUpdated
handleSignInOutLastUpdated: (ClientID, ActionTypeID) => {
  return new Promise((resolve, reject) => {
    const SignInOutLastUpdatedQuery = `
      SELECT CASE
        WHEN TIMESTAMPDIFF(HOUR, a.DateTime, NOW()) < 1 THEN CONCAT(TIMESTAMPDIFF(MINUTE, a.DateTime, NOW()), ' minutes')
        WHEN TIMESTAMPDIFF(DAY, a.DateTime, NOW()) < 1 THEN CONCAT(TIMESTAMPDIFF(HOUR, a.DateTime, NOW()), ' hours')
        ELSE CONCAT(TIMESTAMPDIFF(DAY, a.DateTime, NOW()), ' days')
        END AS LastUpdatedInDays
      FROM user_shift_times a
      LEFT JOIN user b on a.UserID = b.UserID
      WHERE YEAR(a.DateTime) = YEAR(NOW())
      AND b.ClientID = ?
      AND a.ActionTypeID = ?
      ORDER BY a.DateTime DESC
      LIMIT 1;
    `;

    db.query(SignInOutLastUpdatedQuery, [ClientID, ActionTypeID], (err, result) => {
      if (err) {
        reject(err);
      } else {
        const response = result.map(item => ({ LastSignInOutLeaveDate: item.LastUpdatedInDays }));
        resolve(response);
      }
    });
  });
},

getSignInOutMonthlyReport: (ClientID, ActionTypeID) => {
  return new Promise((resolve, reject) => {
    const SignInOutMonthlyReportQuery = `
      SELECT
        LEFT(MONTHNAME(usshti.DateTime), 3) AS Month,
        COUNT(usshti.UserID) AS NumberOfSignInsOuts
      FROM
        user_shift_times usshti
      LEFT JOIN
        user us ON usshti.UserID = us.UserID
      WHERE
        us.ClientID = ?
        AND usshti.ActionTypeID = ?
      GROUP BY
        MONTH(usshti.DateTime);
    `;
    db.query(SignInOutMonthlyReportQuery, [ClientID, ActionTypeID], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
},

getTimeManagementBreakDown: (ClientID, ActionTypeID, TimeManagementStatus, DateRangeStart, DateRangeEnd) => {
  return new Promise((resolve, reject) => {
    let dateRangeCondition = "";
    const startDate = DateRangeStart ? db.escape(DateRangeStart) : db.escape(new Date().toISOString().split('T')[0]);
    const endDate = DateRangeEnd ? db.escape(DateRangeEnd) : db.escape(new Date().toISOString().split('T')[0]);
    dateRangeCondition = `
        AND DATE(usshti.DateTime) >= ${startDate}
        AND DATE(usshti.DateTime) <= ${endDate}
    `;
    let timeManagementBreakDownQuery;
    if (DateRangeStart && DateRangeEnd) {
      timeManagementBreakDownQuery = `
        SELECT
          us.UserID,
          CONCAT(FirstName, ' ', LastName) AS FullName,
          DATE_FORMAT(usshti.DateTime,'%d/%m/%Y (%H:%i)') AS SignedInOut
        FROM
          user_shift_times usshti
        LEFT JOIN user us ON usshti.UserID = us.UserID
        WHERE us.ClientID = ${db.escape(ClientID)}
            AND usshti.ActionTypeID = ${db.escape(ActionTypeID)} 
            ${dateRangeCondition}
      `;
    } else {
      timeManagementBreakDownQuery = `
        SELECT
          us.UserID,
          CONCAT(FirstName, ' ', LastName) AS FullName,
          IFNULL(
            DATE_FORMAT(
              (SELECT DateTime FROM user_shift_times usshti 
              WHERE usshti.UserID = us.UserID AND usshti.ActionTypeID = ${db.escape(ActionTypeID)} 
                  ${dateRangeCondition} 
              ORDER BY usshti.UserShiftTimeID DESC LIMIT 1),
              '%d/%m/%Y (%H:%i)'
            ),
            'Pending'
          ) AS SignedInOut,  
          CONCAT(IFNULL(us.WorkingShiftHours, 8), ' Hours') AS ExpectedShiftDurationHours,
          TIMEDIFF(
            (SELECT DateTime FROM user_shift_times usshti 
            WHERE usshti.UserID = us.UserID AND usshti.ActionTypeID = 2 
                ${dateRangeCondition}  
            ORDER BY usshti.UserShiftTimeID DESC LIMIT 1),
            (SELECT DateTime FROM user_shift_times usshti 
            WHERE usshti.UserID = us.UserID AND usshti.ActionTypeID = 1 
                ${dateRangeCondition}  
            ORDER BY usshti.UserShiftTimeID DESC LIMIT 1)
          ) AS ActualShiftDuration
        FROM
          user us
        WHERE
          us.ClientID = ${db.escape(ClientID)} AND us.Status = 'Active' AND
          (
            (${db.escape(TimeManagementStatus)} = 'Pending' AND 'Pending' = IFNULL(
                DATE_FORMAT(
                    (SELECT DateTime FROM user_shift_times usshti 
                    WHERE usshti.UserID = us.UserID AND usshti.ActionTypeID = ${db.escape(ActionTypeID)} 
                        ${dateRangeCondition}  
                    ORDER BY usshti.UserShiftTimeID DESC LIMIT 1),
                    '%d/%m/%Y (%H:%i)'
                ),
                'Pending'
            )) OR
            (${db.escape(TimeManagementStatus)} = 'OnTime' AND 'OnTime' <> IFNULL(
                DATE_FORMAT(
                    (SELECT DateTime FROM user_shift_times usshti 
                    WHERE usshti.UserID = us.UserID AND usshti.ActionTypeID = ${db.escape(ActionTypeID)} 
                        ${dateRangeCondition}  
                    ORDER BY usshti.UserShiftTimeID DESC LIMIT 1),
                    '%d/%m/%Y (%H:%i)'
                ),
                'OnTime'
            ))
          );
      `;
    }
    db.query(timeManagementBreakDownQuery, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const response = result.map(item => ({
          UserID: item.UserID,
          FullName: item.FullName,
          SignedInOut: item.SignedInOut,
          ActualShiftDuration: item.ActualShiftDuration,
          ExpectedShiftDurationHours: item.ExpectedShiftDurationHours,
        }));
        resolve(response);
      }
    });
  });
},
  
};

export default TimeManagementService;