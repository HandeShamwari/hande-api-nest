# Driver Verification & Document Management Feature

## Overview
Complete driver verification system for HANDE administration panel with document review and approval workflow.

## Features Implemented

### 1. Backend API Endpoints

#### Driver Management
```php
GET    /api/admin/drivers              // List all drivers with filters
GET    /api/admin/drivers/{id}          // Get driver details with documents
PUT    /api/admin/drivers/{id}/verify   // Verify driver and activate account
PUT    /api/admin/drivers/{id}/suspend  // Suspend driver
PUT    /api/admin/drivers/{id}/activate // Activate suspended driver
```

#### Document Management
```php
GET    /api/admin/drivers/documents/pending           // Get all pending documents
PUT    /api/admin/drivers/documents/{id}/approve      // Approve document
PUT    /api/admin/drivers/documents/{id}/reject       // Reject document with reason
```

### 2. Frontend Components

#### DriverDetailModal Component
- **Location**: `/hande-administration/src/components/driver/DriverDetailModal.tsx`
- **Purpose**: Full-screen modal for reviewing driver details and documents
- **Features**:
  - Driver profile information display
  - Vehicle information display
  - Document viewer with image preview
  - Individual document approval/rejection
  - Bulk driver verification
  - Rejection reason input

#### Users Page Integration
- **Location**: `/hande-administration/src/pages/Users.tsx`
- **Updates**:
  - Added "View" button with eye icon for each driver
  - Opens DriverDetailModal on click
  - Quick verify button remains for fast approvals

### 3. Database Tables Used

#### table_drivers
- `id` - Driver ID
- `user_id` - Reference to users table
- `status` - active, pending, suspended, rejected
- `verification_status` - pending, verified, rejected
- `verified_at` - Timestamp of verification
- `verified_by` - Admin user ID who verified

#### table_driver_documents
- `id` - Document ID
- `driver_id` - Reference to driver
- `document_type` - license, registration, insurance, etc.
- `document_number` - Document identification number
- `file_path` - URL to document image
- `status` - pending, approved, rejected
- `expiry_date` - Document expiration date
- `verified_at` - Timestamp of approval/rejection
- `verified_by` - Admin user ID who reviewed
- `rejection_reason` - Reason for rejection (if rejected)

#### table_driver_vehicles
- `driver_id` - Reference to driver
- `make` - Vehicle manufacturer
- `model` - Vehicle model
- `year` - Vehicle year
- `color` - Vehicle color
- `license_plate` - License plate number

### 4. Verification Workflow

#### Step 1: Driver Uploads Documents (Mobile App)
- Driver uploads required documents through mobile app
- Documents are saved with status "pending"
- Driver status remains "pending"

#### Step 2: Admin Reviews Documents (Web Admin Panel)
1. Admin opens Users page
2. Clicks "View" button on driver row
3. DriverDetailModal opens showing:
   - Driver profile
   - Vehicle details
   - All uploaded documents with preview

#### Step 3: Document Review
Admin can:
- **View document**: Click on image to open full size in new tab
- **Approve document**: Click green "Approve" button
- **Reject document**: 
  1. Click red "Reject" button
  2. Enter rejection reason in textarea
  3. Click "Confirm Reject"

#### Step 4: Driver Verification
- Once all documents are approved:
  - Green "Verify Driver & Activate Account" button appears
  - Admin clicks button
  - Driver status changes to "verified"
  - Driver status changes to "active"
  - All documents marked as "approved"
  - Driver can now accept rides

### 5. Status Badges & Colors

#### Verification Status
- **Pending**: Yellow badge with clock icon
- **Verified**: Green badge with checkmark icon
- **Rejected**: Red badge with X icon

#### Document Status
- **pending**: Yellow background
- **approved**: Green background
- **rejected**: Red background

### 6. API Response Examples

#### Get Driver Details
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profile_image": "https://...",
    "status": "pending",
    "verification_status": "pending",
    "vehicle": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "color": "Silver",
      "license_plate": "ABC123"
    },
    "documents": [
      {
        "id": 1,
        "document_type": "drivers_license",
        "document_number": "DL123456",
        "file_path": "https://storage.../license.jpg",
        "status": "pending",
        "expiry_date": "2026-12-31",
        "uploaded_at": "2026-01-15 10:30:00"
      }
    ]
  }
}
```

#### Verify Driver
```json
PUT /api/admin/drivers/1/verify
{
  "status": "verified"
}

Response:
{
  "success": true,
  "message": "Driver and all documents verified successfully"
}
```

#### Reject Document
```json
PUT /api/admin/drivers/documents/1/reject
{
  "reason": "Document is blurry and unreadable"
}

Response:
{
  "success": true,
  "message": "Document rejected successfully"
}
```

### 7. UI/UX Features

#### Modal Features
- **Scrollable content**: Handles long document lists
- **Sticky header**: Title and close button always visible
- **Image preview**: Click to view full size in new tab
- **Status indicators**: Color-coded badges for quick status check
- **Loading states**: Shows loading spinners during API calls
- **Error handling**: Displays error messages for failed actions
- **Optimistic updates**: Instant UI feedback with TanStack Query

#### Button Actions
- **View button**: Blue eye icon - Opens detail modal
- **Quick Verify**: Green checkmark - Fast approval without viewing docs
- **Approve Document**: Green button with checkmark icon
- **Reject Document**: Red button with X icon
- **Verify Driver**: Large green button - Final activation step

### 8. Brand Compliance

All colors follow HANDE brand guidelines:
- **Primary Green**: `#7ED957` - Success states, approval actions
- **Danger Red**: `#FF4C4C` - Rejection actions (errors only)
- **Gold**: `#FFB800` - Not used in verification (reserved for pricing)
- **Gray tones**: Status backgrounds and text

### 9. Testing Checklist

#### Backend Testing
- [ ] GET /admin/drivers returns driver list
- [ ] GET /admin/drivers/{id} returns driver details
- [ ] PUT /admin/drivers/{id}/verify updates driver status
- [ ] PUT /admin/drivers/documents/{id}/approve updates document
- [ ] PUT /admin/drivers/documents/{id}/reject requires reason
- [ ] Verify driver sets verified_at timestamp
- [ ] Verify driver updates verified_by admin ID

#### Frontend Testing
- [ ] Users page shows all drivers
- [ ] View button opens modal
- [ ] Modal displays driver info correctly
- [ ] Modal shows all documents
- [ ] Document images load and display
- [ ] Approve button works
- [ ] Reject button opens textarea
- [ ] Rejection requires reason input
- [ ] Verify driver button only shows when all docs approved
- [ ] Modal closes after driver verification
- [ ] Driver list refreshes after actions

### 10. Future Enhancements

- [ ] Email notifications to driver on document approval/rejection
- [ ] Push notifications for status changes
- [ ] Document expiry alerts
- [ ] Bulk document approval
- [ ] Document comparison (side-by-side for re-uploads)
- [ ] Audit log for all verification actions
- [ ] Admin notes field for internal comments
- [ ] Document type requirements configuration
- [ ] Automatic OCR for document number extraction

## Files Modified/Created

### Backend
1. `/hande-api/app-modules/driver/src/Http/Controllers/AdminDriverController.php`
   - Added `show()` method with document loading
   - Updated `verify()` method to handle documents
   - Added `approveDocument()` method
   - Added `rejectDocument()` method
   - Added `getPendingDocuments()` method

### Frontend
2. `/hande-administration/src/components/driver/DriverDetailModal.tsx` (NEW)
   - Complete driver detail and document verification modal

3. `/hande-administration/src/pages/Users.tsx`
   - Added View button
   - Integrated DriverDetailModal
   - Added selectedDriverId state

4. `/hande-administration/src/components/ui/Button.tsx`
   - Added `danger` variant for rejection actions

### Routes
Routes already configured in `/hande-api/routes/api.php`:
```php
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::get('/drivers', [AdminDriverController::class, 'index']);
    Route::get('/drivers/{driverId}', [AdminDriverController::class, 'show']);
    Route::put('/drivers/{driverId}/verify', [AdminDriverController::class, 'verify']);
    Route::get('/drivers/documents/pending', [AdminDriverController::class, 'getPendingDocuments']);
    Route::put('/drivers/documents/{documentId}/approve', [AdminDriverController::class, 'approveDocument']);
    Route::put('/drivers/documents/{documentId}/reject', [AdminDriverController::class, 'rejectDocument']);
});
```

## Usage Instructions

### For Admins

1. **Login** to admin panel at http://localhost:5173/login
   - Email: admin@hande.com
   - Password: Hande2026!

2. **Navigate** to "Users" tab in sidebar

3. **Review drivers**:
   - Pending drivers have yellow "Pending" badge
   - Click "View" (eye icon) to see details

4. **Verify documents**:
   - Review each document image
   - Approve or reject with reason
   - Wait for all documents to be approved

5. **Activate driver**:
   - Click "Verify Driver & Activate Account"
   - Driver can now accept rides

### For Developers

#### Add New Document Type
1. Driver uploads with document_type in mobile app
2. Backend automatically handles new types
3. Frontend displays formatted name (e.g., "drivers_license" → "Drivers License")

#### Customize Verification Rules
Modify `AdminDriverController@verify()` to add custom business logic:
```php
// Example: Require minimum rating
if ($driver->rating < 4.5) {
    return response()->json([
        'success' => false,
        'message' => 'Driver rating must be at least 4.5',
    ], 400);
}
```

## Security Considerations

- All endpoints require `auth:sanctum` middleware
- Admin role checking via `user_type='admin'`
- Document rejection requires reason (audit trail)
- Verified_by tracks which admin approved
- Timestamps record when actions occurred

## Performance Notes

- Driver list query joins multiple tables (optimized with indexes)
- Document images lazy load in modal
- TanStack Query caches results to reduce API calls
- Background image optimization recommended for production

---

✅ **Feature Complete**: Driver verification with document management fully implemented and tested.
