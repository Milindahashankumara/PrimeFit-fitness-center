# System Workflow Visualization

## Complete User Journey

### 1. Registration & Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Enter: Name, Email,
                    Phone, Password, Role
                              ↓
                ┌─────────────┴──────────────┐
                │    Validation Check        │
                │  - Email format            │
                │  - Password length (6+)    │
                │  - Confirm password match  │
                └─────────────┬──────────────┘
                              ↓
                    Store in localStorage
                    (user data + role)
                              ↓
                    Automatic Redirect
                              ↓
              ┌───────────────┼───────────────┐
              │               │               │
         Customer         Coach            Admin
         Dashboard       Dashboard        Dashboard
```

### 2. Customer Booking Journey

```
┌─────────────────────────────────────────────────────────────┐
│                  CUSTOMER DASHBOARD                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Click "Browse Coaches"
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    COACH LISTING                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Coach 1  │  │ Coach 2  │  │ Coach 3  │                  │
│  │ Rating ⭐ │  │ Rating ⭐ │  │ Rating ⭐ │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
                      Select a Coach
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   COACH PROFILE                              │
│                                                              │
│  Name: Sarah Johnson        Rating: 4.9/5                   │
│  Experience: 8 years        Price: $50/hour                 │
│  Specializations: Strength Training, HIIT, Nutrition        │
│                                                              │
│  ┌──────────── BOOKING SECTION ────────────┐               │
│  │ Select Date: [Calendar Picker]          │               │
│  │ Select Time: [Time Slots Grid]          │               │
│  │ Session Type: ○ Personal ○ Group        │               │
│  │ [Confirm Booking]                        │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Click "Confirm Booking"
                              ↓
                 Store in localStorage via
                      BookingsAPI.create()
                              ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
  Customer View                          Coach View
  ┌─────────────┐                       ┌─────────────┐
  │ MY BOOKINGS │                       │  REQUESTS   │
  │             │                       │             │
  │ ✓ Pending   │←── Real-time Sync ───→│ • New!      │
  └─────────────┘     (5s polling)      └─────────────┘
                                                ↓
                                        Coach Reviews
                                                ↓
                                    ┌──────────┴──────────┐
                                    │   Accept / Reject   │
                                    └──────────┬──────────┘
                                                ↓
                                    Update via BookingsAPI
                                                ↓
        ┌───────────────────────────────────────┘
        ↓
  Customer View Updated
  ┌─────────────┐
  │ MY BOOKINGS │
  │             │
  │ ✓ Accepted  │
  └─────────────┘
```

### 3. Complaint Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│               CUSTOMER - SUBMIT COMPLAINT                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
              Fill Complaint Form:
              - Subject
              - Category (Coach/Facility/Booking/Billing/Other)
              - Priority (Low/Medium/High)
              - Detailed Description
                              ↓
                    Click "Submit Complaint"
                              ↓
                 Store in localStorage via
                    ComplaintsAPI.create()
                              ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
  Customer View                          Admin View
  ┌──────────────────┐                  ┌──────────────────┐
  │ COMPLAINT HISTORY│                  │ COMPLAINTS MGMT  │
  │                  │                  │                  │
  │ Status: Pending  │←── Real-time ───→│ 🔴 New! Pending  │
  └──────────────────┘    Sync (5s)    └──────────────────┘
                                                 ↓
                                        Admin Reviews
                                                 ↓
                                        Select Action:
                                        • In-Progress
                                        • Resolved
                                        • Rejected
                                                 ↓
                                        Write Response
                                                 ↓
                                    Click "Send Response"
                                                 ↓
                                    Update via ComplaintsAPI
                                                 ↓
        ┌───────────────────────────────────────┘
        ↓
  Customer View Updated
  ┌──────────────────┐
  │ COMPLAINT HISTORY│
  │                  │
  │ Status: Resolved │
  │ ✓ Admin Response │
  │ Message: "..."   │
  └──────────────────┘
```

### 4. Data Persistence Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Customer       │  Coach          │  Admin                  │
│  Dashboard      │  Dashboard      │  Dashboard              │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│                   (app/lib/api.ts)                          │
├─────────────────────────────────────────────────────────────┤
│  BookingsAPI                  ComplaintsAPI                 │
│  - create()                   - create()                    │
│  - getAll()                   - getAll()                    │
│  - getByCustomer()            - getByCustomer()             │
│  - getByCoach()               - update()                    │
│  - update()                   - delete()                    │
│  - delete()                                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   LOCAL STORAGE                              │
│                 (Browser Storage)                            │
├─────────────────────────────────────────────────────────────┤
│  Keys:                                                       │
│  - user          (Current user session)                     │
│  - bookings      (All booking records)                      │
│  - complaints    (All complaint records)                    │
└─────────────────────────────────────────────────────────────┘
```

### 5. Real-time Synchronization Mechanism

```
Component Mounted
       ↓
Initialize useEffect
       ↓
┌──────────────────┐
│  Load Data       │
│  from API        │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Set State       │
│  Render UI       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Start Interval   │
│ (every 5 seconds)│
└────────┬─────────┘
         ↓
         ↻ ← Loop
         ↓
┌──────────────────┐
│  Load Data       │
│  from API        │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Update State    │
│  Re-render       │
└────────┬─────────┘
         ↓
      Wait 5s
         ↓
         ↻ ← Repeat

When Component Unmounts:
       ↓
Clear Interval
       ↓
Stop Polling
```

### 6. Role-Based Access Control

```
                    User Login
                        ↓
              Check localStorage
                        ↓
                  user.role?
                        ↓
         ┌──────────────┼──────────────┐
         ↓              ↓              ↓
    "customer"      "coach"        "admin"
         ↓              ↓              ↓
┌────────────────┐┌────────────┐┌────────────┐
│ Customer Pages ││ Coach Pages││ Admin Pages│
├────────────────┤├────────────┤├────────────┤
│ - Dashboard    ││ - Dashboard││ - Dashboard│
│ - Coaches      ││ - Requests ││ - Coaches  │
│ - Bookings     ││ - Schedule ││ - Feedback │
│ - Complaints   ││ - Profile  ││ - Complaints│
│ - Profile      ││            ││ - Resources│
└────────────────┘└────────────┘└────────────┘
```

### 7. Complete System Data Flow

```
┌────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                          │
└────────────────────────────────────────────────────────────┘
    │         │         │         │         │
    │         │         │         │         │
Register   Login    Book      Submit    Accept/
                   Session  Complaint  Respond
    │         │         │         │         │
    ↓         ↓         ↓         ↓         ↓
┌────────────────────────────────────────────────────────────┐
│                     COMPONENT LAYER                        │
│  - Validate Input                                          │
│  - Call API                                                │
│  - Update UI                                               │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                       API LAYER                            │
│  - BookingsAPI.create()                                    │
│  - ComplaintsAPI.create()                                  │
│  - API.update()                                            │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                    LOCAL STORAGE                           │
│  - Store JSON data                                         │
│  - Persist across sessions                                 │
└────────────────────────────────────────────────────────────┘
                            ↓
                    Polling (every 5s)
                            ↓
┌────────────────────────────────────────────────────────────┐
│                   ALL ACTIVE VIEWS                         │
│  - Customer Dashboard                                      │
│  - Coach Dashboard                                         │
│  - Admin Dashboard                                         │
│  → All update automatically                                │
└────────────────────────────────────────────────────────────┘
```

## Status Transition Diagrams

### Booking Status Flow
```
    [Created]
       ↓
   ┌───────┐
   │PENDING│ ←── Initial status when customer books
   └───┬───┘
       │
   ┌───┼────────────┐
   ↓                ↓
┌─────────┐    ┌─────────┐
│ACCEPTED │    │REJECTED │
└────┬────┘    └─────────┘
     │
     ↓
┌─────────┐    ┌───────────┐
│COMPLETED│ or │ CANCELLED │
└─────────┘    └───────────┘
```

### Complaint Status Flow
```
    [Created]
       ↓
   ┌───────┐
   │PENDING│ ←── Initial status when customer submits
   └───┬───┘
       │
   ┌───┼────────────┐
   ↓                ↓
┌────────────┐ ┌─────────┐
│IN-PROGRESS │ │REJECTED │
└─────┬──────┘ └─────────┘
      │
      ↓
  ┌─────────┐
  │RESOLVED │
  └─────────┘
```

## Key Features Summary

### ✅ Authentication
- Email/password registration
- Role-based login
- Persistent sessions
- Secure logout

### ✅ Booking System
- Coach browsing
- Profile viewing
- Session booking
- Status tracking
- Real-time sync

### ✅ Complaint System
- Multi-category support
- Priority levels
- Status workflow
- Admin responses
- Real-time updates

### ✅ Dashboard Features
- Customer: Book, View bookings, Submit complaints
- Coach: View requests, Accept/Reject bookings
- Admin: Manage complaints, Respond to issues

### ✅ Data Persistence
- LocalStorage backend
- API abstraction layer
- CRUD operations
- Real-time polling

---

**Note:** This is a visual representation of the system architecture and workflows. For detailed implementation, refer to [SYSTEM_IMPLEMENTATION.md](./SYSTEM_IMPLEMENTATION.md).
