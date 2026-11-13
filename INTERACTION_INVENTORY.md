# CIVICTAX — Complete Interaction & Button Inventory

This inventory documents all interactive elements across CIVICTAX, confirming compliance with the **Zero-Dead-Button Policy**.

---

## 1. Global Navigation & Header

| Component | Element Name | Target / Action | Executed Handler | Result / Verification |
| :--- | :--- | :--- | :--- | :--- |
| `AppHeader` | Theme Toggle | Switch between Light & Dark themes | `toggleTheme()` in `ThemeContext` | Toggles `'dark'` class on `<html>` root |
| `AppHeader` | Notifications Bell | Open notification dropdown | `setIsNotificationsOpen(true)` | Displays unread alerts with mark-read & dismiss |
| `AppHeader` | Profile Dropdown | Open user profile menu | `setIsProfileOpen(true)` | Shows user role, quick links, and logout |
| `UserProfileMenu` | Logout Button | Clear session and return to `/login` | `logout()` in `AuthContext` | Clears stored session, redirects to `/login` |
| `AppSidebar` | Navigation Links | Switch dashboard views | React Router `NavLink` | Navigates to dedicated URL route |
| `AppSidebar` | Collapse Button | Collapse/expand sidebar | `setIsCollapsed(!isCollapsed)` | Toggles sidebar width smoothly |

---

## 2. Public Portal

| Page | Element | Expected Action | Actual Handler | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `LandingPage` | Calculate Tax Button | Calculate estimate on hero | `handleCalculate()` in state | Displays estimated tax breakdown |
| `LandingPage` | Explore Services Link | Scroll/navigate to services | Link to `/services` | Navigates to `/services` |
| `LandingPage` | Get Started Button | Navigate to login or register | Link to `/login` | Navigates to `/login` |
| `LoginPage` | Role Preset Buttons | Fill demo credentials | `handleRoleSelect('CITIZEN'/'OFFICER'/'ADMIN')` | Inputs verified demo credentials into form |
| `LoginPage` | Sign In Submit | Authenticate user | `handleSubmit(onLogin)` | Validates, updates session, redirects |
| `DemoRegistrationPage` | Register Citizen | Create new demo citizen | `handleRegister()` | Saves user to LocalStorage and signs in |

---

## 3. Citizen Portal

| Page | Element | Expected Action | Actual Handler | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `CitizenDashboard` | Pay Tax Shortcut | Open payment portal | Link to `/citizen/payments` | Navigates to payments view |
| `CitizenDashboard` | Register Property | Open property registration form | Link to `/citizen/register-property` | Navigates to form |
| `MyPropertiesPage` | Filter / Search | Filter properties by category/status | Reactive filter state | Table filters records in real time |
| `MyPropertiesPage` | View Details Button | Open property details modal | `setSelectedProperty(prop)` | Shows title deed and inspection notes |
| `RegisterPropertyPage`| Submit Form | Validate and create property | `handleSubmit(onSubmit)` via Zod | Generates `CT-PROP-2024-XXX`, redirects |
| `CitizenAssessmentsPage`| Pay Now Button | Initiate payment for assessment | Navigate to `/citizen/payments?assessmentId=X` | Opens payment portal pre-selected |
| `CitizenPaymentPortalPage`| Confirm Payment | Process payment & generate receipt | `handlePaymentSubmit()` | Deducts balance, opens `ReceiptViewer` |
| `ReceiptViewer` | Print Receipt | Print receipt layout | `window.print()` | Opens browser print dialog |
| `ReceiptViewer` | Download PDF | Simulate PDF download | Blob download | Triggers file download |
| `CitizenGrievancesPage`| Submit Grievance | Lodge new complaint | `handleGrievanceSubmit()` | Generates `GRV-2024-XXX` and adds to list |
| `CitizenReassessmentsPage`| Submit Request | File tax dispute | `handleReassessmentSubmit()` | Saves request and updates table |

---

## 4. Municipal Officer Portal

| Page | Element | Expected Action | Actual Handler | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `AssignedPropertiesPage`| Inspect Property | Open deed & inspection modal | `setSelectedProperty(p)` | Displays property survey specifications |
| `PropertyVerificationPage`| Approve Button | Approve property registration | `handleVerify(prop.id, 'VERIFIED')` | Updates status and notifies citizen |
| `PropertyVerificationPage`| Reject Button | Reject with feedback | `handleVerify(prop.id, 'REJECTED')` | Prompts for inspector notes and saves |
| `OfficerAssessmentsPage`| Generate Assessment | Create tax bill for property | `handleGenerateAssessment()` | Calculates using municipal rates and saves |
| `OfficerReassessmentsPage`| Accept / Reject | Adjudicate reassessment | `handleDecision(req.id, status)` | Updates assessment balance and notifies |
| `OfficerGrievancesPage`| Update Stage | Advance grievance workflow | `handleStatusUpdate(grv.id, status)` | Updates status to `IN_PROGRESS`/`RESOLVED` |
| `OfficerPaymentsPage` | Filter Payments | Search and filter zone receipts | Filter state | Filters real transaction records |

---

## 5. Administrator Portal

| Page | Element | Expected Action | Actual Handler | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `UserManagementPage` | Add User Button | Open user creation modal | `setIsAddUserOpen(true)` | Adds new admin/officer/citizen account |
| `UserManagementPage` | Edit / Delete User | Modify or remove user | Handlers with confirmation | Updates or removes user record |
| `ZoneManagementPage` | Add Zone Button | Create municipal zone | `handleCreateZone()` | Adds ward zone and assigns officer |
| `TaxRateConfigPage` | Edit Rate Button | Update `₹/sq ft` rate | `handleSaveRate()` | Updates rate table; recalculates taxes |
| `AdminReportsPage` | Export CSV | Download report | `exportToCSV(data, filename)` | Sanitizes and downloads CSV file |
| `SystemSettingsPage` | Save Settings | Save operational parameters | `handleSaveSettings()` | Displays confirmation toast |
| `SystemSettingsPage` | Reset Database | Factory reset to seed data | `StorageService.resetToSeedData()` | Restores seed data with `ConfirmDialog` |
