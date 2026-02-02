# 💕 Couple's Snack Spinner - Firebase Setup Guide

## 🚀 Getting Started

This app uses Firebase for authentication and real-time database

. Follow these steps to set it up:

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

Go to the **"Rules"** tab in Firestore and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Couple members can read/write couple data
    match /couples/{coupleId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coupleId == coupleId;
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
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 7: Run the App

```bash
npm run dev
```

## 🎯 How It Works

### For You and Your Girlfriend:

1. **Both Sign Up** - Each person creates an account
2. **Connect Together** - Once logged in, connect with each other using a unique couple code
3. **Share the Wheel** - Both can add/remove snacks from the shared wheel
4. **Spin & Notify** - When one person spins, the other gets notified with the result!

### Features:

- ✅ **Real-time Sync** - Changes appear instantly for both
- ✅ **Shared Snack Library** - Both can manage the snacks
- ✅ **Spin Notifications** - Get notified when your partner spins
- ✅ **Spin History** - See past spins and results
- ✅ **Secure** - Firebase security rules protect your data

## 📱 Database Structure

```
users/
  {userId}/
    - uid
    - email
    - displayName
    - coupleId
    - createdAt

couples/
  {coupleId}/
    - user1Id
    - user2Id
    - user1Name
    - user2Name
    - createdAt
    
    snacks/
      {snackId}/
        - id
        - name
        - price
        - active (boolean)
        - createdBy
        - createdAt
    
    spins/
      {spinId}/
        - snackName
        - price
        - spinnedBy
        - spinnedByName
        - timestamp
```

## 🔒 Security

- All data is protected by Firebase security rules
- Only authenticated users can access data
- Users can only access their couple's data
- Partner connection requires mutual agreement

## 💝 Enjoy!

Now you and your girlfriend can decide on snacks together, no matter where you are! 🍿✨

---

Made with ❤️ for couples who can't decide what to eat
