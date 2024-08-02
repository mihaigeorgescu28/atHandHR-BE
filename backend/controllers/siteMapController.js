import express from "express";
import SiteMapService from '../services/siteMapService.js';

const router = express.Router();


router.post('/NewsfeedData', async (req, res) => {
  try {;
    const { ClientID, LatestNewsID } = req.body

    const newsfeedDataResult = await SiteMapService.getNewsfeedData(ClientID, LatestNewsID);

    res.status(newsfeedDataResult.status).json(newsfeedDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/Icons', async (req, res) => {
  try {;

    const iconsResult = await SiteMapService.getIcons();

    res.status(iconsResult.status).json(iconsResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/InsertNewsfeedRecord', async (req, res) => {
  try {
    const { UserID, ClientID } = req.body;
    const insertNewsfeedRecordResult = await SiteMapService.insertNewsfeedRecord(UserID, ClientID, req.body);

    res.status(insertNewsfeedRecordResult.status).json(insertNewsfeedRecordResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/DeleteNewsfeedRecord', async (req, res) => {
  try {
    const { UserID, LatestNewsID } = req.body; // Assuming ClientID is sent from the form
    const deleteNewsfeedRecordResult = await SiteMapService.deleteNewsfeedRecord(UserID, LatestNewsID);

    res.status(deleteNewsfeedRecordResult.status).json(deleteNewsfeedRecordResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/EditNewsfeedRecord', async (req, res) => {
  try {
    const { UserID, LatestNewsID } = req.body; // Assuming ClientID is sent from the form
    const editNewsfeedRecordResult = await SiteMapService.editNewsfeedRecord(UserID, LatestNewsID, req.body);

    res.status(editNewsfeedRecordResult.status).json(editNewsfeedRecordResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/EmployeePositionData', async (req, res) => {
  try {;
    const { ClientID, PositionID } = req.body

    const positionDataResult = await SiteMapService.getPositionData(ClientID, PositionID);

    res.status(positionDataResult.status).json(positionDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/EditPositionRecord', async (req, res) => {
  try {
    const { UserID, PositionID } = req.body;
    const editPositionResult = await SiteMapService.editPositionRecord(UserID, PositionID, req.body);

    res.status(editPositionResult.status).json(editPositionResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/InsertPositionRecord', async (req, res) => {
  try {
    const { UserID, ClientID } = req.body;
    const insertPositionResult = await SiteMapService.insertPositionRecord(UserID, ClientID, req.body);

    res.status(insertPositionResult.status).json(insertPositionResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/DeletePositionRecord', async (req, res) => {
  try {
    const { UserID, PositionID } = req.body; 
    const deletePositionResult = await SiteMapService.deletePositionRecord(UserID, PositionID);

    res.status(deletePositionResult.status).json(deletePositionResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/ClientLeaveTypeData', async (req, res) => {
  try {;
    const { ClientID, ClientLeaveTypeID } = req.body

    const leaveTypeDataResult = await SiteMapService.getClientLeaveTypeData(ClientID, ClientLeaveTypeID);

    res.status(leaveTypeDataResult.status).json(leaveTypeDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});



router.post('/EditClientLeaveTypeRecord', async (req, res) => {
  try {
    const { UserID, ClientLeaveTypeID } = req.body;
    const editLeaveTypeResult = await SiteMapService.editLeaveTypeRecord(UserID, ClientLeaveTypeID, req.body);

    res.status(editLeaveTypeResult.status).json(editLeaveTypeResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/InsertClientLeaveTypeRecord', async (req, res) => {
  try {
    //const { ClientID, LeaveTypeID } = req.body;
    const insertLeaveTypeResult = await SiteMapService.insertLeaveTypeRecord(req.body);

    res.status(insertLeaveTypeResult.status).json(insertLeaveTypeResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


router.post('/DeleteClientLeaveTypeRecord', async (req, res) => {
  try {
    const { ClientLeaveTypeID } = req.body;
    const deleteLeaveTypeResult = await SiteMapService.deleteLeaveTypeRecord(ClientLeaveTypeID);

    res.status(deleteLeaveTypeResult.status).json(deleteLeaveTypeResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/ClientDefaultsData', async (req, res) => {
  try {;
    const { ClientID } = req.body

    const clientDefaultsDataResult = await SiteMapService.getClientDefaultsData(ClientID);

    res.status(clientDefaultsDataResult.status).json(clientDefaultsDataResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});

router.post('/SubmitClientDefaultsRecord', async (req, res) => {
  try {
    const submitClientDefaultsResult = await SiteMapService.submitClientDefaultsRecord(req.body);

    res.status(submitClientDefaultsResult.status).json(submitClientDefaultsResult.response);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Error. Please try again later.' });
  }
});


export default router;
