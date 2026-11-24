// Verification script for DBU Gym Business Logic
const assert = require('assert');

// 1. Test Renewal Date Logic
function addDaysToDate(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function calculateRenewalDates(currentEndDate, durationDays, paymentDate, today) {
  if (currentEndDate && currentEndDate >= paymentDate && currentEndDate >= today) {
    return {
      startDate: currentEndDate,
      endDate: addDaysToDate(currentEndDate, durationDays),
      isExtended: true,
    };
  }
  return {
    startDate: paymentDate,
    endDate: addDaysToDate(paymentDate, durationDays),
    isExtended: false,
  };
}

console.log('Testing Renewal Logic...');

// Case A: Member renews BEFORE expiration (current active: valid until 2026-12-30, today is 2026-11-21)
const renewalBeforeExpiry = calculateRenewalDates('2026-12-30', 30, '2026-11-21', '2026-11-21');
assert.strictEqual(renewalBeforeExpiry.isExtended, true);
assert.strictEqual(renewalBeforeExpiry.startDate, '2026-12-30');
assert.strictEqual(renewalBeforeExpiry.endDate, '2027-01-29');
console.log('✔ Case A Passed: Renew before expiration extends continuously from current end date');

// Case B: Member renews AFTER expiration (previous expiry: 2026-10-15, today is 2026-11-21)
const renewalAfterExpiry = calculateRenewalDates('2026-10-15', 30, '2026-11-21', '2026-11-21');
assert.strictEqual(renewalAfterExpiry.isExtended, false);
assert.strictEqual(renewalAfterExpiry.startDate, '2026-11-21');
assert.strictEqual(renewalAfterExpiry.endDate, '2026-12-21');
console.log('✔ Case B Passed: Renew after expiration starts fresh from renewal date');

// Case C: First-time member with no previous membership
const firstTimePayment = calculateRenewalDates(null, 30, '2026-11-21', '2026-11-21');
assert.strictEqual(firstTimePayment.isExtended, false);
assert.strictEqual(firstTimePayment.startDate, '2026-11-21');
assert.strictEqual(firstTimePayment.endDate, '2026-12-21');
console.log('✔ Case C Passed: First-time member payment starts from payment date');

// 2. Test Member Status Computation Logic
function computeMemberStatus(isActive, membershipEndDate, hasPayment, today) {
  if (isActive === 0) return { status: 'inactive', daysRemaining: 0 };
  if (!hasPayment || !membershipEndDate) return { status: 'unpaid', daysRemaining: 0 };

  const [tY, tM, tD] = today.split('-').map(Number);
  const [eY, eM, eD] = membershipEndDate.split('-').map(Number);
  const todayTime = new Date(tY, tM - 1, tD).getTime();
  const endTime = new Date(eY, eM - 1, eD).getTime();
  const diffDays = Math.ceil((endTime - todayTime) / (1000 * 60 * 60 * 24));

  if (membershipEndDate >= today) {
    return { status: 'active', daysRemaining: Math.max(0, diffDays) };
  } else {
    return { status: 'expired', daysRemaining: 0 };
  }
}

console.log('Testing Membership Status Computation...');
const statusActive = computeMemberStatus(1, '2026-12-30', true, '2026-11-21');
assert.strictEqual(statusActive.status, 'active');
assert.strictEqual(statusActive.daysRemaining, 39);
console.log('✔ Status Active passed');

const statusExpired = computeMemberStatus(1, '2026-10-15', true, '2026-11-21');
assert.strictEqual(statusExpired.status, 'expired');
assert.strictEqual(statusExpired.daysRemaining, 0);
console.log('✔ Status Expired passed');

const statusUnpaid = computeMemberStatus(1, null, false, '2026-11-21');
assert.strictEqual(statusUnpaid.status, 'unpaid');
console.log('✔ Status Unpaid passed');

const statusInactive = computeMemberStatus(0, '2026-12-30', true, '2026-11-21');
assert.strictEqual(statusInactive.status, 'inactive');
console.log('✔ Status Inactive passed');

console.log('\nALL BUSINESS LOGIC TESTS PASSED SUCCESSFULLY! 🎯');
