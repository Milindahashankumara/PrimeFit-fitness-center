# Quick Testing Guide

## Prerequisites
1. Start the development server: `npm run dev`
2. Open browser to `http://localhost:3000`

## Test Scenario 1: Complete Customer Journey

### Step 1: Register as Customer
1. Navigate to `/auth/register`
2. Fill in the form:
   - Name: John Doe
   - Email: john@example.com
   - Phone: 1234567890
   - Password: test123
   - Role: Customer
3. Submit form
4. **Expected:** Redirected to `/dashboard/customer`

### Step 2: Browse and Book a Coach
1. From customer dashboard, click "Browse Coaches"
2. Select any coach (e.g., "Sarah Johnson")
3. **Expected:** See coach profile with details, ratings, specializations
4. Scroll to booking section
5. Select a date (any available date)
6. Select a time slot (click on available time)
7. Choose "Personal Training"
8. Click "Confirm Booking"
9. **Expected:** See success confirmation, redirected to dashboard

### Step 3: View Your Bookings
1. From customer dashboard, click "My Bookings"
2. **Expected:** See your newly created booking in "Upcoming" tab
3. Note: Status will be "Upcoming" (pending coach acceptance)

### Step 4: Submit a Complaint
1. From customer dashboard, click "Complaints & Feedback"
2. Stay on "Submit Complaint" tab
3. Fill in the form:
   - Subject: Test equipment issue
   - Category: Facility Issues
   - Priority: Medium
   - Description: The treadmill is making strange noises
4. Click "Submit Complaint"
5. **Expected:** Success message, switched to "Complaint History" tab
6. **Expected:** See your complaint with "Pending" status

## Test Scenario 2: Coach Workflow

### Step 1: Register as Coach
1. Open incognito/private window or different browser
2. Navigate to `/auth/register`
3. Fill in the form:
   - Name: Sarah Johnson
   - Email: sarah@example.com
   - Phone: 0987654321
   - Password: coach123
   - Role: Coach
4. Submit form
5. **Expected:** Redirected to `/dashboard/coach`

### Step 2: View Booking Requests
1. From coach dashboard, click "Booking Requests"
2. **Expected:** See booking request from John Doe (created in Scenario 1)
3. Review booking details
4. Click "Accept" button on the booking
5. Confirm acceptance
6. **Expected:** Success message, booking moves to "Accepted" tab

### Step 3: Verify Customer Sees Update
1. Return to customer browser (John Doe's account)
2. Navigate to "My Bookings"
3. Wait up to 5 seconds (auto-refresh)
4. **Expected:** Booking status should now show as "Upcoming" (accepted)

## Test Scenario 3: Admin Workflow

### Step 1: Access Admin Dashboard
1. Open another incognito/private window
2. Navigate to `/auth/login`
3. Click "Don't have an account? Sign up"
4. Register as admin:
   - Name: Admin User
   - Email: admin@example.com
   - Phone: 5555555555
   - Password: admin123
   - Role: Customer (then manually change localStorage)
5. **Manual Admin Setup:**
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Find 'user' key
   - Edit the JSON: change `"role": "customer"` to `"role": "admin"`
   - Refresh page
6. **Expected:** Admin dashboard loads

### Step 2: View and Respond to Complaints
1. From admin dashboard, notice the red alert banner about complaints
2. Click "View Complaints" or navigate via "Complaints" card
3. **Expected:** See John Doe's complaint in the list
4. Click "Respond" button on the complaint
5. **Expected:** Modal opens with complaint details
6. Select status: "Resolved"
7. Type response: "Thank you for reporting. We've fixed the treadmill."
8. Click "Send Response"
9. **Expected:** Success message, modal closes

### Step 3: Verify Customer Sees Response
1. Return to customer browser (John Doe's account)
2. Navigate to "Complaints & Feedback" → "Complaint History"
3. Wait up to 5 seconds (auto-refresh)
4. **Expected:** 
   - Complaint status: "Resolved" (green badge)
   - Admin response visible in green box
   - Response from admin shown

## Test Scenario 4: Real-time Synchronization

### Test Booking Sync
1. Have customer and coach dashboards open side-by-side
2. Create new booking as customer
3. **Expected:** Within 5 seconds, booking appears in coach's requests
4. Accept booking as coach
5. **Expected:** Within 5 seconds, customer's booking status updates

### Test Complaint Sync
1. Have customer and admin dashboards open side-by-side
2. Submit complaint as customer
3. **Expected:** Within 5 seconds, complaint appears in admin panel
4. Respond as admin
5. **Expected:** Within 5 seconds, response appears in customer's history

## Verification Checklist

### Customer Registration ✓
- [ ] Can register with email and password
- [ ] Redirected to customer dashboard after registration
- [ ] Login persists after page refresh
- [ ] Can logout successfully

### Coach Selection & Booking ✓
- [ ] Can browse available coaches
- [ ] Can view detailed coach profiles
- [ ] Can select date and time slots
- [ ] Can choose session type
- [ ] Booking is created successfully
- [ ] Booking appears in customer's booking list

### Coach Dashboard ✓
- [ ] Bookings appear automatically in coach dashboard
- [ ] Can view booking details
- [ ] Can accept booking requests
- [ ] Can reject booking requests
- [ ] Status changes sync to customer view

### Complaint System ✓
- [ ] Customer can submit complaints
- [ ] Complaints appear in admin dashboard automatically
- [ ] Admin can view complaint details
- [ ] Admin can respond to complaints
- [ ] Admin can update complaint status
- [ ] Responses sync to customer view

### Real-time Updates ✓
- [ ] Bookings sync between customer and coach (within 5 seconds)
- [ ] Complaints sync between customer and admin (within 5 seconds)
- [ ] Status updates reflect in all relevant views

## Troubleshooting

### Issue: Bookings not appearing in coach dashboard
**Solution:** 
1. Check browser console for errors
2. Verify localStorage has 'bookings' key
3. Wait 5 seconds for auto-refresh
4. Manually refresh the page

### Issue: Complaints not appearing in admin dashboard
**Solution:**
1. Verify user role is set to "admin" in localStorage
2. Check that 'complaints' key exists in localStorage
3. Wait 5 seconds for auto-refresh
4. Clear localStorage and try again

### Issue: Admin dashboard not loading
**Solution:**
1. Open DevTools → Application → Local Storage
2. Find 'user' key
3. Verify `"role": "admin"` in the JSON
4. If not, edit and change to "admin"
5. Refresh page

### Issue: Updates not syncing
**Solution:**
1. Wait up to 5 seconds (polling interval)
2. Check if both windows are on correct pages
3. Manually refresh both pages
4. Check console for JavaScript errors

## Data Inspection

### View All Bookings
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Find 'bookings' key
4. Click to view JSON data

### View All Complaints
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Find 'complaints' key
4. Click to view JSON data

### Clear All Data
Run in browser console:
```javascript
localStorage.removeItem('bookings');
localStorage.removeItem('complaints');
location.reload();
```

## Notes
- All data is stored in browser localStorage
- Data persists across page refreshes
- Data is specific to each browser/domain
- Clearing browser data will reset everything
- Real-time sync uses 5-second polling intervals
