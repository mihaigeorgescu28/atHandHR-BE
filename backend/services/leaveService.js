// leaveService.js
import db from '../db.js';

const LeaveService = {
  getHolidayTypes: (UserID) => {
    return new Promise((resolve, reject) => {
        const currentClientIDQuery = "SELECT ClientID FROM user WHERE UserID = ? LIMIT 1";
        const holidayTypesSQL = "SELECT lt.LeaveTypeID, lt.LeaveTypeName FROM leave_type lt LEFT JOIN client_leave_type clt on lt.LeaveTypeID = clt.LeaveTypeID WHERE ClientID = ?";
        
        db.query(currentClientIDQuery, UserID, (err, result) => {
            if (err) {
                reject({ message: "Error", error: err });
            } else {
                if (result.length === 0) {
                    resolve({ value: 0, label: "User not assigned to any client" });
                } else {
                    const clientID = result[0].ClientID;

                    db.query(holidayTypesSQL, clientID, (err, result) => {
                        if (err) {
                            reject({ message: "Error", error: err });
                        } else {
                            if (result.length === 0) {
                                resolve({ value: 0, label: "No holiday types available" });
                            } else {
                                const holidayTypes = result.map(item => ({ value: item.LeaveTypeID, name: item.LeaveTypeName }));
                                resolve(holidayTypes);
                            }
                        }
                    });
                }
            }
        });
    });
},

getGlobalLeaveTypes: (UserID) => {
    return new Promise((resolve, reject) => {
        const currentClientIDQuery = "SELECT ClientID FROM user WHERE UserID = ? LIMIT 1";
        const holidayTypesSQL = "SELECT lt.LeaveTypeID, lt.LeaveTypeName FROM leave_type lt WHERE lt.LeaveTypeID NOT IN (SELECT LeaveTypeID FROM client_leave_type WHERE ClientID = ?)";
        
        db.query(currentClientIDQuery, UserID, (err, result) => {
            if (err) {
                reject({ message: "Error", error: err });
            } else {
                if (result.length === 0) {
                    resolve({ value: 0, label: "User not assigned to any client" });
                } else {
                    const clientID = result[0].ClientID;

                    db.query(holidayTypesSQL, clientID, (err, result) => {
                        if (err) {
                            reject({ message: "Error", error: err });
                        } else {
                            if (result.length === 0) {
                                resolve({ value: 0, label: "No holiday types available" });
                            } else {
                                const holidayTypes = result.map(item => ({ value: item.LeaveTypeID, name: item.LeaveTypeName }));
                                resolve(holidayTypes);
                            }
                        }
                    });
                }
            }
        });
    });
},
getUserHolidayInfo: (UserID) => {
  return new Promise((resolve, reject) => {
    const userHolidayInfoQuery = `
      SELECT 
        WorkingShiftHours, 
        ( ( WorkingShiftHours * (HolidayEntitelementLeftDays - IFNULL((SELECT SUM(WorkingDays) FROM leave_request WHERE UserID = user.UserID AND StatusID = 1), 0)) ) 
        + (HolidayEntitelementLeftHours - IFNULL((SELECT SUM(WorkingHours) FROM leave_request WHERE UserID = user.UserID AND StatusID = 1), 0)) ) DIV WorkingShiftHours AS HolidayEntitelementLeftDays,
        CAST(( ( WorkingShiftHours * (HolidayEntitelementLeftDays - IFNULL((SELECT SUM(WorkingDays) FROM leave_request WHERE UserID = user.UserID AND StatusID = 1), 0)) ) 
        + (HolidayEntitelementLeftHours - IFNULL((SELECT SUM(WorkingHours) FROM leave_request WHERE UserID = user.UserID AND StatusID = 1), 0)) ) % WorkingShiftHours AS SIGNED) AS HolidayEntitelementLeftHours, 
        client.WorkingWeekends 
      FROM user 
      LEFT JOIN client ON user.ClientID = client.ClientID 
      WHERE user.UserID = ?
    `;

    db.query(userHolidayInfoQuery, UserID, (err, result) => {
      if (err) {
        reject({ message: "Error", error: err });
      } else {
        if (result.length === 0) {
          resolve({ message: "Error", Action: 'No User Found' });
        } else {
          resolve({
            message: "Success",
            WorkingShiftHours: result[0].WorkingShiftHours,
            HolidayEntitelementLeftDays:  parseInt(result[0].HolidayEntitelementLeftDays, 10),
            HolidayEntitelementLeftHours: parseInt(result[0].HolidayEntitelementLeftHours, 10),
            WorkingWeekends: result[0].WorkingWeekends
          });
        }
      }
    });
  });
},


submitLeave: (leaveData) => {
    return new Promise((resolve, reject) => {
        // Step 1: Fetch RequiresApproval value
        const getRequiresApprovalQuery = `
            SELECT RequiresApproval FROM client_leave_type 
            WHERE ClientID = (SELECT ClientID FROM user WHERE UserID = ? LIMIT 1) 
            AND LeaveTypeID = ?
            LIMIT 1`;

        const getRequiresApprovalValues = [leaveData.UserID, leaveData.LeaveTypeID];

        db.query(getRequiresApprovalQuery, getRequiresApprovalValues, (err, results) => {
            if (err) {
                return reject(err);
            }

            const requiresApproval = results[0]?.RequiresApproval;

            if (requiresApproval === undefined) {
                return reject(new Error('Failed to fetch RequiresApproval value'));
            }

            // Step 2: Determine StatusID based on RequiresApproval
            const statusID = requiresApproval ? 1 : 2;

            // Step 3: Insert leave request
            const insertLeaveRequestQuery = `
                INSERT INTO leave_request 
                (UserID, LeaveTypeID, StatusID, StartDateTime, EndDateTime, WorkingDays, WorkingHours, Notes) 
                VALUES (?)`;

            const values = [
                leaveData.UserID,
                leaveData.LeaveTypeID,
                statusID,
                leaveData.StartDateTime,
                leaveData.EndDateTime,
                leaveData.WorkingDays,
                leaveData.WorkingHours,
                leaveData.Notes
            ];

            db.query(insertLeaveRequestQuery, [values], (err, result) => {
                if (err) {
                    return reject(err);
                }

                const leaveRequestId = result.insertId; // Get the newly inserted LeaveRequestID

                // Step 4: Insert audit log
                const insertAuditQuery = `
                    INSERT INTO leave_request_status_history 
                    (LeaveRequestID, StatusID, ActionedByUserID, ActionedDate) 
                    VALUES (?, ?, ?, NOW())`;

                const userId = leaveData.UserID; // Get the current user ID for auditing
                const auditValues = [leaveRequestId, statusID, userId];

                db.query(insertAuditQuery, auditValues, (auditErr, auditResult) => {
                    if (auditErr) {
                        return reject(auditErr);
                    }

                    resolve({ success: true, leaveRequestId: leaveRequestId });
                });
            });
        });
    });
},



getLeaveRequests: (ClientID) => {
  return new Promise((resolve, reject) => {
      const allLeaveRequestsQuery = `
      (SELECT b.LeaveTypeName, a.StartDateTime, a.EndDateTime, c.FirstName, d.StatusName
        FROM leave_request a 
        LEFT JOIN leave_type b on a.LeaveTypeID = b.LeaveTypeID 
        LEFT JOIN user c on c.UserID = a.UserID
        LEFT JOIN status d on d.StatusID = a.StatusID
        WHERE c.ClientID = ?)
        UNION 
        (SELECT 'Bank Holiday', d.Date, d.Date, 'N/A', 'N/A' FROM bank_holiday d)`;

      db.query(allLeaveRequestsQuery, [ClientID], (err, result) => {
          if (err) {
              reject(err);
          } else {
              const leaveRequests = result.map((item) => ({
                  title: item.LeaveTypeName + (item.FirstName !== 'N/A' ? (" - " + item.FirstName) : ''),
                  allDay: true,
                  start: new Date(item.StartDateTime),
                  end: new Date(item.EndDateTime),
                  status: item.StatusName
              }));
              resolve(leaveRequests);
          }
      });
  });
},

getLeaveRequestStatusBreakdown: (ClientID, LeaveTypeGroupID, LeaveStatusID, LeaveTypeID) => {
  return new Promise((resolve, reject) => {
      const conditions = [];
      const values = [ClientID];

      if (LeaveTypeGroupID !== '') {
          conditions.push('lety.LeaveTypeGroupID = ?');
          values.push(LeaveTypeGroupID);
      }

      if (LeaveTypeID !== '') {
          conditions.push('lr.LeaveTypeID = ?');
          values.push(LeaveTypeID);
      }

      const conditionString = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

      const leaveRequestStatusBreakdownQuery = `
      SELECT lr.LeaveRequestID, u.UserID,
          CONCAT(u.FirstName, ' ', u.LastName) as 'FullName',
          CONCAT(
              WorkingDays,
              IF(WorkingDays > 1 OR WorkingDays = 0, ' days, ', ' day, '),
              WorkingHours,
              IF(WorkingHours > 1 OR WorkingHours = 0, ' hours', ' hour')
          ) as LeaveDuration,
          CONCAT(
            lr.EntitlementDaysBeforeApproval,
            IF(lr.EntitlementDaysBeforeApproval > 1 OR lr.EntitlementDaysBeforeApproval = 0, ' days, ', ' day, '),
            lr.EntitlementHoursBeforeApproval,
            IF(lr.EntitlementHoursBeforeApproval > 1 OR lr.EntitlementHoursBeforeApproval = 0, ' hours', ' hour')
        ) as HolidayEntitlementBeforeApproval,
          CONCAT(
              lr.EntitlementDaysAfterApproval,
              IF(lr.EntitlementDaysAfterApproval > 1 OR lr.EntitlementDaysAfterApproval = 0, ' days, ', ' day, '),
              lr.EntitlementHoursAfterApproval,
              IF(lr.EntitlementHoursAfterApproval > 1 OR lr.EntitlementHoursAfterApproval = 0, ' hours', ' hour')
          ) as HolidayEntitlement,
          DATE_FORMAT(lr.StartDateTime, '%d/%m/%Y') as StartDateTime,
          DATE_FORMAT(lr.EndDateTime, '%d/%m/%Y') as EndDateTime,
          lety.LeaveTypeName,
          st.StatusName,
          st.ClosedStatus,
		 DATE_FORMAT(leresthi.ActionedDate, '%d/%m/%Y (%H:%i)') as ActionedDate,
         CONCAT(us1.FirstName, ' ', us1.LastName) as 'ActionedByUser'
          FROM leave_request lr
          LEFT JOIN user u ON u.UserID = lr.UserID
          LEFT JOIN leave_type lety on lety.LeaveTypeID = lr.LeaveTypeID
          LEFT JOIN status st on st.StatusID = lr.StatusID
          LEFT JOIN leave_request_status_history leresthi on lr.LeaveRequestID = leresthi.LeaveRequestID 
          LEFT JOIN user us1 on us1.UserID = leresthi.ActionedByUserID
          WHERE u.ClientID = ?
          ${conditionString}
          AND lr.StatusID = ?
          GROUP BY lr.LeaveRequestID;
      `;

      values.push(LeaveStatusID);

      db.query(leaveRequestStatusBreakdownQuery, values, (err, result) => {
          if (err) {
              reject(err);
          } else {
              const breakdown = result.map((item) => ({
                  LeaveRequestID: item.LeaveRequestID,
                  UserID: item.UserID,
                  FullName: item.FullName,
                  LeaveDuration: item.LeaveDuration,
                  HolidayEntitlementBeforeApproval: item.HolidayEntitlementBeforeApproval,
                  HolidayEntitlement: item.HolidayEntitlement,
                  StartDateTime: item.StartDateTime,
                  EndDateTime: item.EndDateTime,
                  LeaveTypeName: item.LeaveTypeName,
                  StatusName: item.StatusName,
                  ClosedStatus: item.ClosedStatus,
                  ActionedByUser: item.ActionedByUser,
                  ActionedDate: item.ActionedDate,

              }));
              resolve(breakdown);
          }
      });
  });
},

getStaffOnLeave: (ClientID, DateRange) => {
  return new Promise((resolve, reject) => {
      const values = [ClientID, DateRange];

      const totalStaffOfClientQuery = `
          SELECT u.UserID,
          CONCAT(FirstName, ' ', LastName) as 'FullName',
          CONCAT(
              WorkingDays,
              IF(WorkingDays > 1 OR WorkingDays = 0, ' days, ', ' day, '),
              WorkingHours,
              IF(WorkingHours > 1 OR WorkingHours = 0, ' hours', ' hour')
          ) as LeaveDuration,
          CONCAT(
              HolidayEntitelementLeftDays,
              IF(HolidayEntitelementLeftDays > 1 OR HolidayEntitelementLeftDays = 0, ' days, ', ' day, '),
              HolidayEntitelementLeftDays,
              IF(HolidayEntitelementLeftHours > 1 OR HolidayEntitelementLeftHours = 0, ' hours', ' hour')
          ) as HolidayEntitlement,
          DATE_FORMAT(lr.StartDateTime, '%d/%m/%Y') as StartDateTime,
          DATE_FORMAT(lr.EndDateTime, '%d/%m/%Y') as EndDateTime,
          lety.LeaveTypeName,
          st.StatusName
          FROM leave_request lr
          LEFT JOIN user u ON u.UserID = lr.UserID
          LEFT JOIN leave_type lety on lety.LeaveTypeID = lr.LeaveTypeID
          LEFT JOIN status st on st.StatusID = lr.StatusID
          WHERE DATE(lr.EndDateTime) >= CURDATE()
          AND u.ClientID = ?
          AND DATE(lr.StartDateTime) <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
          ORDER BY lr.StartDateTime ASC`;

      db.query(totalStaffOfClientQuery, values, (err, result) => {
          if (err) {
              reject(err);
          } else {
              const staffOnLeave = result.map(item => ({
                  UserID: item.UserID,
                  FullName: item.FullName,
                  LeaveDuration: item.LeaveDuration,
                  HolidayEntitlement: item.HolidayEntitlement,
                  StartDateTime: item.StartDateTime,
                  EndDateTime: item.EndDateTime,
                  LeaveTypeName: item.LeaveTypeName,
                  StatusName: item.StatusName
              }));
              resolve(staffOnLeave);
          }
      });
  });
},

getCurrentNumberOfLeaveRequestsByMonth: (ClientID) => {
  return new Promise((resolve, reject) => {
      const CurrentNumberOfLeaveRequestsByMonth = `
          SELECT 
          MONTH(a.CreatedDate) as 'Month Number',
          SUM(CASE WHEN a.LeaveTypeID = 1 THEN 1 ELSE 0 END) AS NumberOfHolidayRequests,
          SUM(CASE WHEN a.LeaveTypeID = 2 THEN 1 ELSE 0 END) AS NumberOfSickRequests,
          SUM(CASE WHEN a.LeaveTypeID NOT IN (1, 2) THEN 1 ELSE 0 END) AS NumberOfMiscellaneousRequests
          FROM leave_request a
          LEFT JOIN user b ON b.UserID = a.UserID
          WHERE b.ClientID = ?
          GROUP BY MONTH(a.CreatedDate)
      `;

      const values = [ClientID];

      db.query(CurrentNumberOfLeaveRequestsByMonth, values, (err, result) => {
          if (err) {
              reject(err);
          } else {
              const monthCounts = {};
              for (let i = 1; i <= 12; i++) {
                  monthCounts[i] = {
                      NumberOfHolidayRequests: 0,
                      NumberOfSickRequests: 0,
                      NumberOfMiscellaneousRequests: 0,
                  };
              }

              result.forEach((row) => {
                  const { 'Month Number': month, NumberOfHolidayRequests, NumberOfSickRequests, NumberOfMiscellaneousRequests } = row;
                  monthCounts[month] = {
                      NumberOfHolidayRequests,
                      NumberOfSickRequests,
                      NumberOfMiscellaneousRequests,
                  };
              });

              resolve(monthCounts);
          }
      });
  });
},

getCurrentNumberOfLeaveRequests: (ClientID) => {
  return new Promise((resolve, reject) => {
      const CurrentNumberOfLeaveRequests = `
          SELECT 
          COUNT(CASE WHEN LeaveTypeID = 1 THEN 1 END) AS NumberOfHolidayRequests,
          COUNT(CASE WHEN LeaveTypeID = 2 THEN 1 END) AS NumberOfSickRequests,
          COUNT(CASE WHEN LeaveTypeID NOT IN (1, 2) THEN 1 END) AS NumberOfMiscellaneousRequests
          FROM leave_request a
          LEFT JOIN user b ON b.UserID = a.UserID
          WHERE b.ClientID = ?;
      `;

      const values = [ClientID];

      db.query(CurrentNumberOfLeaveRequests, values, (err, result) => {
          if (err) {
              reject(err);
          } else {
              const { NumberOfHolidayRequests, NumberOfSickRequests, NumberOfMiscellaneousRequests } = result[0];
              const response = {
                  NumberOfHolidayRequests,
                  NumberOfSickRequests,
                  NumberOfMiscellaneousRequests
              };
              resolve(response);
          }
      });
  });
},

checkBankHoliday: (date) => {
  return new Promise((resolve, reject) => {
      const bankHolidayCheck = "SELECT Date FROM bank_holiday WHERE Date = ? LIMIT 1";
      // Convert to Date object
      const inputDate = new Date(date);

      // Get the components of the date in local time
      const year = inputDate.getFullYear();
      const month = (inputDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, pad with leading zero if needed
      const day = inputDate.getDate().toString().padStart(2, '0'); // Pad with leading zero if needed

      // Format the date as YYYY-MM-DD
      const sqlDate = `${year}-${month}-${day}`;

      db.query(bankHolidayCheck, [sqlDate], (err, result) => {
          if (err) {
              reject(err);
          } else {
              const bankHoliday = result.length === 0 ? "No" : "Yes";
              resolve({ BankHoliday: bankHoliday });
          }
      });
  });
},

checkSameDayExistingLeave: (date, userId) => {
    return new Promise((resolve, reject) => {

        // Convert to Date object
        const inputDate = new Date(date);

        // Get the components of the date in local time
        const year = inputDate.getFullYear();
        const month = (inputDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, pad with leading zero if needed
        const day = inputDate.getDate().toString().padStart(2, '0'); // Pad with leading zero if needed

        // Format the date as YYYY-MM-DD
        const sqlDate = `${year}-${month}-${day}`;


        const leaveRequestCheck = `
        SELECT lere.LeaveRequestID 
        FROM leave_request lere
        WHERE lere.UserID = ?
        AND ? BETWEEN DATE(lere.StartDateTime) AND DATE(lere.EndDateTime)
        `;


        db.query(leaveRequestCheck, [userId, sqlDate], (err, result) => {
            if (err) {
                reject(err);
            } else {
                const leaveRequestEnum = result.length === 0 ? "No" : "Yes";
                resolve({ SameDayRequest: leaveRequestEnum });
            }
        });
    });
  },


getBankHolidayInfo: (start, end, diffInMs) => {
    return new Promise((resolve, reject) => {
        const bankHolidayCheck = "SELECT COUNT(*) as NumberOfBankHolidays FROM bank_holiday WHERE Date BETWEEN ? AND ?";
        const startDate = new Date(start);
        const endDate = new Date(end);
  
        db.query(bankHolidayCheck, [startDate, endDate], (err, result) => {
            if (err) {
                reject(err);
            } else {
                const numberOfBankHolidays = result[0].NumberOfBankHolidays;
                const bankHolidayDuration = numberOfBankHolidays * 24 * 60 * 60 * 1000; // Assuming 1 bank holiday is 8 hours
                const updatedDiffInMs = diffInMs - bankHolidayDuration;
                resolve({ NumberOfBankHolidays: numberOfBankHolidays, updatedDiffInMs: updatedDiffInMs });
            }
        });
    });
  },
  
getCountStaffData: (clientID) => {
  return new Promise((resolve, reject) => {
      const sqlQuery = `
      SELECT
          (
          SELECT COUNT(*) 
          FROM user 
          WHERE ClientID = u.ClientID
          AND user.Status = 'Active'
          ) AS TotalStaff,
          (
          SELECT COUNT(*) 
          FROM leave_request lr
          LEFT JOIN user u ON u.UserID = lr.UserID
          WHERE DATE(lr.EndDateTime) >= CURDATE()
          AND u.ClientID = u.ClientID
          AND DATE(lr.StartDateTime) <= DATE_ADD(CURDATE(), INTERVAL 0 DAY)
          AND Status = 'Active'
          ) AS StaffOnLeave,
          (
          SELECT COUNT(*) 
          FROM leave_request lr
          LEFT JOIN user u ON u.UserID = lr.UserID
          WHERE DATE(lr.EndDateTime) >= CURDATE()
          AND lr.StartDateTime <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
          AND u.ClientID = u.ClientID
          AND Status = 'Active'
          ) AS StaffOnLeaveNext30Days
      FROM user u
      WHERE u.ClientID = ?`;
      
      db.query(sqlQuery, [clientID], (err, result) => {
          if (err) {
              reject(err);
          } else {
              resolve(result[0]);
          }
      });
  });
},

getLeaveRequestsStatus: (clientID, leaveTypeGroupID) => {
  return new Promise((resolve, reject) => {
      const LeaveRequestsGroupedByStatus = `
      SELECT s.StatusName, IFNULL(subquery.NoOfLeaveRequests, 0) AS NoOfLeaveRequests
      FROM status s
      LEFT JOIN (
          SELECT a.StatusID, COUNT(*) AS NoOfLeaveRequests
          FROM leave_request a
          LEFT JOIN leave_type b ON a.LeaveTypeID = b.LeaveTypeID
          LEFT JOIN user c ON c.UserID = a.UserID
          LEFT JOIN leave_type_group d on d.LeaveTypeGroupID = b.LeaveTypeGroupID
          WHERE YEAR(a.StartDateTime) = YEAR(NOW())
          AND c.ClientID = ?
          AND d.LeaveTypeGroupID = ?
          GROUP BY a.StatusID
      ) subquery ON s.StatusID = subquery.StatusID
      ORDER BY s.StatusID;
      `;

      const values = [clientID, leaveTypeGroupID];

      db.query(LeaveRequestsGroupedByStatus, values, (err, result) => {
          if (err) {
              reject(err);
          } else {
              const reorderedResponse = [
                  result.find(item => item.StatusName === "Declined").NoOfLeaveRequests,
                  result.find(item => item.StatusName === "Approved").NoOfLeaveRequests,
                  result.find(item => item.StatusName === "Requested").NoOfLeaveRequests,
              ];
              resolve(reorderedResponse);
          }
      });
  });
},

getLeaveRequestsType: (clientID, leaveTypeGroupID, statusID) => {
  return new Promise((resolve, reject) => {
      const LeaveRequestsGroupedByStatus = `
      SELECT ly.LeaveTypeName, IFNULL(subquery.NoOfLeaveTypeRequests, 0) AS NoOfLeaveTypeRequests
      FROM leave_type ly
      LEFT JOIN (
          SELECT a.LeaveTypeID, COUNT(*) AS NoOfLeaveTypeRequests
          FROM leave_request a
          LEFT JOIN leave_type b ON a.LeaveTypeID = b.LeaveTypeID
          LEFT JOIN user c ON c.UserID = a.UserID
          LEFT JOIN leave_type_group d on d.LeaveTypeGroupID = b.LeaveTypeGroupID
          WHERE YEAR(a.StartDateTime) = YEAR(NOW())
          AND c.ClientID = ?
          AND d.LeaveTypeGroupID = ?
          AND a.StatusID = ?
          GROUP BY a.LeaveTypeID
      ) subquery ON ly.LeaveTypeID = subquery.LeaveTypeID
      left join client_leave_type clt on clt.LeaveTypeID = ly.LeaveTypeID
      where clt.RequiresApproval = 1
      GROUP BY ly.LeaveTypeID
      ORDER BY ly.LeaveTypeID;
      `;

      const values = [clientID, leaveTypeGroupID, statusID];

      db.query(LeaveRequestsGroupedByStatus, values, (err, result) => {
          if (err) {
              reject(err);
          } else {
              const reorderedResponse = result.map(item => ({
                  LeaveTypeName: item.LeaveTypeName,
                  NoOfLeaveTypeRequests: item.NoOfLeaveTypeRequests,
              }));
              resolve(reorderedResponse);
          }
      });
  });
},

getLeaveRequestLastUpdated: (clientID, leaveTypeID) => {
  return new Promise((resolve, reject) => {
      const LeaveRequestsLastUpdated = `
      SELECT CASE
      WHEN TIMESTAMPDIFF(DAY, a.ModifiedDate, NOW()) < 1 THEN
          CONCAT(TIMESTAMPDIFF(HOUR, a.ModifiedDate, NOW()), ' hours')
      ELSE
          CONCAT(TIMESTAMPDIFF(DAY, a.ModifiedDate, NOW()), ' days')
      END AS 'LastUpdatedInDays'
      FROM leave_request a
      LEFT JOIN leave_type b on a.LeaveTypeID = b.LeaveTypeID
      LEFT JOIN user c on c.UserID = a.UserID
      LEFT JOIN status d on d.StatusID = a.StatusID
      WHERE YEAR(a.StartDateTime) = YEAR(NOW())
      AND c.ClientID = ?
      AND b.LeaveTypeID = ?
      ORDER BY a.ModifiedDate DESC
      LIMIT 1
      `;

      const values = [clientID, leaveTypeID];

      db.query(LeaveRequestsLastUpdated, values, (err, result) => {
          if (err) {
              reject(err);
          } else {
              const response = result.map(item => ({
                  LastUpdatedLeaveDate: item.LastUpdatedInDays
              }));
              resolve(response);
          }
      });
  });
},

actionLeaveRequestStatus: (statusId, leaveRequestId, userId) => {
    return new Promise((resolve, reject) => {
        const updateLeaveStatusQuery = `UPDATE leave_request SET StatusID = ?, EntitlementDaysAfterApproval = ?, EntitlementHoursAfterApproval = ?, EntitlementDaysBeforeApproval = ?, EntitlementHoursBeforeApproval = ? WHERE LeaveRequestID = ?`;
        const insertAuditQuery = `INSERT INTO leave_request_status_history 
        (LeaveRequestID, StatusID, ActionedByUserID, ActionedDate) 
        VALUES (?, ?, ?, NOW())`;

        // Query to calculate newDays and newHours
        const calculateNewValuesQuery = `SELECT 
            HolidayEntitelementLeftDays, 
            HolidayEntitelementLeftHours,
            (((WorkingShiftHours * HolidayEntitelementLeftDays) + HolidayEntitelementLeftHours) - ((WorkingShiftHours * lere.WorkingDays) + lere.WorkingHours)) DIV WorkingShiftHours AS newDays,
            (((WorkingShiftHours * HolidayEntitelementLeftDays) + HolidayEntitelementLeftHours) - ((WorkingShiftHours * lere.WorkingDays) + lere.WorkingHours)) % WorkingShiftHours AS newHours
            FROM leave_request lere
            LEFT JOIN user ON user.UserID = lere.UserID
            WHERE LeaveRequestID = ?
            LIMIT 1`;

        const updateValues = [statusId, null, null, null, null, leaveRequestId];
        const auditValues = [leaveRequestId, statusId, userId];

        db.query(calculateNewValuesQuery, [leaveRequestId], (calculateErr, calculateResult) => {
            if (calculateErr) {
                reject(calculateErr);
            } else {
                const newDays = calculateResult[0].newDays;
                const newHours = calculateResult[0].newHours;
                const oldDays = calculateResult[0].HolidayEntitelementLeftDays;
                const oldHours = calculateResult[0].HolidayEntitelementLeftHours;
                updateValues[1] = newDays;
                updateValues[2] = newHours;
                updateValues[3] = oldDays;
                updateValues[4] = oldHours;

                db.query(updateLeaveStatusQuery, updateValues, (updateErr, updateResult) => {
                    if (updateErr) {
                        reject(updateErr);
                    } else {
                        db.query(insertAuditQuery, auditValues, (auditErr, auditResult) => {
                            if (auditErr) {
                                reject(auditErr);
                            } else {
                                if (statusId === 2) {
                                    // If statusId is 2, update user entitlement after request was approved
                                    const updateUserQuery = `UPDATE user 
                                        SET HolidayEntitelementLeftDays = ?, 
                                            HolidayEntitelementLeftHours = ?
                                        WHERE UserID = (SELECT UserID FROM leave_request WHERE LeaveRequestID = ?)`;
                                    const updateUserValues = [newDays, newHours, leaveRequestId];

                                    db.query(updateUserQuery, updateUserValues, (userErr, userResult) => {
                                        if (userErr) {
                                            reject(userErr);
                                        } else {
                                            resolve({ Success: "true" });
                                        }
                                    });
                                } else {
                                    resolve({ Success: "true" });
                                }
                            }
                        });
                    }
                });
            }
        });
    });
},

checkAndResetHolidayEntitlement : () => {
        return new Promise((resolve, reject) => {
            const fetchHolidayResetDatesQuery = `
                SELECT ClientID,
                    STR_TO_DATE(
                        CONCAT(YEAR(CURDATE()), '-', LPAD(HolidayEntitlementResetMonth, 2, '0'), '-', LPAD(HolidayEntitlementResetDay, 2, '0')), 
                        '%Y-%m-%d'
                    ) AS HolidayEntitlementResetDate,
                    HolidayEntitlementResetDay,
                    HolidayEntitlementResetMonth
                FROM client
                WHERE HolidayEntitlementResetMonth IS NOT NULL
                AND HolidayEntitlementResetDay IS NOT NULL;
            `;
    
            // Fetch the holiday reset dates
            db.query(fetchHolidayResetDatesQuery, (fetchErr, results) => {
                if (fetchErr) {
                    reject(fetchErr);
                } else {
                    const currentDateString = new Date().toISOString().split('T')[0]; // Get current date in 'YYYY-MM-DD' format
     
                    const promises = results.map(result => {

                    const inputDate = new Date(result.HolidayEntitlementResetDate);

                    // Get the components of the date in local time
                    const year = inputDate.getFullYear();
                    const month = (inputDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed, pad with leading zero if needed
                    const day = inputDate.getDate().toString().padStart(2, '0'); // Pad with leading zero if needed
              
                    // Format the date as YYYY-MM-DD
                    const sqlDate = `${year}-${month}-${day}`;

                        if (sqlDate === currentDateString) {
                            console.log("Holiday Entitlement Reset Date matches today's date:", sqlDate);
                            const fetchActiveUsersQuery = `
                            SELECT UserID, client.HolidayEntitlementDefaultDays, client.HolidayEntitlementDefaultHours
                            FROM user 
                            LEFT JOIN client on user.ClientID = client.ClientID
                            WHERE user.ClientID = ?
                            AND user.Status = 'Active'
                            `;
                            return new Promise((resolve, reject) => {
                                db.query(fetchActiveUsersQuery, [result.ClientID], (userFetchErr, userResults) => {
                                    if (userFetchErr) {
                                        return reject(userFetchErr);
                                    }
                                    const updatePromises = userResults.map(user => {
                                        const updateUserQuery = `
                                            UPDATE user 
                                            SET HolidayEntitelementLeftDays = ?, 
                                                HolidayEntitelementLeftHours = ? 
                                            WHERE UserID = ?
                                        `;
                                        const updateValues = [user.HolidayEntitlementDefaultDays, user.HolidayEntitlementDefaultHours, user.UserID];
                                        return new Promise((resolve, reject) => {
                                            db.query(updateUserQuery, updateValues, (updateErr, updateResult) => {
                                                if (updateErr) {
                                                    return reject(updateErr);
                                                }
                                                resolve(updateResult);
                                            });
                                        });
                                    });
    
                                    Promise.all(updatePromises)
                                        .then(resolve)
                                        .catch(reject);
                                });
                            });
                        } else {
                            return Promise.resolve();
                        }
                    });
    
                    Promise.all(promises)
                        .then(() => resolve({ Success: "true" }))
                        .catch(reject);
                }
            });
        });
    },


};

export default LeaveService;
