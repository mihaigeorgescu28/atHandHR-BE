import express from "express";
import TimeManagement from '../services/timeManagementService.js';

const router = express.Router();

// Endpoint to handle daily shift actions (sign in/out)
router.post('/dailyShift', async (req, res) => {
  try {
    const { UserID, password, Latitude, Longitude } = req.body;

    // Call UserService function to handle daily shift actions
    const shiftResult = await TimeManagement.handleDailyShift(UserID, password, Latitude, Longitude);

    res.status(shiftResult.status).json(shiftResult.response);
  } catch (error) {
    console.error('Error handling daily shift:', error);
    res.status(500).json({ error: 'Failed to handle daily shift. Please try again later.' });
  }
});

// Endpoint to handle current shift actions
router.post('/currentShift', async (req, res) => {
  try {
    const { UserID } = req.body;

    // Call TimeManagementService function to handle current shift actions
    const shiftResult = await TimeManagement.handleCurrentShift(UserID);

    res.status(shiftResult.status).json(shiftResult.response);
  } catch (error) {
    console.error('Error handling current shift:', error);
    res.status(500).json({ error: 'Failed to handle current shift. Please try again later.' });
  }
});

// Endpoint to handle SignInOutReportToday
router.get("/SignInOutReportToday", async (req, res) => {
  try {
    const { ClientID, ActionTypeID } = req.query;

    // Call TimeManagementService function to handle SignInOutReportToday
    const signInOutReportResult = await TimeManagement.handleSignInOutReportToday(ClientID, ActionTypeID);

    res.status(200).json(signInOutReportResult);
  } catch (error) {
    console.error('Error handling SignInOutReportToday:', error);
    res.status(500).json({ error: 'Failed to handle SignInOutReportToday. Please try again later.' });
  }
});

// Endpoint to handle SignInOutLastUpdated
router.get("/SignInOutLastUpdated", async (req, res) => {
  try {
    const { ClientID, ActionTypeID } = req.query;

    // Call TimeManagementService function to handle SignInOutLastUpdated
    const signInOutLastUpdatedResult = await TimeManagement.handleSignInOutLastUpdated(ClientID, ActionTypeID);

    res.status(200).json(signInOutLastUpdatedResult);
  } catch (error) {
    console.error('Error handling SignInOutLastUpdated:', error);
    res.status(500).json({ error: 'Failed to handle SignInOutLastUpdated. Please try again later.' });
  }
});

router.get('/SignInOutMonthlyReport', async (req, res) => {
  try {
    const { ClientID, ActionTypeID } = req.query;
    const reportResult = await TimeManagement.getSignInOutMonthlyReport(ClientID, ActionTypeID);
    res.status(200).json(reportResult);
  } catch (error) {
    console.error('Error fetching monthly sign-in/out report:', error);
    res.status(500).json({ error: 'Failed to fetch report. Please try again later.' });
  }
});

router.get('/TimeManagementBreakDown', async (req, res) => {
  try {
    const { ClientID, ActionTypeID, TimeManagementStatus, DateRangeStart, DateRangeEnd } = req.query;
    const breakdownResult = await TimeManagement.getTimeManagementBreakDown(ClientID, ActionTypeID, TimeManagementStatus, DateRangeStart, DateRangeEnd);
    res.status(200).json(breakdownResult);
  } catch (error) {
    console.error('Error fetching time management breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown. Please try again later.' });
  }
});



export default router;
