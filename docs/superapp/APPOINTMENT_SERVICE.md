# CIVICTAX Appointment Booking Service Architecture

## 1. Ward Office Appointment Model

Citizens can book dedicated face-to-face appointment slots with municipal officers across ward centers:

- **Municipal Centers**:
  - `Center 1`: Central Municipal Corporation HQ, Civil Lines
  - `Center 2`: North Infotech Civic Center, Phase 1
  - `Center 3`: West Industrial Belt Division Office
  - `Center 4`: South Heritage Administrative Building

---

## 2. Capacity Guard & Concurrency

- **Slot Schedule**: Monday to Friday, 10:00 AM to 04:00 PM (1-hour time blocks).
- **Concurrency Limit**: Maximum 4 citizen bookings per hourly time block per officer.
- **Booking Rules**:
  - Booking must occur at least 24 hours in advance.
  - Citizens with an existing active booking for the same service cannot create duplicate concurrent appointments.
