# Firebase Setup Guide for Developer's Brain Dump

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "devflow-braindump")
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose **Start in production mode** (we'll add rules later)
4. Select location closest to you (e.g., "asia-south1" for India)
5. Click "Enable"

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the Web icon (`</>`) to register a web app
4. Enter app nickname (e.g., "DevFlow Web")
5. **Enable Firebase Hosting** (optional, for deployment later)
6. Copy the Firebase configuration values

## Step 4: Add Environment Variables

Add these to your `.env` file:

```bash
# Gemini API Key (you already have this)
GEMINI_API_KEY=your_existing_key

# Firebase Configuration (from Step 3)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...:web:abc...
```

## Step 5: Set up Firestore Security Rules

In Firestore Database > Rules tab, replace with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Entries collection - open for now (we'll add auth later)
    match /entries/{entryId} {
      allow read, write: if true; // TODO: Add authentication
    }
    
    // Slang dictionary - read for all, write for admins only
    match /slang_dictionary/{slangId} {
      allow read: if true;
      allow write: if false; // Only allow via admin SDK/console
    }
  }
}
```

Click **Publish** to save the rules.

## Step 6: Create Firestore Indexes

Go to Firestore Database > Indexes tab and create these composite indexes:

### Index 1: User Entries (Default sorting)
- Collection: `entries`
- Fields:
  1. `userId` (Ascending)
  2. `createdAt` (Descending)

### Index 2: User Entries by Category
- Collection: `entries`
- Fields:
  1. `userId` (Ascending)
  2. `category` (Ascending)
  3. `createdAt` (Descending)

**Or**, Firestore will prompt you to create these indexes automatically when you run queries. Just click the link in the error message!

## Step 7: Test Connection

1. Restart your dev server: `npm run dev`
2. Open http://localhost:9002
3. Try adding an entry
4. Check Firestore Console > Data tab to see if the entry was saved

## Firestore Collections Structure

### `entries` Collection
```json
{
  "content": "doodh le aana kal tak",
  "translatedContent": "get milk by tomorrow",
  "detectedLanguage": "hinglish",
  "category": "task",
  "tags": ["shopping", "groceries"],
  "dueDate": "2025-12-11",
  "priority": "high",
  "containsSlang": true,
  "slangTerms": [...],
  "confidence": 0.93,
  "userId": "anonymous",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### `slang_dictionary` Collection (Phase 2)
```json
{
  "original": "kar diya",
  "meaning": "completed/done",
  "language": "hinglish",
  "confidence": 0.9,
  "approved": true,
  "usageCount": 15,
  "createdAt": Timestamp
}
```

## Troubleshooting

### Error: "Missing Firebase configuration keys"
- Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are in your `.env` file
- Restart the dev server after adding them

### Error: "Permission denied"
- Check Firestore Security Rules allow writes
- Make sure you published the rules

### Error: "Index not found"
- Firestore will give you a link to create the index
- Click it and wait 1-2 minutes for the index to build

## Next Steps

Once Firebase is set up:
1. ✅ Entries will persist across page refreshes
2. ✅ Real-time updates will work
3. 🚀 Ready for Phase 3: Slang Dictionary System
