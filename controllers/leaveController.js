// controllers/leaveController.js
const LeaveRequest = require("../models/LeaveRequest");
const Employee = require("../models/Employee");

// Apply for leave
exports.applyLeave = async (req, res) => {
  try {
    const decoded = req.user; // from token
    const { leaveType, fromDate, toDate, reason } = req.body;

    const employee = await Employee.findById(decoded.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Calculate days requested
    const daysRequested = 
      (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24) + 1;

    if (employee.leave < daysRequested) {
      return res.status(400).json({ message: "Insufficient leave balance" });
    }

    const leaveReq = new LeaveRequest({
      employee: employee._id,
      leaveType,
      fromDate,
      toDate,
      reason
    });

    await leaveReq.save();
    res.status(201).json({ message: "Leave request submitted", leaveReq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// Approve or Reject Leave
exports.reviewLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status } = req.body; // "Approved" or "Rejected"
    const hr = req.user; // HR/Admin from token

    const leaveReq = await LeaveRequest.findById(leaveId).populate("employee");
    if (!leaveReq) return res.status(404).json({ message: "Leave request not found" });

    leaveReq.status = status;
    leaveReq.reviewedBy = hr.id;

    // If approved, deduct from employee leave balance
    if (status === "Approved") {
      const daysRequested =
        (new Date(leaveReq.toDate) - new Date(leaveReq.fromDate)) /
          (1000 * 60 * 60 * 24) + 1;
      leaveReq.employee.leave -= daysRequested;
      await leaveReq.employee.save();
    }

    await leaveReq.save();

    res.json({ message: `Leave ${status}`, leaveReq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
