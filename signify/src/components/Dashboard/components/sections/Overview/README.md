# Overview Page Architecture

## 📁 Directory Structure

```
src/
├── components/
│   └── Dashboard/
│       └── components/
│           └── sections/
│               ├── Overview.js              # Backward compatibility wrapper
│               └── Overview/                # Main Overview implementation
│                   ├── index.js             # Barrel export
│                   ├── OverviewPage.js      # Main component
│                   ├── OverviewPage.css     # Main styles
│                   ├── StatCard.js          # Reusable stat card component
│                   ├── StatCard.css         # Stat card styles
│                   ├── DocumentList.js      # Document list component
│                   ├── DocumentList.css     # Document list styles
│                   ├── ActivityFeed.js      # Activity feed component
│                   ├── ActivityFeed.css     # Activity feed styles
│                   ├── QuickActions.js      # Quick actions component
│                   ├── QuickActions.css     # Quick actions styles
│                   └── useOverviewAPI.js    # Custom API hooks
├── context/
│   └── OverviewContext.js                   # Context for overview state (optional)
└── README.md
```

## 🏗️ Architecture Overview

### Main Component: `OverviewPage.js`
The main component that orchestrates the Overview page. It:
- Fetches data from the backend APIs
- Manages local state for statistics, documents, and activity
- Handles quick action button interactions
- Provides mock data fallback for development

**Key Features:**
- Responsive grid layout (2 columns on desktop, 1 on mobile)
- Error handling with fallback mock data
- Loading states for data fetching
- Clean separation of concerns with child components

### Sub-Components

#### 1. **StatCard.js**
Reusable component for displaying statistics with icons and trends.
```javascript
<StatCard
  icon={FileText}
  value={stats.totalDocuments}
  label="Documents"
  trend={{ direction: 'up', icon: '↑', text: '2 this week' }}
/>
```

#### 2. **DocumentList.js**
Displays a list of recent documents with status indicators.
- Shows file icon, name, modification date, and status
- Supports loading and empty states
- Status badges: signed, pending, rejected
- Time formatting (e.g., "2 days ago")

#### 3. **ActivityFeed.js**
Shows recent user activity with color-coded type indicators.
- Activity types: document_uploaded, document_signed, signature_created, document_shared, action_required
- Time display with smart formatting
- Loading and empty states

#### 4. **QuickActions.js**
Button group for quick access to common actions.
- Upload Document
- Use Template
- Share Document
- Responsive design (text hidden on mobile)

### Custom Hooks: `useOverviewAPI.js`

#### `useFetchOverviewStats()`
Fetches user statistics (documents, signatures, shared, completion rate).
```javascript
const { fetchStats } = useFetchOverviewStats();
const stats = await fetchStats();
```

#### `useFetchRecentDocuments()`
Retrieves recent documents with optional limit.
```javascript
const { fetchDocuments } = useFetchRecentDocuments();
const docs = await fetchDocuments(5);
```

#### `useFetchActivity()`
Gets recent activity log entries.
```javascript
const { fetchActivity } = useFetchActivity();
const activities = await fetchActivity(10);
```

#### `useUploadDocument()`
Handles document file uploads.
```javascript
const { uploadDocument } = useUploadDocument();
await uploadDocument(file, { /* metadata */ });
```

### Context (Optional): `OverviewContext.js`
Global context for managing overview state across multiple components. Provides:
- `stats` - Overview statistics
- `recentDocuments` - Recent document list
- `activity` - Activity feed data
- `loading` - Loading state
- `error` - Error messages
- `refetchData()` - Function to refresh all data

## 🔗 API Endpoints

### Backend Routes (server/index.js)

#### Get Overview Statistics
```
GET /api/overview/stats
Authorization: Bearer {token}
Response: { totalDocuments, totalSignatures, sharedDocuments, completionRate }
```

#### Get Recent Documents
```
GET /api/documents/recent?limit=5
Authorization: Bearer {token}
Response: [{ name, fileName, status, modifiedAt, ... }]
```

#### Get Activity Log
```
GET /api/activity?limit=10
Authorization: Bearer {token}
Response: [{ type, title, description, details, timestamp, ... }]
```

#### Upload Document
```
POST /api/documents/upload
Authorization: Bearer {token}
Body: { name, fileName, fileType, size }
Response: { _id, userId, name, status, ... }
```

#### Share Document
```
POST /api/documents/:documentId/share
Authorization: Bearer {token}
Body: { shareWithEmail }
Response: { ... document with updated sharedWith array }
```

#### Update Document Status
```
PATCH /api/documents/:documentId/status
Authorization: Bearer {token}
Body: { status: 'signed' | 'pending' | 'rejected' | 'draft' }
Response: { ... updated document }
```

## 📊 Data Models

### Document Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  fileName: String,
  fileType: String (default: 'pdf'),
  size: Number,
  status: String ('pending' | 'signed' | 'rejected' | 'draft'),
  uploadedAt: Date,
  modifiedAt: Date,
  createdAt: Date,
  sharedWith: [ObjectId]
}
```

### Activity Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String ('document_uploaded' | 'document_signed' | 'signature_created' | 'document_shared' | 'action_required'),
  title: String,
  description: String,
  details: String,
  relatedDocumentId: ObjectId,
  timestamp: Date,
  createdAt: Date
}
```

## 🎨 Styling Approach

### Design System
- **Primary Color**: #0066ff (Blue)
- **Secondary Color**: #f0f5ff (Light Blue)
- **Text Colors**: #1a1a1a (Dark), #666 (Medium), #999 (Light)
- **Border Color**: #e0e0e0
- **Success**: #10b981 (Green)
- **Warning**: #ff8c00 (Orange)
- **Error**: #ef4444 (Red)

### Responsive Breakpoints
- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: 480px - 767px
- **Small Mobile**: < 480px

Each component has responsive CSS with proper media queries for smooth adaptation across device sizes.

## 🚀 Usage

### Basic Integration
```javascript
import Dashboard from './components/Dashboard/Dashboard';

function App() {
  return (
    <Dashboard user={user} onLogout={handleLogout} />
  );
}
```

The Overview page is automatically rendered when `activeSection === 'overview'` in the Dashboard.

### Using Context (Optional)
```javascript
import { OverviewProvider, useOverviewContext } from './context/OverviewContext';

function App() {
  return (
    <OverviewProvider userId={user.id}>
      <Dashboard user={user} />
    </OverviewProvider>
  );
}

// In any component:
function MyComponent() {
  const { stats, loading, refetchData } = useOverviewContext();
  return <div>{stats.totalDocuments}</div>;
}
```

## 🔄 Data Flow

```
OverviewPage
├── useEffect: Fetch all data on mount
│   ├── fetchStats() → GET /api/overview/stats
│   ├── fetchDocuments() → GET /api/documents/recent
│   └── fetchActivity() → GET /api/activity
├── State Update
│   ├── setStats()
│   ├── setRecentDocuments()
│   └── setActivity()
├── Render Components
│   ├── StatCard (4 instances)
│   ├── DocumentList
│   ├── QuickActions
│   └── ActivityFeed
└── Error Handling (fallback to mock data)
```

## 📝 Development Notes

### Fallback Mock Data
The component includes fallback mock data for development. When API calls fail, it displays realistic sample data so you can continue development without a backend.

### Error Handling
- API errors are caught and logged
- User-friendly error banner is displayed
- Mock data is used as fallback
- Graceful degradation ensures app remains functional

### Performance Optimizations
- Parallel API requests using `Promise.all()`
- Loading and empty states prevent layout shift
- Memoization potential in custom hooks
- CSS animations use efficient transforms

### Future Enhancements
- Implement real-time updates using WebSockets
- Add filtering and sorting for documents
- Implement pagination for large data sets
- Add document preview modals
- Integrate with activity timeline
- Add search functionality

## 🐛 Troubleshooting

### Data Not Loading
1. Check browser console for errors
2. Verify API endpoints are running on port 5000
3. Check MongoDB connection
4. Verify JWT token is valid
5. Check CORS configuration

### Styling Issues
- Clear browser cache
- Check responsive breakpoints
- Verify Lucide React icons are installed
- Check CSS import paths

### Component Issues
- Verify all props are passed correctly
- Check context provider is wrapping components
- Verify custom hooks are called at top level
- Check useEffect dependencies

## 📚 Additional Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Lucide React Icons](https://lucide.dev/)
- [MongoDB Schema Design](https://docs.mongodb.com/manual/core/data-models/)
- [JWT Authentication](https://jwt.io/)
