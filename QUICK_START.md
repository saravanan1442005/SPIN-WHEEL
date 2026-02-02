# ⚡ QUICK START - 2 Minutes Setup

## 🔥 Your App is Running!

Dev server is live. Check your terminal for the URL (usually `http://localhost:5174`)

---

## ✅ BEFORE YOU CAN USE IT:

### 1️⃣ Enable Google Sign-In (1 minute)

1. Open: https://console.firebase.google.com/
2. Click your "snack-spinner" project
3. Go to **Authentication** → **Sign-in method**
4. Click **Google** → Toggle **Enable** → **Save**

### 2️⃣ Set Firestore Rules (30 seconds)

1. Go to **Firestore Database** → **Rules** tab
2. Replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /couples/{coupleId} {
      allow read, write: if request.auth != null;
    }
    match /couples/{coupleId}/snacks/{snackId} {
      allow read, write: if request.auth != null;
    }
    match /couples/{coupleId}/spins/{spinId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

---

## 🎉 DONE! Now Use the App:

### You:
1. Sign in with Google
2. Click "Generate Code"  
3. Copy the code
4. Send it to your girlfriend

### Your Girlfriend:
1. Sign in with Google
2. Click "Enter Code"
3. Paste your code
4. Click "Connect"

### Together:
- Add snacks
- Spin the wheel
- Get notified of each other's results! 💕

---

## 📖 Full Documentation:

- `README.md` - Complete overview
- `COMPLETE_GUIDE.md` - Detailed user guide
- `FIREBASE_SETUP.md` - Technical setup

**Enjoy! 🍿✨**
