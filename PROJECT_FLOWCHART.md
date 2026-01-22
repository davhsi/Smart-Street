# Smart Street - Complete System Flowchart (PIN-BASED MODEL)

```mermaid
graph TB
    Start([User Accesses System]) --> AuthCheck{Authenticated?}
    
    AuthCheck -->|No| PublicFlow[Public Access]
    AuthCheck -->|Yes| RoleCheck{Role?}
    
    %% Public Flow
    PublicFlow --> PublicMap[Public Map<br/>Browse Approved Vendors]
    PublicFlow --> VerifyPage[Verify Permit<br/>QR Code Validation]
    PublicMap --> SearchVendors[Search Vendors<br/>Filter by Category]
    VerifyPage --> VerifyResult{Valid?}
    VerifyResult -->|Yes| ShowValid[Display Permit Details]
    VerifyResult -->|No| ShowInvalid[Display Error]
    
    %% Role-Based Flows
    RoleCheck -->|VENDOR| VendorFlow[Vendor Dashboard]
    RoleCheck -->|OWNER| OwnerFlow[Owner Dashboard]
    RoleCheck -->|ADMIN| AdminFlow[Admin Dashboard]
    
    %% Vendor Flow (PIN + DIMENSIONS ONLY)
    VendorFlow --> VendorActions{Vendor Actions}
    VendorActions --> ViewSpaces[View Available Spaces]
    VendorActions --> SubmitRequest[Submit Request<br/>Pin + Width + Length + Time]
    VendorActions --> ViewRequests[View Request History]
    VendorActions --> ViewPermits[View Issued Permits + QR]
    
    SubmitRequest --> SelectSpace[Select Space]
    SelectSpace --> DropPin[Drop Pin on Map<br/>(lat, lng)]
    DropPin --> EnterDims[Enter max_width & max_length]
    EnterDims --> SelectTime[Select Start/End Time]
    SelectTime --> PreviewArea[Preview Circle/Box<br/>(visual only)]
    PreviewArea --> ValidateRequest{Backend Validation}
    
    ValidateRequest -->|Radius Check| RadiusValidation[Check Pin Within<br/>Owner allowed_radius]
    ValidateRequest -->|Conflict Check| ConflictCheck[Check Spatial + Temporal<br/>Overlaps with APPROVED]
    
    RadiusValidation -->|Fail| RejectReq[Return Error]
    ConflictCheck -->|Conflict Found| RejectReq
    ConflictCheck -->|No Conflict| CreateReq[Create Request<br/>Status: PENDING]
    
    CreateReq --> RequestPending[Request in Queue<br/>Awaiting Admin Review]
    
    ViewRequests --> RequestStatus{Status?}
    RequestStatus -->|PENDING| ShowPending[Show Pending Request]
    RequestStatus -->|APPROVED| ShowApproved[Show Approved Request]
    RequestStatus -->|REJECTED| ShowRejected[Show Rejected + Remarks]
    
    ViewPermits --> DisplayQR[Display Permit QR Code]
    
    %% Owner Flow (PIN + RADIUS ONLY)
    OwnerFlow --> OwnerActions{Owner Actions}
    OwnerActions --> CreateSpace[Create Space<br/>Pin + allowed_radius]
    OwnerActions --> ViewSpacesOwned[View Owned Spaces]
    OwnerActions --> ViewIncomingRequests[View Incoming Requests]
    
    CreateSpace --> DropSpacePin[Drop Pin on Map]
    DropSpacePin --> SetRadius[Set allowed_radius (m)]
    SetRadius --> SaveSpace[Save Space<br/>center POINT + radius]
    
    ViewIncomingRequests --> RequestList[View Requests<br/>For Owned Spaces]
    
    %% Admin Flow
    AdminFlow --> AdminActions{Admin Actions}
    AdminActions --> ReviewRequests[Review Pending Requests]
    AdminActions --> ViewPermitsAdmin[View All Issued Permits]
    AdminActions --> ViewAuditLogs[View Audit Logs]
    
    ReviewRequests --> SelectRequest[Select Request]
    SelectRequest --> ViewMapOverlay[View Pin + Radius<br/>With Conflicts]
    ViewMapOverlay --> AdminDecision{Decision?}
    
    AdminDecision -->|Approve| ApprovalProcess[Approval Process]
    AdminDecision -->|Reject| RejectionProcess[Rejection Process]
    
    ApprovalProcess --> LockRequest[Lock Request<br/>SELECT FOR UPDATE]
    LockRequest --> RecheckConflicts[Re-check Conflicts<br/>Inside Transaction]
    RecheckConflicts -->|Conflict Found| RejectApproval[Reject Approval<br/>Rollback Tx]
    RecheckConflicts -->|No Conflict| UpdateStatus[Update Request<br/>Status: APPROVED]
    UpdateStatus --> GenerateQR[Generate QR Payload<br/>permit_id, request_id,...]
    GenerateQR --> CreatePermit[Create Permit Record<br/>Status: VALID]
    CreatePermit --> LogAudit[Log Audit Entry<br/>APPROVE_REQUEST]
    LogAudit --> CommitTx[Commit Transaction]
    
    RejectionProcess --> UpdateRejected[Update Request<br/>Status: REJECTED]
    UpdateRejected --> AddRemarks[Add Admin Remarks]
    AddRemarks --> LogRejectAudit[Log Audit Entry<br/>REJECT_REQUEST]
    
    ViewPermitsAdmin --> DisplayAllPermits[Display All Permits<br/>with QR Codes]
    
    %% Database (PIN + DIMENSIONS ONLY)
    subgraph Database[PostgreSQL + PostGIS (Pin-Based)]
        UsersTable[(users<br/>user_id UUID, email, role)]
        SpacesTable[(spaces<br/>space_id UUID,<br/>center POINT, allowed_radius)]
        RequestsTable[(space_requests<br/>request_id UUID,<br/>center POINT, max_width, max_length, status)]
        PermitsTable[(permits<br/>permit_id UUID, qr_payload, status)]
        AuditTable[(audit_logs<br/>log_id UUID, admin_id, action)]
        
        UsersTable -->|1:N (OWNER)| SpacesTable
        UsersTable -->|1:N (VENDOR)| RequestsTable
        SpacesTable -->|1:N| RequestsTable
        RequestsTable -->|1:1| PermitsTable
        UsersTable -->|1:N (ADMIN)| AuditTable
    end
    
    %% API Endpoints
    subgraph BackendAPI[Backend API Routes]
        AuthAPI[/api/auth<br/>POST /register<br/>POST /login<br/>GET /me]
        VendorAPI[/api/vendor<br/>GET /spaces<br/>POST /requests<br/>GET /requests<br/>GET /permits]
        OwnerAPI[/api/owner<br/>POST /spaces<br/>GET /spaces<br/>GET /requests]
        AdminAPI[/api/admin<br/>GET /requests<br/>POST /requests/:id/approve<br/>POST /requests/:id/reject<br/>GET /permits<br/>GET /audit-logs]
        PublicAPI[/api/public<br/>GET /vendors<br/>POST /verify-permit]
    end
    
    %% Frontend Pages
    subgraph Frontend[React Frontend]
        LoginPage[Login]
        RegisterPage[Register]
        VendorPage[VendorDashboard<br/>(Pin + Dimensions)]
        OwnerPage[OwnerDashboard<br/>(Pin + Radius)]
        AdminPage[AdminDashboard]
        PublicPage[PublicMap]
        VerifyPage[VerifyPermit]
        UnauthorizedPage[Unauthorized]
    end
    
    %% Business Rules
    subgraph BusinessRules[Business Rules - Backend Enforced]
        Rule1[All requests start as PENDING]
        Rule2[Only ADMIN can approve/reject]
        Rule3[Approval generates exactly ONE permit]
        Rule4[No spatial + temporal overlap<br/>with APPROVED requests]
        Rule5[Rejected requests never generate permits]
        Rule6[Public sees only APPROVED<br/>vendors with VALID permits]
        Rule7[QR verification validates<br/>signature, status, time window]
        Rule8[Frontend never sends geometry,<br/>only lat, lng, width, length]
    end
    
    %% Styling
    classDef publicClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef vendorClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef ownerClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef adminClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef dbClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef apiClass fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    
    class PublicFlow,PublicMap,VerifyPage,SearchVendors publicClass
    class VendorFlow,VendorActions,SubmitRequest,ViewRequests,ViewPermits vendorClass
    class OwnerFlow,OwnerActions,CreateSpace,ViewSpacesOwned ownerClass
    class AdminFlow,AdminActions,ReviewRequests,ApprovalProcess,RejectionProcess adminClass
    class Database,UsersTable,SpacesTable,RequestsTable,PermitsTable dbClass
    class BackendAPI,AuthAPI,VendorAPI,OwnerAPI,AdminAPI,PublicAPI apiClass
```

## System Architecture Summary

### Authentication & Authorization
- **JWT-based authentication** with role-based access control
- **Three roles**: VENDOR, OWNER, ADMIN
- **Protected routes** enforce role requirements

### Core Workflows (PIN-BASED MODEL)

1. **Vendor Workflow**
   - Register → Login → View Spaces → Drop Pin + Enter Dimensions → Submit Request → Track Status → View Permits (QR)

2. **Owner Workflow**
   - Register → Login → Drop Pin + Set Radius → Create Space → View Incoming Requests

3. **Admin Workflow**
   - Login → Review Pending Requests → View Pin + Radius Overlays → Approve/Reject → View Permits → Audit Logs

4. **Public Workflow**
   - Browse Approved Vendors (pins on map) → Search → Verify Permits

### Key Technical Features

- **PIN-BASED SPATIAL MODEL**: All locations use single pin (lat, lng) + numeric dimensions
- **Server-Side Geometry**: PostGIS converts pin + dimensions to geometry using `ST_Buffer(point, radius)` or `ST_MakeEnvelope`
- **PostGIS Spatial Queries**: `ST_DWithin` for point+radius distance checks
- **Transaction Safety**: `SELECT FOR UPDATE` prevents race conditions in approvals
- **QR Code Generation**: JWT-signed payloads (permit_id, request_id, vendor_id, start_time, end_time)
- **Audit Logging**: All admin actions logged with IP addresses
- **Conflict Detection**: Spatial overlap (center + radius) + temporal overlap checks before approval
- **No Polygon Drawing**: Frontend never sends geometry, only lat/lng/dimensions

### Database Schema (PIN-BASED)

- **UUID Primary Keys**: All tables use UUID instead of BIGSERIAL
- **GEOGRAPHY(POINT)**: Spaces and requests use `center POINT` instead of `geometry POLYGON`
- **FLOAT8 Dimensions**: `allowed_radius` (meters) for spaces, `max_width`/`max_length` (meters) for requests
- **GIST Indexes**: Spatial indexes on `center` columns for fast distance queries

### API Endpoints

- **Auth**: 3 endpoints (register, login, me)
- **Vendor**: 4 endpoints (spaces, requests POST/GET, permits)
  - POST /requests accepts: `spaceId`, `lat`, `lng`, `maxWidth`, `maxLength`, `startTime`, `endTime`
- **Owner**: 3 endpoints (spaces POST/GET, requests)
  - POST /spaces accepts: `spaceName`, `address`, `lat`, `lng`, `allowedRadius`
- **Admin**: 5 endpoints (requests GET, approve, reject, permits, audit-logs)
- **Public**: 2 endpoints (vendors, verify-permit)

### Frontend Pages

- **7 main pages**: Login, Register, VendorDashboard, OwnerDashboard, AdminDashboard, PublicMap, VerifyPermit
- **Map integration**: Leaflet for **pin placement** and **circle visualization** (NO polygon drawing)
- **QR rendering**: qrcode.react for permit display
- **Role-based routing**: Automatic redirects based on user role

### Spatial Model Details

1. **Owner Creates Space**:
   - Drops pin on map → Enters `allowed_radius` (meters)
   - Backend stores: `center GEOGRAPHY(POINT, 4326)`, `allowed_radius FLOAT8`

2. **Vendor Submits Request**:
   - Selects space → Drops pin → Enters `max_width` & `max_length` (meters) → Selects time window
   - Backend validates:
     - Pin within space radius: `ST_DWithin(request_center, space_center, space_radius - request_radius)`
     - No conflicts: Check other APPROVED requests using `ST_DWithin` + time overlap

3. **Admin Reviews**:
   - Sees space circle (green) + request pin + request circle (blue) + conflict circles (red)
   - Approves → Server generates permit with signed QR payload

4. **Public View**:
   - Sees approved vendor pins + optional radius circles
   - Can verify permits using QR code data
