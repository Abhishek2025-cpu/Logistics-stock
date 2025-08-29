// config/payrollRules.js
module.exports = {
  // Which leaves are NON-deductible:
  // Set true for LEAVE TYPES that should NOT deduct pay (CL/SL = true).
  // If you really want "Paid Leave" to deduct, set PL: false.
  nonDeductibleLeaves: {
    CL: true, // Casual Leave
    SL: true, // Sick Leave
    PL: false, // "Paid Leave"—set to true if you want NO deduction
    UL: false  // Unpaid Leave
  },

  // half day deduction fraction:
  halfDayFraction: 0.5,

  // Absent day deduction:
  absenceFraction: 1,

  // Late policy: first late is tolerated, subsequent lates cost some fraction
  // e.g., every late beyond the first deducts 0.25 day
  lateFreeAllowances: 1,
  latePenaltyPerExtraLateDayFraction: 0.25,

  // Default working days pattern (Mon-Fri) if employee.workingDays is missing
  defaultWorkingDays: ["Mon", "Tue", "Wed", "Thu", "Fri","Sat","Sun"],
};
