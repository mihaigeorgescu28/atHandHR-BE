import db from '../db.js';


const SiteMapService = {
  getNewsfeedData: (clientId, latestNewsId) => {
    return new Promise((resolve, reject) => {
      // SQL query to fetch latest news
      let getLatestNewsQuery = `
        SELECT 
          lane.LatestNewsID,
          lane.Title, 
          lane.Content,
          lane.Colour AS 'ColourCode',
          CASE WHEN lane.Colour = 'success' THEN 'Green'
          WHEN lane.Colour = 'danger' THEN 'Red'
          WHEN lane.Colour = 'info' THEN 'Blue'
          WHEN lane.Colour = 'warning' THEN 'Yellow'
          END AS Colour,
          ic.IconName,
          lane.ModifiedDate,
          CONCAT(us.FirstName, ' ', us.LastName) as 'LastModifiedUser'
        FROM 
          latest_news lane
        LEFT JOIN icons ic on ic.IconID = lane.IconID
        LEFT JOIN user us on us.UserID = lane.ModifiedUserID
        WHERE 
          lane.Status = 'Active'
          AND lane.ClientID = ?
      `;

      const queryParams = [clientId];

      // If latestNewsId is provided, add it to the query and parameters
      if (latestNewsId) {
        getLatestNewsQuery += 'AND lane.LatestNewsID = ?';
        queryParams.push(latestNewsId);
      }

      // Complete the SQL query
      getLatestNewsQuery += ' ORDER BY lane.LatestNewsID DESC;';

      // Execute SQL query
      db.query(getLatestNewsQuery, queryParams, (err, result) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          reject({ status: 500, response: 'Error executing SQL query' });
        } else {
          if (result.length > 0) {
            resolve({ status: 200, response: { success: true, result } }); // Include the fetched news data in the resolve
          } else {
            resolve({ status: 404, response: { success: false, result } }); // Return 404 if no news found
          }
        }
      });
    });
  },

  getIcons: () => {
    return new Promise((resolve, reject) => {
      // SQL query to icons
      const getLatestNewsQuery = `
      SELECT IconName FROM icons;
      `;

      // Execute SQL query
      db.query(getLatestNewsQuery, (err, result) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          reject({ status: 500, response: 'Error executing SQL query' });
        } else {
          if (result.length > 0) {
            resolve({ status: 200, response: { success: true, result } }); // Include the fetched news data in the resolve
          } else {
            resolve({ status: 404, response: { success: false, result } }); // Return 404 if no news found
          }
        }
      });
    });
  },


  insertNewsfeedRecord: (userId, clientId, newsfeedData) => {
    return new Promise((resolve, reject) => {
      // Query to get IconID from icons table based on IconName
      const selectIconIdQuery = 'SELECT IconID FROM icons WHERE IconName = ?';
      const { Title, Content, Colour, IconName } = newsfeedData;
  
      // Execute the query to get IconID
      db.query(selectIconIdQuery, [IconName], (err, iconResult) => {
        if (err) {
          console.error('Error executing select IconID query:', err);
          reject({ status: 500, response: 'Error selecting IconID' });
          return;
        }
  
        if (iconResult.length === 0) {
          // If no matching icon found, reject with error
          reject({ status: 404, response: 'Icon not found' });
          return;
        }
  
        // Extract IconID from the result
        const iconId = iconResult[0].IconID;
  
        // Insert into latest_news table with IconID, createddate, and modifieddate
        const insertPostQuery = 'INSERT INTO latest_news (ClientID, Title, Content, Colour, IconID, CreatedDate, ModifiedDate, CreatedUserID, ModifiedUserID) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)';
        const values = [clientId, Title, Content, Colour, iconId, userId, userId];
        
        // Execute the insertion query
        db.query(insertPostQuery, values, (err, result) => {
          if (err) {
            console.error('Error executing insert SQL query:', err);
            reject({ status: 500, response: 'Error inserting news record' });
          } else {
            resolve({ status: 200, response: { success: true, message: 'Record inserted successfully' } });
          }
        });
      });
    });
  },
  
  deleteNewsfeedRecord: (UserID, LatestNewsID) => {
    return new Promise((resolve, reject) => {
      const deletePostQuery = 'UPDATE latest_news SET ModifiedUserID = ?, ModifiedDate = NOW(), Status = "In-Active" WHERE LatestNewsID = ?';
        
      // Execute the deletion query
      db.query(deletePostQuery, [UserID, LatestNewsID], (err, result) => {
        if (err) {
          console.error('Error executing update SQL query:', err);
          reject({ status: 500, response: 'Error deleting post record' });
        } else {
          resolve({ status: 200, response: { success: true, message: 'Record deleted successfully' } });
        }
      });
    });
  },
  
  
  editNewsfeedRecord: (userId, latestNewsId, newsfeedData) => {
    return new Promise((resolve, reject) => {
      const { Title, Content, Colour, IconName } = newsfeedData;
      
      // Query to get IconID from icons table based on IconName
      const selectIconIdQuery = 'SELECT IconID FROM icons WHERE IconName = ?';
  
      // Execute the query to get IconID
      db.query(selectIconIdQuery, [IconName], (err, iconResult) => {
        if (err) {
          console.error('Error executing select IconID query:', err);
          reject({ status: 500, response: 'Error selecting IconID' });
          return;
        }
  
        if (iconResult.length === 0) {
          // If no matching icon found, reject with error
          reject({ status: 404, response: 'Icon not found' });
          return;
        }
  
        // Extract IconID from the result
        const iconId = iconResult[0].IconID;
  
        // Update latest_news table with IconID, Title, Content, and Colour based on LatestNewsID
        const updatePostQuery = 'UPDATE latest_news SET ModifiedDate = NOW(), ModifiedUserID = ?, Title = ?, Content = ?, Colour = ?, IconID = ? WHERE LatestNewsID = ?';
        const values = [userId, Title, Content, Colour, iconId, latestNewsId];
  
        // Execute the update query
        db.query(updatePostQuery, values, (err, result) => {
          if (err) {
            console.error('Error executing update SQL query:', err);
            reject({ status: 500, response: 'Error updating post record' });
          } else {
            resolve({ status: 200, response: { success: true, message: 'Record updated successfully' } });
          }
        });
      });
    });
  },
  
  getPositionData: (clientId, positionid) => {
    return new Promise((resolve, reject) => {
      // SQL query to fetch latest news
      let getPositionQuery = `
      SELECT 
      po.PositionID, 
      po.PositionName, 
      CONCAT(us.FirstName, ' ', us.LastName) as 'LastModifiedUser'
      FROM position po
      LEFT JOIN user us on us.UserID = po.ModifiedUserID
      WHERE po.ClientID = ?
      AND po.Status = 'Active'
      `;

      const queryParams = [clientId, positionid];

      // If latestNewsId is provided, add it to the query and parameters
      if (positionid) {
        getPositionQuery += 'AND po.PositionID = ?';
        queryParams.push(positionid);
      }

      // Complete the SQL query
      getPositionQuery += ' ORDER BY po.PositionID DESC;';

      // Execute SQL query
      db.query(getPositionQuery, queryParams, (err, result) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          reject({ status: 500, response: 'Error executing SQL query' });
        } else {
          if (result.length > 0) {
            resolve({ status: 200, response: { success: true, result } }); // Include the fetched news data in the resolve
          } else {
            resolve({ status: 404, response: { success: false, result } }); // Return 404 if no news found
          }
        }
      });
    });
  },

  editPositionRecord: (userId, positionId, positionData) => {
    return new Promise((resolve, reject) => {
      const { PositionName } = positionData;
      
        const updatePositionQuery = 'UPDATE position SET ModifiedDate = NOW(), ModifiedUserID = ?, PositionName = ? WHERE PositionID = ?';
        const values = [userId, PositionName, positionId];
  
        // Execute the update query
        db.query(updatePositionQuery, values, (err, result) => {
          if (err) {
            console.error('Error executing update SQL query:', err);
            reject({ status: 500, response: 'Error updating post record' });
          } else {
            resolve({ status: 200, response: { success: true, message: 'Record updated successfully' } });
          }
        });
      });
 
  },
  
  insertPositionRecord: (userId, clientId, positionData) => {
    return new Promise((resolve, reject) => {
        const { PositionName } = positionData;
        const insertPositionQuery = 'INSERT INTO `position` (ClientID, PositionName, CreatedDate, ModifiedDate, CreatedUserID, ModifiedUserID) VALUES (?, ?, NOW(), NOW(), ?, ?)';
        const values = [clientId, PositionName, userId, userId];
        
        // Execute the insertion query
        db.query(insertPositionQuery, values, (err, result) => {
          if (err) {
            console.error('Error executing insert SQL query:', err);
            reject({ status: 500, response: 'Error inserting news record' });
          } else {
            resolve({ status: 200, response: { success: true, message: 'Record inserted successfully' } });
          }
        });
      });
  },

  deletePositionRecord: (UserID, PositionID) => {
    return new Promise((resolve, reject) => {
      const deletePositionQuery = 'UPDATE `position` SET ModifiedUserID = ?, ModifiedDate = NOW(), Status = "In-Active" WHERE PositionID = ?';
        
      // Execute the deletion query
      db.query(deletePositionQuery, [UserID, PositionID], (err, result) => {
        if (err) {
          console.error('Error executing update SQL query:', err);
          reject({ status: 500, response: 'Error deleting post record' });
        } else {
          resolve({ status: 200, response: { success: true, message: 'Record deleted successfully' } });
        }
      });
    });
  },

  getClientLeaveTypeData: (clientId, clientLeaveTypeId) => {
    return new Promise((resolve, reject) => {
      // SQL query to fetch latest news
      let getLeaveTypeQuery = `
      SELECT cllety.ClientLeaveTypeID, lety.LeaveTypeID, lety.LeaveTypeName, lety.LeaveTypeGroupID, letygr.GroupName, cllety.RequiresApproval, CONCAT(us.FirstName, ' ', us.LastName) as 'LastModifiedUser' FROM leave_type lety
      LEFT JOIN leave_type_group letygr on letygr.LeaveTypeGroupID = lety.LeaveTypeGroupID
      LEFT JOIN client_leave_type cllety on cllety.LeaveTypeID = lety.LeaveTypeID
      LEFT JOIN user us on us.UserID = cllety.ModifiedUserID
      WHERE cllety.ClientID = ?
      `;

      const queryParams = [clientId, clientLeaveTypeId];

      // If latestNewsId is provided, add it to the query and parameters
      if (clientLeaveTypeId) {
        getLeaveTypeQuery += 'AND cllety.ClientLeaveTypeID = ?';
        queryParams.push(clientLeaveTypeId);
      }

      // Complete the SQL query
      getLeaveTypeQuery += ' ORDER BY cllety.ClientLeaveTypeID DESC;';

      // Execute SQL query
      db.query(getLeaveTypeQuery, queryParams, (err, result) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          reject({ status: 500, response: 'Error executing SQL query' });
        } else {
          if (result.length > 0) {
            resolve({ status: 200, response: { success: true, result } }); // Include the fetched news data in the resolve
          } else {
            resolve({ status: 404, response: { success: false, result } }); // Return 404 if no news found
          }
        }
      });
    });
  },

  editLeaveTypeRecord: (userId, clientLeaveTypeId, leaveTypeData) => {
    return new Promise((resolve, reject) => {
      const { RequiresApproval } = leaveTypeData;
        const updateLeaveTypeQuery = 'UPDATE client_leave_type SET ModifiedDate = NOW(), ModifiedUserID = ?, RequiresApproval = ? WHERE ClientLeaveTypeID = ?';
        const values = [userId, RequiresApproval, clientLeaveTypeId];
  
        // Execute the update query
        db.query(updateLeaveTypeQuery, values, (err, result) => {
          if (err) {
            console.error('Error executing update SQL query:', err);
            reject({ status: 500, response: 'Error updating post record' });
          } else {
            resolve({ status: 200, response: { success: true, message: 'Record updated successfully' } });
          }
        });
      });
 
  },
  
  insertLeaveTypeRecord: (clientLeaveTypeData) => {
    return new Promise((resolve, reject) => {
        const { ClientID, LeaveTypeID, RequiresApproval, UserID } = clientLeaveTypeData;
        const insertPositionQuery = 'INSERT INTO `client_leave_type` (ClientID, LeaveTypeID, RequiresApproval, CreatedDate, ModifiedDate, CreatedUserID, ModifiedUserID) VALUES (?, ?, ?, NOW(), NOW(), ?, ?)';
        const values = [ClientID, LeaveTypeID, RequiresApproval, UserID, UserID];
        
        // Execute the insertion query
        db.query(insertPositionQuery, values, (err, result) => {
          if (err) {
            console.error('Error executing insert SQL query:', err);
            reject({ status: 500, response: 'Error inserting news record' });
          } else {
            resolve({ status: 200, response: { success: true, message: 'Record inserted successfully' } });
          }
        });
      });
  },

  deleteLeaveTypeRecord: (ClientLeaveTypeID) => {
    return new Promise((resolve, reject) => {
      const deletePositionQuery = 'DELETE FROM `client_leave_type` WHERE ClientLeaveTypeID = ?';
    
      // Execute the deletion query
      db.query(deletePositionQuery, [ClientLeaveTypeID], (err, result) => {
        if (err) {
          console.error('Error executing update SQL query:', err);
          reject({ status: 500, response: 'Error deleting post record' });
        } else {
          resolve({ status: 200, response: { success: true, message: 'Record deleted successfully' } });
        }
      });
    });
  },

  getClientDefaultsData: (clientId) => {
    return new Promise((resolve, reject) => {
      let getClientDefaultsQuery = `
      SELECT cl.ClientName, cl.ContactEmail, cl.ContactPhone, cl.ContactName, cl.ContactPosition, cl.ClientAddress, cl.ClientPostCode, cl.WorkingWeekends, cl.HolidayEntitlementResetDay, cl.HolidayEntitlementResetMonth, cl.HolidayEntitlementDefaultDays, cl.HolidayEntitlementDefaultHours, 
      CONCAT(cl.InstallmentDueDate,  (CASE 
        WHEN cl.InstallmentDueDate % 100 IN (11, 12, 13) THEN 'th'
        WHEN cl.InstallmentDueDate % 10 = 1 THEN 'st'
        WHEN cl.InstallmentDueDate % 10 = 2 THEN 'nd'
        WHEN cl.InstallmentDueDate % 10 = 3 THEN 'rd'
        ELSE 'th'
        END), ' of the month') AS InstallmentDueDate, DATE_FORMAT(cl.JoinedDate, '%d/%m/%Y') as JoinedDate 
      FROM client cl
      WHERE cl.ClientID = ?
      LIMIT 1
      `;

      // Execute SQL query
      db.query(getClientDefaultsQuery, clientId, (err, result) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          reject({ status: 500, response: 'Error executing SQL query' });
        } else {
          if (result.length > 0) {
            resolve({ status: 200, response: { success: true, result } }); // Include the fetched news data in the resolve
          } else {
            resolve({ status: 404, response: { success: false, result } }); // Return 404 if no news found
          }
        }
      });
    });
  },
  
  submitClientDefaultsRecord: ( clientDefaultsData) => {
    return new Promise((resolve, reject) => {
      const {
        ClientName,
        ContactName,
        ContactPosition,
        ContactEmail,
        ContactPhone,
        ClientAddress,
        ClientPostCode,
        WorkingWeekends,
        HolidayEntitlementDefaultDays,
        HolidayEntitlementDefaultHours,
        HolidayEntitlementResetDay,
        HolidayEntitlementResetMonth,
        ClientID
      } = clientDefaultsData;
    
      const updateClientDefaultsQuery = `
        UPDATE client
        SET ClientName = ?,
            ContactName = ?,
            ContactPosition = ?,
            ContactEmail = ?,
            ContactPhone = ?,
            ClientAddress = ?,
            ClientPostCode = ?,
            WorkingWeekends = ?,
            HolidayEntitlementDefaultDays = ?,
            HolidayEntitlementDefaultHours = ?,
            HolidayEntitlementResetDay = ?,
            HolidayEntitlementResetMonth = ?
        WHERE ClientID = ?
      `;
    
      const values = [
        ClientName,
        ContactName,
        ContactPosition,
        ContactEmail,
        ContactPhone,
        ClientAddress,
        ClientPostCode,
        WorkingWeekends,
        HolidayEntitlementDefaultDays,
        HolidayEntitlementDefaultHours,
        HolidayEntitlementResetDay,
        HolidayEntitlementResetMonth,
        ClientID
      ];
    
      // Execute the update query
      db.query(updateClientDefaultsQuery, values, (err, result) => {
        if (err) {
          console.error('Error executing update SQL query:', err);
          reject({ status: 500, response: 'Error updating post record' });
        } else {
          resolve({ status: 200, response: { success: true, message: 'Record updated successfully' } });
        }
      });
    });    
  },

};

export default SiteMapService;
