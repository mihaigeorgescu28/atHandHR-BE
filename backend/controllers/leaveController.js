// leaveController.js
import express from "express";
import LeaveService from '../services/leaveService.js';

const router = express.Router();

router.post("/leaveType", async (req, res) => {
    try {
        const { UserID } = req.body;
        const holidayTypes = await LeaveService.getHolidayTypes(UserID);
        res.status(200).json(holidayTypes);
    } catch (error) {
        console.error('Error fetching holiday types:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/globalLeaveTypes", async (req, res) => {
    try {
        const { UserID } = req.body;
        const globalHolidayTypes = await LeaveService.getGlobalLeaveTypes(UserID);
        res.status(200).json(globalHolidayTypes);
    } catch (error) {
        console.error('Error fetching holiday types:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/userHolidayInfo", async (req, res) => {
  try {
      const { UserID } = req.body;
      const userHolidayInfo = await LeaveService.getUserHolidayInfo(UserID);
      res.status(200).json(userHolidayInfo);
  } catch (error) {
      console.error('Error fetching user holiday info:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/submitLeave", async (req, res) => {
  try {
      const result = await LeaveService.submitLeave(req.body);
      res.status(200).json({ message: "Your leave request was submitted!" });
  } catch (error) {
      console.error('Error submitting leave request:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/leaveRequests", async (req, res) => {
  try {
      const { ClientID } = req.query;
      const leaveRequests = await LeaveService.getLeaveRequests(ClientID);
      res.status(200).json(leaveRequests);
  } catch (error) {
      console.error('Error fetching leave requests:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/LeaveRequestStatusBreakDown", async (req, res) => {
  try {
      const { ClientID, LeaveTypeGroupID, LeaveStatusID, LeaveTypeID } = req.query;
      const breakdown = await LeaveService.getLeaveRequestStatusBreakdown(ClientID, LeaveTypeGroupID, LeaveStatusID, LeaveTypeID);
      res.status(200).json(breakdown);
  } catch (error) {
      console.error('Error fetching leave request status breakdown:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/staffOnLeave", async (req, res) => {
  try {
      const DateRange = req.query.DateRange || '0';
      const staffOnLeave = await LeaveService.getStaffOnLeave(req.query.ClientID, DateRange);
      res.status(200).json(staffOnLeave);
  } catch (error) {
      console.error('Error fetching staff on leave:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/CurrentNumberOfLeaveRequestsByMonth", async (req, res) => {
  try {
      const { ClientID } = req.query;
      const leaveRequestsByMonth = await LeaveService.getCurrentNumberOfLeaveRequestsByMonth(ClientID);
      res.status(200).json(leaveRequestsByMonth);
  } catch (error) {
      console.error('Error fetching leave requests by month:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/CurrentNumberOfLeaveRequests", async (req, res) => {
  try {
      const { ClientID } = req.query;
      const leaveRequestsCount = await LeaveService.getCurrentNumberOfLeaveRequests(ClientID);
      res.status(200).json(leaveRequestsCount);
  } catch (error) {
      console.error('Error fetching leave requests count:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/bankHoliday", async (req, res) => {
  try {
      const bankHolidayStatus = await LeaveService.checkBankHoliday(req.body.Date);
      res.status(200).json(bankHolidayStatus);
  } catch (error) {
      console.error('Error checking bank holiday:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/sameDayExistingLeave", async (req, res) => {
    try {
        const sameDayExistingLeave = await LeaveService.checkSameDayExistingLeave(req.body.Date, req.body.UserID);
        res.status(200).json(sameDayExistingLeave);
    } catch (error) {
        console.error('Error checking same day leave:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  });

router.post("/WithinBankHoliday", async (req, res) => {
  try {
    const bankHolidayInfo = await LeaveService.getBankHolidayInfo(req.body.start, req.body.end, req.body.diffInMs);
      res.status(200).json(bankHolidayInfo);
  } catch (error) {
      console.error('Error getting bank holiday info:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/countStaffData", async (req, res) => {
  try {
      const clientID = req.query.ClientID;
      const staffData = await LeaveService.getCountStaffData(clientID);
      res.status(200).json(staffData);
  } catch (error) {
      console.error('Error counting staff data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/leaveRequestsStatus", async (req, res) => {
  try {
      const { ClientID, LeaveTypeGroupID } = req.query;
      const leaveRequestsStatus = await LeaveService.getLeaveRequestsStatus(ClientID, LeaveTypeGroupID);
      res.status(200).json(leaveRequestsStatus);
  } catch (error) {
      console.error('Error getting leave requests status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/leaveRequestsType", async (req, res) => {
  try {
      const { ClientID, LeaveTypeGroupID, StatusID } = req.query;
      const leaveRequestsType = await LeaveService.getLeaveRequestsType(ClientID, LeaveTypeGroupID, StatusID);
      res.status(200).json(leaveRequestsType);
  } catch (error) {
      console.error('Error getting leave requests type:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get("/leaveRequestLastUpdated", async (req, res) => {
  try {
      const { ClientID, LeaveTypeID } = req.query;
      const lastUpdated = await LeaveService.getLeaveRequestLastUpdated(ClientID, LeaveTypeID);
      res.status(200).json(lastUpdated);
  } catch (error) {
      console.error('Error getting last updated leave request:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post("/actionLeaveRequest", async (req, res) => {
    try {
        const { StatusID, LeaveRequestID, UserID } = req.body; // Retrieve from request body
        const actionLeaveRequest = await LeaveService.actionLeaveRequestStatus(StatusID, LeaveRequestID, UserID);
        res.status(200).json(actionLeaveRequest);
    } catch (error) {
        console.error('Error getting last updated leave request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/holidayEntitlementResetDate", async (req, res) => {
    try {
        const holidayEntitlementResetDate = await LeaveService.checkAndResetHolidayEntitlement();
        res.status(200).json(holidayEntitlementResetDate);
    } catch (error) {
        console.error('Error getting last updated leave request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;
