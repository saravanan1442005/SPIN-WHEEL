# 💕 Couple's Snack Spinner - Firebase Setup Guide

## 🚀 Getting Started

This app uses Firebase for authentication and real-time database. Follow these steps to set it up:

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `snack-spinner` (or your choice)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Enable **Email/Password** sign-in method
4. (Optional) Enable **Google** sign-in method for easier login

### Step 3: Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select your preferred location
5. Click **"Enable"**

### Step 4: Set Firestore Security Rules

**IMPORTANT**: You must update your Firestore security rules to allow friend requests to work.

Go to the **"Rules"** tab in Firestore and replace everything with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users Collection
    match /users/{userId} {
      // Allow reading any user profile (needed for searching by email)
      allow read: if request.auth != null;
      // Allow write only by the owner
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Friend Requests Collection
    match /requests/{requestId} {
      // Allow creating a request if authenticated
      allow create: if request.auth != null && request.resource.data.fromUserId == request.auth.uid;
      
      // Allow reading and deleting if you are the sender OR the receiver
      allow read, delete: if request.auth != null && (
        resource.data.fromUserId == request.auth.uid || 
        resource.data.toUserId == request.auth.uid
      );
    }
    
    // Couples Collection
    match /couples/{coupleId} {
      // Allow creating a new couple
      allow create: if request.auth != null;
      
      // Allow reading if authenticated
      allow read: if request.auth != null;
      
      // Allow updating if authenticated
      allow update: if request.auth != null;
      
      // Allow delete if authenticated
      allow delete: if request.auth != null;
    }
    
    // Couple members can read/write snacks
    match /couples/{coupleId}/snacks/{snackId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coupleId == coupleId;
    }
    
    // Couple members can read/write spins
    match /couples/{coupleId}/spins/{spinId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coupleId == coupleId;
    }
  }
}
```

### Step 5: Get Your Firebase Config

1. Click the **⚙️ gear icon** next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **</>** (web) icon
5. Register your app with a nickname: `Snack Spinner Web`
6. Copy the `firebaseConfig` object

### Step 6: Update Your App

1. Open `src/firebase.js`
2. Replace the placeholder config with your actual Firebase config

### Step 7: Run the App

```bash
npm run dev
```
