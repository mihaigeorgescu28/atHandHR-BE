import express from "express";
import SiteMapService from '../services/siteMapService.js';
import authenticateToken from '../middleware/authenticateToken.js'; // Import the middleware
import { uploadCompanyDoc } from '../utils/utils.js';

const router = express.Router();


router.post('/NewsfeedData', authenticateToken, async (req, res) => {
  try {;
    const { ClientID, LatestNewsID } = req.body

    const newsfeedDataResult = await SiteMapService.getNewsfeedData(ClientID, LatestNewsID);

    res.status(newsfeedDataResult.status).json(newsfeedDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/Icons', authenticateToken, async (req, res) => {
  try {;

    const iconsResult = await SiteMapService.getIcons();

    res.status(iconsResult.status).json(iconsResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/InsertNewsfeedRecord', authenticateToken, async (req, res) => {
  try {
    const { UserID, ClientID } = req.body;
    const insertNewsfeedRecordResult = await SiteMapService.insertNewsfeedRecord(UserID, ClientID, req.body);

    res.status(insertNewsfeedRecordResult.status).json(insertNewsfeedRecordResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/DeleteNewsfeedRecord', authenticateToken, async (req, res) => {
  try {
    const { UserID, LatestNewsID } = req.body; // Assuming ClientID is sent from the form
    const deleteNewsfeedRecordResult = await SiteMapService.deleteNewsfeedRecord(UserID, LatestNewsID);

    res.status(deleteNewsfeedRecordResult.status).json(deleteNewsfeedRecordResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/EditNewsfeedRecord', authenticateToken, async (req, res) => {
  try {
    const { UserID, LatestNewsID } = req.body; // Assuming ClientID is sent from the form
    const editNewsfeedRecordResult = await SiteMapService.editNewsfeedRecord(UserID, LatestNewsID, req.body);

    res.status(editNewsfeedRecordResult.status).json(editNewsfeedRecordResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/EmployeePositionData', authenticateToken, async (req, res) => {
  try {;
    const { ClientID, PositionID } = req.body

    const positionDataResult = await SiteMapService.getPositionData(ClientID, PositionID);

    res.status(positionDataResult.status).json(positionDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/EditPositionRecord', authenticateToken, async (req, res) => {
  try {
    const { UserID, PositionID } = req.body;
    const editPositionResult = await SiteMapService.editPositionRecord(UserID, PositionID, req.body);

    res.status(editPositionResult.status).json(editPositionResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/InsertPositionRecord', authenticateToken, async (req, res) => {
  try {
    const { UserID, ClientID } = req.body;
    const insertPositionResult = await SiteMapService.insertPositionRecord(UserID, ClientID, req.body);

    res.status(insertPositionResult.status).json(insertPositionResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/DeletePositionRecord', authenticateToken, async (req, res) => {
  try {
    const { UserID, PositionID } = req.body; 
    const deletePositionResult = await SiteMapService.deletePositionRecord(UserID, PositionID);

    res.status(deletePositionResult.status).json(deletePositionResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/ClientLeaveTypeData', authenticateToken, async (req, res) => {
  try {;
    const { ClientID, ClientLeaveTypeID } = req.body

    const leaveTypeDataResult = await SiteMapService.getClientLeaveTypeData(ClientID, ClientLeaveTypeID);

    res.status(leaveTypeDataResult.status).json(leaveTypeDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});



router.post('/EditClientLeaveTypeRecord', authenticateToken, async (req, res) => {
  try {
    const { UserID, ClientLeaveTypeID } = req.body;
    const editLeaveTypeResult = await SiteMapService.editLeaveTypeRecord(UserID, ClientLeaveTypeID, req.body);

    res.status(editLeaveTypeResult.status).json(editLeaveTypeResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/InsertClientLeaveTypeRecord', authenticateToken, async (req, res) => {
  try {
    //const { ClientID, LeaveTypeID } = req.body;
    const insertLeaveTypeResult = await SiteMapService.insertLeaveTypeRecord(req.body);

    res.status(insertLeaveTypeResult.status).json(insertLeaveTypeResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/DeleteClientLeaveTypeRecord', authenticateToken, async (req, res) => {
  try {
    const { ClientLeaveTypeID } = req.body;
    const deleteLeaveTypeResult = await SiteMapService.deleteLeaveTypeRecord(ClientLeaveTypeID);

    res.status(deleteLeaveTypeResult.status).json(deleteLeaveTypeResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/ClientDefaultsData', authenticateToken, async (req, res) => {
  try {;
    const { ClientID } = req.body

    const clientDefaultsDataResult = await SiteMapService.getClientDefaultsData(ClientID);

    res.status(clientDefaultsDataResult.status).json(clientDefaultsDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/SubmitClientDefaultsRecord', authenticateToken, async (req, res) => {
  try {
    const submitClientDefaultsResult = await SiteMapService.submitClientDefaultsRecord(req.body);

    res.status(submitClientDefaultsResult.status).json(submitClientDefaultsResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/DocumentGroupsDataAdmin', authenticateToken, async (req, res) => {
  try {
    const { ClientID, DocumentGroupID } = req.body

    const documentGroupsDataResult = await SiteMapService.getDocumentGroupsData(ClientID, DocumentGroupID);
    res.status(documentGroupsDataResult.status).json(documentGroupsDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/CompanyDocumentsDataAdmin', authenticateToken, async (req, res) => {
  try {;
    const { ClientID, CompanyDocumentID } = req.body

    const companyDocumentsDataResult = await SiteMapService.getCompanyDocumentsData(ClientID, CompanyDocumentID);

    res.status(companyDocumentsDataResult.status).json(companyDocumentsDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/CompanyDocumentsDataStandard', authenticateToken, async (req, res) => {
  try {
    const { ClientID, DocumentGroupID, UserID } = req.body

    const companyDocumentsDataStandardResult = await SiteMapService.getCompanyDocumentsDataStandardUser(ClientID, DocumentGroupID, UserID);

    res.status(companyDocumentsDataStandardResult.status).json(companyDocumentsDataStandardResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/GroupDocumentsDataStandard', authenticateToken, async (req, res) => {
  try {
    const { ClientID, UserID } = req.body;

    if (!ClientID || !UserID) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const groupDocumentsDataStandardResult = await SiteMapService.getGroupDocumentsDataStandardUser(ClientID, UserID);

    res.status(groupDocumentsDataStandardResult.status).json(groupDocumentsDataStandardResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/DeleteDocumentGroup', authenticateToken, async (req, res) => {
  try {
    const { UserID, ClientID, DocumentGroupID } = req.body; // Assuming ClientID is sent from the form
    const deleteDocumentGroupRecordResult = await SiteMapService.deleteDocumentGroupRecord(UserID, ClientID, DocumentGroupID);

    res.status(deleteDocumentGroupRecordResult.status).json(deleteDocumentGroupRecordResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});



router.post('/DeleteDocumentRecord', authenticateToken, async (req, res) => {
  try {
    const { UserID, ClientID, CompanyDocumentID } = req.body; // Assuming ClientID is sent from the form
    const deleteDocumentRecordResult = await SiteMapService.deleteDocumentRecord(UserID, ClientID, CompanyDocumentID);

    res.status(deleteDocumentRecordResult.status).json(deleteDocumentRecordResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

export function extractClientID(req, res, next) {
  // Check headers and query for ClientID
  req.clientID = req.headers['clientid'] || req.query.ClientID || 'default_client';

  // Sanitize ClientID
  req.clientID = req.clientID.replace(/[^a-zA-Z0-9-_]/g, '_');
  console.log('🔑 Middleware Extracted ClientID:', req.clientID);

  next();
}

router.post(
  '/EditDocumentRecord',
  extractClientID, // Middleware runs first
  uploadCompanyDoc.single('file'), // Then multer runs
  async (req, res) => {
    try {
      console.log('🔄 Request Payload:', req.body);
      console.log('📁 Uploaded File:', req.file);

      const { UserID, CompanyDocumentID } = req.body;
      const documentFile = req.file;

      if (documentFile) {
        req.body.DocumentFileName = documentFile.filename;
      }

      const result = await SiteMapService.editCompanyDocumentRecord(
        UserID,
        CompanyDocumentID,
        req.body
      );

      res.status(result.status).json(result.response);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: 'Error. Please try again later.' });
    }
  }
);

router.post(
  '/EditDocumentGroupRecord',
  async (req, res) => {
    try {
      console.log('🔄 Request Payload:', req.body);

      // Destructure required fields
      const { UserID, DocumentGroupID, DocumentGroupName, DocumentGroupDescription } = req.body;

      console.log('✅ UserID:', UserID);
      console.log('✅ DocumentGroupID:', DocumentGroupID);

      // Validate required fields
      if (!UserID || !DocumentGroupID) {
        console.error('❌ Missing UserID or DocumentGroupID:', { UserID, DocumentGroupID });
        return res.status(400).json({ error: "UserID and DocumentGroupID are required" });
      }

      // Call the service layer
      const result = await SiteMapService.editDocumentGroupRecord(
        UserID,
        DocumentGroupID,
        {
          DocumentGroupName,
          DocumentGroupDescription,
        }
      );

      res.status(result.status).json(result.response);
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({ error: 'Error. Please try again later.' });
    }
  }
);



router.post('/GetDocumentGroups', authenticateToken, async (req, res) => {
  try {
    const { ClientID } = req.body; // Assuming ClientID is sent from the form
    const documentGroupsResult = await SiteMapService.getDocumentGroups(ClientID);

    if (documentGroupsResult.DocumentGroups) {
      res.status(200).json(documentGroupsResult);
    } else {
      res.status(404).json({ error: 'Document Groups not found' });
    }
  } catch (error) {
    console.error('Error fetching document groups:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post(
  '/InsertDocumentRecord',
  authenticateToken,
  uploadCompanyDoc.single('file'),
  async (req, res) => {
    try {
      const {
        ClientID,
        UserID,
        UsersID: rawUsersID,
        PositionsID: rawPositionsID,
        CompanyDocumentName,
        CompanyDocumentDescription,
        AssignOn,
        DocumentGroupID
      } = req.body;

      const UsersID = rawUsersID ? JSON.parse(rawUsersID) : []; // Safely parse UsersID
      const PositionsID = rawPositionsID ? JSON.parse(rawPositionsID) : []; // Safely parse PositionsID

      console.log("Parsed UsersID:", UsersID);
      console.log("Parsed PositionsID:", PositionsID);

      const documentFile = req.file;

      const insertResult = await SiteMapService.insertDocumentRecord({
        ClientID,
        UserID,
        UsersID,
        PositionsID,
        CompanyDocumentName,
        CompanyDocumentDescription,
        AssignOn,
        DocumentGroupID,
        DocumentFileName: documentFile ? documentFile.filename : null,
      });

      if (insertResult) {
        return res.status(200).json({ success: true, message: 'Document inserted successfully' });
      } else {
        return res.status(500).json({ success: false, message: 'Failed to insert document' });
      }
    } catch (error) {
      console.error('Error inserting document record:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
);



router.post('/InsertDocumentGroupRecord', authenticateToken, uploadCompanyDoc.none(), async (req, res) => {
  try {
    console.log("Body: ", req.body); // Verify parsed data

    const { 
      ClientID, 
      UserID, 
      DocumentGroupName, 
      DocumentGroupDescription 
    } = req.body;

    if (!ClientID || !UserID) {
      return res.status(400).json({ error: "ClientID and UserID are required" });
    }

    // Pass to the service layer
    const insertResult = await SiteMapService.insertDocumentGroupRecord({
      ClientID,
      UserID,
      DocumentGroupName,
      DocumentGroupDescription
    });

    if (insertResult) {
      res.status(200).json({ success: true, message: 'Document Group inserted successfully' });
    }
  } catch (error) {
    console.error('❌ Error inserting document group:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



export default router;
