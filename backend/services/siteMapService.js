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

  getDocumentGroupsData: (clientId, documentGroupID) => {
    return new Promise((resolve, reject) => {
      // SQL Query and parameters
      const queryParams = [clientId];
      let query = `
         SELECT dogr.DocumentGroupID, dogr.DocumentGroupName, dogr.DocumentGroupDescription,  CONCAT(us.FirstName, ' ', us.LastName) as CreatedBy,
          CONCAT(us1.FirstName, ' ', us1.LastName) as LastModifiedBy
        FROM document_group dogr
        LEFT JOIN user us on us.UserID = dogr.CreatedUserID
        LEFT JOIN user us1 on us1.UserID = dogr.ModifiedUserID
        WHERE dogr.ClientID = ?
        AND dogr.Status = 1
        GROUP BY dogr.DocumentGroupID`;
        
  
      if (documentGroupID) {
        query += ` AND dogr.DocumentGroupID = ?`;
        queryParams.push(documentGroupID);
      }
  
      query += ` ORDER BY dogr.DocumentGroupID DESC;`;
  
      // Execute Query
      db.query(query, queryParams, (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          reject({ status: 500, response: "Error executing SQL query" });
        } else {
          if (result.length === 0) {
            resolve({ status: 204, response: { success: true, result: [] } });
          } else {
            const processedResult = result.map((row) => ({
              ...row,
            }));
  
            resolve({ status: 200, response: { success: true, result: processedResult } });
          }
        }
      });
    });
  },  

  getCompanyDocumentsData: (clientId, companyDocumentId) => {
    return new Promise((resolve, reject) => {
      // SQL Query and parameters
      const queryParams = [clientId];
      let query = `
        SELECT 
          codo.CompanyDocumentID,
          codo.CompanyDocumentName,
          codo.CompanyDocumentDescription,
          codo.DocumentGroupID,
          dogr.DocumentGroupName,
          codo.AssignOn,
          codo.FileName,
          CONCAT(us.FirstName, ' ', us.LastName) as CreatedBy,
          CONCAT(us1.FirstName, ' ', us1.LastName) as LastModifiedBy,
          (
            SELECT GROUP_CONCAT(UserID) 
            FROM company_documents_user 
            WHERE CompanyDocumentID = codo.CompanyDocumentID AND Status = 1
          ) AS UsersID,
          (
            SELECT GROUP_CONCAT(CONCAT(user.FirstName, ' ', user.LastName)) 
            FROM company_documents_user 
            LEFT JOIN user ON user.UserID = company_documents_user.UserID 
            WHERE company_documents_user.CompanyDocumentID = codo.CompanyDocumentID AND company_documents_user.Status = 1
          ) AS UsersName,
          (
            SELECT GROUP_CONCAT(PositionID) 
            FROM company_documents_position 
            WHERE CompanyDocumentID = codo.CompanyDocumentID AND Status = 1
          ) AS PositionsID,
          (
            SELECT GROUP_CONCAT(position.PositionName) 
            FROM company_documents_position 
            LEFT JOIN position ON position.PositionID = company_documents_position.PositionID 
            WHERE company_documents_position.CompanyDocumentID = codo.CompanyDocumentID AND company_documents_position.Status = 1
          ) AS PositionsName
        FROM 
          company_documents codo
        LEFT JOIN document_group dogr ON dogr.DocumentGroupID = codo.DocumentGroupID
        LEFT JOIN user us ON us.UserID = codo.CreatedUserID
        LEFT JOIN user us1 ON us1.UserID = codo.ModifiedUserID
        WHERE 
          codo.Status = 1
          AND dogr.ClientID = ?`;
  
      if (companyDocumentId) {
        query += ` AND codo.CompanyDocumentID = ?`;
        queryParams.push(companyDocumentId);
      }
  
      query += ` ORDER BY codo.CompanyDocumentID DESC;`;
  
      // Execute Query
      db.query(query, queryParams, (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          reject({ status: 500, response: "Error executing SQL query" });
        } else {
          if (result.length === 0) {
            resolve({ status: 404, response: { success: false, result: [] } });
          } else {
            // Map each row to process UsersID and PositionsID as arrays
            const processedResult = result.map((row) => ({
              ...row,
              UsersID: row.UsersID ? row.UsersID.split(",") : [],
              UsersName: row.UsersName ? row.UsersName.split(",") : [],
              PositionsID: row.PositionsID ? row.PositionsID.split(",") : [],
              PositionsName: row.PositionsName ? row.PositionsName.split(",") : [],
            }));
  
  
            resolve({ status: 200, response: { success: true, result: processedResult } });
          }
        }
      });
    });
  },  

  getCompanyDocumentsDataStandardUser: (clientId, documentGroupId, userId) => {
    return new Promise((resolve, reject) => {
      // SQL Query and parameters
      const queryParams = [clientId, documentGroupId, userId, userId];
      const query = `
        SELECT 
          codo.CompanyDocumentID,
          codo.CompanyDocumentName,
          codo.CompanyDocumentDescription,
          codo.FileName
        FROM 
          company_documents codo
        LEFT JOIN 
          company_documents_user codous ON codous.CompanyDocumentID = codo.CompanyDocumentID
        LEFT JOIN 
          company_documents_position codopo ON codopo.CompanyDocumentID = codo.CompanyDocumentID
        WHERE 
          codo.Status = 1
          AND codo.ClientID = ?
          AND codo.DocumentGroupID = ?
          AND (CASE WHEN codo.AssignOn = 'Users' THEN codous.UserID = ?
                    WHEN codo.AssignOn = 'Positions' THEN codopo.PositionID IN (SELECT PositionID FROM user WHERE UserID = ?)
                    END 
              )
        GROUP BY codo.CompanyDocumentID
        ORDER BY codo.CompanyDocumentID DESC;
      `;
  
      // Execute Query
      db.query(query, queryParams, (err, results) => {
        if (err) {
          console.error("Error executing query:", err);
          return reject({ status: 500, response: "Error executing SQL query" });
        }
  
        if (!results || results.length === 0) {
          return resolve({ status: 404, response: { success: false, result: [] } });
        }
  
        // Process the results if needed
        const processedResults = results.map(row => ({
          CompanyDocumentID: row.CompanyDocumentID,
          CompanyDocumentName: row.CompanyDocumentName,
          CompanyDocumentDescription: row.CompanyDocumentDescription,
          FileName: row.FileName,
        }));
  
        resolve({ status: 200, response: { success: true, result: processedResults } });
      });
    });
  },  

  getGroupDocumentsDataStandardUser: (clientId, userId) => {
    return new Promise((resolve, reject) => {
      const selectQuery = `
        SELECT dogr.DocumentGroupID, dogr.DocumentGroupName 
        FROM document_group dogr
        LEFT JOIN company_documents codo ON codo.DocumentGroupID = dogr.DocumentGroupID
        WHERE dogr.ClientID = ?
        AND dogr.Status = 1
        AND codo.Status = 1
        AND (
          SELECT COUNT(*) 
          FROM company_documents codo1
          LEFT JOIN company_documents_user codous ON codous.CompanyDocumentID = codo1.CompanyDocumentID
          LEFT JOIN company_documents_position codopo ON codopo.CompanyDocumentID = codo1.CompanyDocumentID
          WHERE codo1.DocumentGroupID = dogr.DocumentGroupID
          AND (CASE 
                WHEN codo1.AssignOn = 'Users' THEN codous.UserID = ?
                WHEN codo1.AssignOn = 'Positions' THEN codopo.PositionID IN (SELECT PositionID FROM user WHERE UserID = ?)
               END)
          AND codo1.Status = 1
        ) > 0
        GROUP BY dogr.DocumentGroupID;
      `;
  
      const queryParams = [clientId, userId, userId];
  
      db.query(selectQuery, queryParams, (err, results) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          resolve({ status: 500, response: { error: 'Database query failed' } });
        } else if (results.length > 0) {
          const documentGroups = results.map(result => ({
            value: result.DocumentGroupID,
            label: result.DocumentGroupName,
          }));
          resolve({ status: 200, response: { DocumentGroups: documentGroups } });
        } else {
          resolve({ status: 404, response: { error: 'Document Group not found' } });
        }
      });
    });
  },
  

  getDocumentGroups: (clientId) => {
    return new Promise((resolve, reject) => {
      // SQL query to fetch document groups
      let selectQuery = `
        SELECT dogr.DocumentGroupID, dogr.DocumentGroupName
        FROM document_group dogr
        WHERE dogr.ClientID = ?
        AND dogr.Status = 1
      `;

      const queryParams = [clientId];
      // Execute the query
      db.query(selectQuery, queryParams, (err, results) => {
        if (err) {
          console.error('Error executing SQL query:', err);
          reject(err);
        } else {
          if (results.length > 0) {
            const documentGroups = results.map(result => ({
              value: result.DocumentGroupID,
              label: result.DocumentGroupName,
            }));
            resolve({ DocumentGroups: documentGroups });
          } else {
            resolve({ error: 'Document Group not found' });
          }
        }
      });
    });
  },

  insertDocumentRecord: (documentData) => {
    return new Promise((resolve, reject) => {
      const {
        ClientID,
        UserID,
        CompanyDocumentName,
        CompanyDocumentDescription,
        AssignOn,
        UsersID,
        PositionsID,
        DocumentGroupID,
        DocumentFileName,
      } = documentData;
  
      db.beginTransaction((transactionError) => {
        if (transactionError) {
          console.error('Error starting transaction:', transactionError);
          return reject(transactionError);
        }
  
        const insertDocumentQuery = `
          INSERT INTO company_documents 
          (ClientID, CompanyDocumentName, CompanyDocumentDescription, DocumentGroupID, CreatedUserID, ModifiedUserID, AssignOn, FileName, Status, CreatedDate, ModifiedDate)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        `;
  
        const documentQueryParams = [
          ClientID,
          CompanyDocumentName,
          CompanyDocumentDescription,
          DocumentGroupID,
          UserID,
          UserID,
          AssignOn,
          DocumentFileName,
        ];
  
        db.query(insertDocumentQuery, documentQueryParams, (documentInsertError, documentResult) => {
          if (documentInsertError) {
            console.error('Error inserting into company_documents:', documentInsertError);
            db.rollback(() => reject(documentInsertError));
            return;
          }
  
          const companyDocumentID = documentResult.insertId;
  
          // Handle user assignments
          if (AssignOn === 'users' && Array.isArray(UsersID) && UsersID.length > 0) {
            const userInserts = UsersID.map((userID) => [
              companyDocumentID,
              userID,
              UserID,
              UserID,
              1,
              new Date(),
              new Date(),
            ]);
  
            const insertUserQuery = `
              INSERT INTO company_documents_user 
              (CompanyDocumentID, UserID, CreatedUserID, ModifiedUserID, Status, CreatedDate, ModifiedDate) 
              VALUES ?
            `;
  
            db.query(insertUserQuery, [userInserts], (userInsertError) => {
              if (userInsertError) {
                console.error('Error inserting into company_documents_user:', userInsertError);
                db.rollback(() => reject(userInsertError));
                return;
              }
  
              db.commit((commitError) => {
                if (commitError) {
                  db.rollback(() => reject(commitError));
                } else {
                  resolve({ success: true, CompanyDocumentID: companyDocumentID });
                }
              });
            });
  
          } else if (AssignOn === 'positions' && Array.isArray(PositionsID) && PositionsID.length > 0) {
            const positionInserts = PositionsID.map((positionID) => [
              companyDocumentID,
              positionID,
              UserID,
              UserID,
              1,
              new Date(),
              new Date(),
            ]);
  
            const insertPositionQuery = `
              INSERT INTO company_documents_position 
              (CompanyDocumentID, PositionID, CreatedUserID, ModifiedUserID, Status, CreatedDate, ModifiedDate) 
              VALUES ?
            `;
  
            db.query(insertPositionQuery, [positionInserts], (positionInsertError) => {
              if (positionInsertError) {
                console.error('Error inserting into company_documents_position:', positionInsertError);
                db.rollback(() => reject(positionInsertError));
                return;
              }
  
              db.commit((commitError) => {
                if (commitError) {
                  db.rollback(() => reject(commitError));
                } else {
                  resolve({ success: true, CompanyDocumentID: companyDocumentID });
                }
              });
            });
  
          } else {
            db.commit((commitError) => {
              if (commitError) {
                db.rollback(() => reject(commitError));
              } else {
                resolve({ success: true, CompanyDocumentID: companyDocumentID });
              }
            });
          }
        });
      });
    });
  },  



  deleteDocumentRecord: (UserID, ClientID, CompanyDocumentID) => {
    return new Promise((resolve, reject) => {
      const deleteCompanyDocumentQuery = 'UPDATE company_documents SET ModifiedUserID = ?, ModifiedDate = NOW(), Status = 0 WHERE ClientID = ? AND CompanyDocumentID = ?';
        
      // Execute the deletion query
      db.query(deleteCompanyDocumentQuery, [UserID, ClientID, CompanyDocumentID], (err, result) => {
        if (err) {
          console.error('Error executing update SQL query:', err);
          reject({ status: 500, response: 'Error deleting company document record' });
        } else {
          resolve({ status: 200, response: { success: true, message: 'Record deleted successfully' } });
        }
      });
    });
  },

  deleteDocumentGroupRecord: (UserID, ClientID, DocumentGroupID) => {
    return new Promise((resolve, reject) => {
      const deleteCompanyDocumentGroupQuery = 'UPDATE document_group SET ModifiedUserID = ?, ModifiedDate = NOW(), Status = 0 WHERE ClientID = ? AND DocumentGroupID = ?';
        
      // Execute the deletion query
      db.query(deleteCompanyDocumentGroupQuery, [UserID, ClientID, DocumentGroupID], (err, result) => {
        if (err) {
          console.error('Error executing update SQL query:', err);
          reject({ status: 500, response: 'Error deleting document group record' });
        } else {
          resolve({ status: 200, response: { success: true, message: 'Record deleted successfully' } });
        }
      });
    });
  },

  
  editCompanyDocumentRecord: (userId, companyDocumentId, companyDocumentData) => {
    return new Promise((resolve, reject) => {
      const {
        CompanyDocumentName,
        CompanyDocumentDescription,
        DocumentGroupID,
        DocumentFileName, // New file name if uploaded
        AssignOn,
        UsersID,
        PositionsID,
      } = companyDocumentData;
  
      const parsedUsersID = typeof UsersID === "string" ? JSON.parse(UsersID) : UsersID;
      const parsedPositionsID = typeof PositionsID === "string" ? JSON.parse(PositionsID) : PositionsID;
  
      db.beginTransaction((transactionErr) => {
        if (transactionErr) {
          console.error("Error starting transaction:", transactionErr);
          return reject({ status: 500, response: "Error starting transaction" });
        }
  
        // Conditional FileName Update
        const updatePostQuery = `
          UPDATE company_documents 
          SET ModifiedDate = NOW(), 
              ModifiedUserID = ?, 
              CompanyDocumentName = ?, 
              CompanyDocumentDescription = ?, 
              DocumentGroupID = ?, 
              AssignOn = ?
              ${DocumentFileName ? ', FileName = ?' : ''} 
          WHERE CompanyDocumentID = ?`;
  
        const updateValues = [
          userId,
          CompanyDocumentName,
          CompanyDocumentDescription,
          DocumentGroupID,
          AssignOn || null,
        ];
  
        if (DocumentFileName) {
          updateValues.push(DocumentFileName);
        }
  
        updateValues.push(companyDocumentId);
  
        db.query(updatePostQuery, updateValues, (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating company_documents:", updateErr);
            return db.rollback(() =>
              reject({ status: 500, response: "Error updating record" })
            );
          }
  
          // Handle Users or Positions based on AssignOn
          if (AssignOn === "users") {
            const deactivateUsersQuery = `UPDATE company_documents_user SET status = 0 WHERE CompanyDocumentID = ?`;
  
            db.query(deactivateUsersQuery, [companyDocumentId], (deactivateUsersErr) => {
              if (deactivateUsersErr) {
                console.error("Error deactivating users:", deactivateUsersErr);
                return db.rollback(() =>
                  reject({ status: 500, response: "Error deactivating users" })
                );
              }
  
              if (parsedUsersID && parsedUsersID.length > 0) {
                const insertUsersQuery = `
                  INSERT INTO company_documents_user (CompanyDocumentID, UserID, Status, CreatedUserID, ModifiedUserID, CreatedDate, ModifiedDate) 
                  VALUES ?`;
  
                const usersValues = parsedUsersID.map((userId) => [
                  companyDocumentId,
                  userId,
                  1,
                  userId,
                  userId,
                  new Date(),
                  new Date(),
                ]);
  
                db.query(insertUsersQuery, [usersValues], (insertUsersErr) => {
                  if (insertUsersErr) {
                    console.error("Error inserting users:", insertUsersErr);
                    return db.rollback(() =>
                      reject({ status: 500, response: "Error inserting users" })
                    );
                  }
  
                  db.commit((commitErr) => {
                    if (commitErr) {
                      console.error("Error committing transaction:", commitErr);
                      return db.rollback(() =>
                        reject({ status: 500, response: "Error committing transaction" })
                      );
                    }
  
                    resolve({
                      status: 200,
                      response: { success: true, message: "Record updated successfully" },
                    });
                  });
                });
              } else {
                db.commit((commitErr) => {
                  if (commitErr) {
                    console.error("Error committing transaction:", commitErr);
                    return db.rollback(() =>
                      reject({ status: 500, response: "Error committing transaction" })
                    );
                  }
  
                  resolve({
                    status: 200,
                    response: { success: true, message: "Record updated successfully" },
                  });
                });
              }
            });
          }
        });
      });
    });
  },
  
  editDocumentGroupRecord: (userId, documentGroupId, documentGroupData) => {
    return new Promise((resolve, reject) => {
      if (!userId || !documentGroupId) {
        console.error('❌ Missing userId or documentGroupId:', { userId, documentGroupId });
        return reject({ status: 400, response: "userId and documentGroupId are required" });
      }
  
      const {
        DocumentGroupName,
        DocumentGroupDescription,
      } = documentGroupData;
  
      // Start transaction
      db.beginTransaction((transactionErr) => {
        if (transactionErr) {
          console.error("❌ Error starting transaction:", transactionErr);
          return reject({ status: 500, response: "Error starting transaction" });
        }
  
        const updatePostQuery = `
          UPDATE document_group 
          SET ModifiedDate = NOW(), 
              ModifiedUserID = ?, 
              DocumentGroupName = ?, 
              DocumentGroupDescription = ?
          WHERE DocumentGroupID = ?
        `;
  
        const updateValues = [
          userId,
          DocumentGroupName,
          DocumentGroupDescription,
          documentGroupId
        ];
  
        console.log('🔄 SQL Query:', updatePostQuery);
        console.log('🔄 Query Values:', updateValues);
  
        db.query(updatePostQuery, updateValues, (updateErr, updateResult) => {
          if (updateErr) {
            console.error("❌ Error updating document_group:", updateErr);
            return db.rollback(() =>
              reject({ status: 500, response: "Error updating record" })
            );
          }
  
          if (updateResult.affectedRows === 0) {
            console.warn("⚠️ No rows updated. Check DocumentGroupID:", documentGroupId);
            return db.rollback(() =>
              reject({ status: 404, response: "No document group found with the given ID" })
            );
          }
  
          db.commit((commitErr) => {
            if (commitErr) {
              console.error("❌ Error committing transaction:", commitErr);
              return db.rollback(() =>
                reject({ status: 500, response: "Error committing transaction" })
              );
            }
  
            console.log("✅ Document group successfully updated");
            resolve({ status: 200, response: "Document group updated successfully" });
          });
        });
      });
    });
  },  
  

  insertDocumentGroupRecord: (documentData) => {
    return new Promise((resolve, reject) => {
      const { 
        ClientID, 
        UserID, 
        DocumentGroupName, 
        DocumentGroupDescription 
      } = documentData;
  
      // Start a database transaction
      db.beginTransaction((transactionError) => {
        if (transactionError) {
          console.error('❌ Error starting transaction:', transactionError);
          return reject({ success: false, message: 'Transaction failed', error: transactionError });
        }
  
        // Insert into document_group table
        const insertDocumentGroupQuery = `
          INSERT INTO document_group 
          (ClientID, DocumentGroupName, DocumentGroupDescription, CreatedUserID, ModifiedUserID, Status, CreatedDate, ModifiedDate)
          VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
        `;
  
        const documentGroupQueryParams = [
          ClientID, 
          DocumentGroupName, 
          DocumentGroupDescription,
          UserID, 
          UserID
        ];
  
        db.query(insertDocumentGroupQuery, documentGroupQueryParams, (documentGroupInsertError, documentGroupResult) => {
          if (documentGroupInsertError) {
            console.error('❌ Error inserting into document_group:', documentGroupInsertError);
            return db.rollback(() => reject({ success: false, message: 'Insert failed', error: documentGroupInsertError }));
          }
  
          // Retrieve the inserted ID
          const insertedDocumentGroupID = documentGroupResult.insertId;
  
          // Commit transaction
          db.commit((commitError) => {
            if (commitError) {
              console.error('❌ Error committing transaction:', commitError);
              return db.rollback(() => reject({ success: false, message: 'Transaction commit failed', error: commitError }));
            }
  
            console.log('✅ Document group record inserted successfully:', insertedDocumentGroupID);
            resolve({ success: true, DocumentGroupID: insertedDocumentGroupID });
          });
        });
      });
    });
  },
  
  

};

export default SiteMapService;
