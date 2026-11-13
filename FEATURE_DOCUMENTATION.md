# CIVICTAX — Feature Documentation & User Manual

## 1. Zero-Dead-Button & Interactive Feature Matrix

Every button, menu item, modal trigger, tab, and download button across all 4 portals is fully implemented with real state operations:

| Portal | Feature / Screen | User Action | Executed System Behavior |
| :--- | :--- | :--- | :--- |
| **Public** | Landing Page | Quick Tax Calculator | Calculates estimated annual tax instantly based on chosen category, zone, and area. |
| **Public** | Login Page | One-Click Demo Badges | Automatically inputs credentials for Citizen, Officer, or Admin and signs in. |
| **Citizen** | My Properties | Register Property | Opens structured registration modal with Zod schema validation. |
| **Citizen** | Property List | View Details / Documents | Displays inspection details, deed numbers, and current verification status. |
| **Citizen** | Payment Portal | Pay Now Button | Opens payment modal with selection between UPI, Card, or Net Banking. |
| **Citizen** | Payment Portal | Confirm Payment | Dispatches simulated payment, updates assessment outstanding balance, and generates receipt. |
| **Citizen** | Payments | Download Receipt | Opens official printable receipt modal with print and PDF generation triggers. |
| **Citizen** | Grievances | Register Grievance | Creates tracking ID, assigns status `SUBMITTED`, and updates citizen timeline. |
| **Citizen** | Reassessments | Submit Dispute | Submits dispute claim with claimed area and documents for officer review. |
| **Officer** | Verification | Approve Registration | Updates status to `VERIFIED`, records officer timestamp, and enables tax assessment. |
| **Officer** | Verification | Reject / Flag | Records rejection reason and prompts citizen for resubmission. |
| **Officer** | Assessments | Generate Assessment | Pulls current municipal tax rate, calculates base tax, and sets status to `APPROVED`. |
| **Officer** | Grievances | Update Stage | Transitions complaint from `SUBMITTED` -> `UNDER_REVIEW` -> `RESOLVED`. |
| **Admin** | Tax Rate Config | Add / Edit Rate | Updates gazette rate (`₹/sq ft`); propagates to future assessment calculations. |
| **Admin** | Zone Management | Add / Edit Zone | Adjusts ward boundaries and assigns responsible revenue officers. |
| **Admin** | Reports | Export CSV | Generates sanitized CSV files (neutralizing formula injection) and triggers download. |
| **Admin** | System Settings | Reset Database | Restores LocalStorage to standard seed records with `ConfirmDialog` confirmation. |

---

## 2. Notification Center
- Built-in bell indicator with unread count badge.
- Instant notifications generated upon property approval, new tax bill generation, payment clearance, and grievance status change.
- One-click "Mark All as Read" and individual notification dismissal.
