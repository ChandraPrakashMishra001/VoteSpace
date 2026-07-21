# 🗳️ VoteSpace

A beautiful friend voting system — create polls on any topic, share a 6-char code, and reveal results together.

---

## 🚀 Quick Setup (5 minutes)

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. **Create a project** → give it a name → Continue
3. On the dashboard, click the **`</>`** (Web) icon → Register app → copy the config
4. Go to **Build → Firestore Database** → Create database → Start in **Test mode** → Pick a region → Done

### 2. Add Your Config
Open `js/firebase-config.js` and replace the placeholder values:
```js
const firebaseConfig = {
  apiKey:            "your-actual-api-key",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId:             "your-app-id"
};
```

### 3. Run the App
Open `index.html` in your browser — or use a local server:

```bash
# If you have Python 3 installed:
python -m http.server 8080
# Then visit: http://localhost:8080

# Or with Node.js:
npx serve .
```

> ⚠️ Firebase won't work if you open HTML files directly via `file://`. Use a local server.

---

## 📁 File Structure

```
voting system/
├── index.html          ← Dashboard / landing page
├── create.html         ← 5-step poll creation wizard
├── vote.html           ← Voting page (?code=XXXXXX)
├── results.html        ← Live results page (?code=XXXXXX)
├── css/
│   ├── main.css        ← Design system (tokens, reset, typography)
│   ├── components.css  ← All UI components
│   └── animations.css  ← Keyframes & animation utilities
├── js/
│   ├── firebase-config.js  ← 🔧 EDIT THIS with your Firebase creds
│   ├── app.js          ← URL helpers, countdown
│   ├── store.js        ← Firebase CRUD + localStorage
│   ├── polls.js        ← Poll utilities & validation
│   ├── vote.js         ← Vote state, drag-drop ranked
│   ├── results.js      ← Results calculator & chart renderer
│   └── ui.js           ← Toast, modal, confetti, copy, counters
├── firestore.rules     ← Firebase security rules
└── README.md           ← This file
```

---

## 🎯 How It Works

### Creating a Poll
1. Click **+ Create Poll**
2. Fill in the 5-step wizard:
   - **Topic**: Title, description, your name
   - **Type**: Single, Multiple, Ranked, or Yes/No
   - **Options**: Add up to 10 choices
   - **Settings**: Set a timer (optional)
   - **Share**: Copy the 6-char code or direct link

### Voting
- Friends open the vote link or enter the code at the home page
- They optionally enter their name (leave blank = Anonymous)
- They pick their choice(s) and submit
- Each person can only vote once (tracked via browser fingerprint)

### Results
- Results are **hidden** while the poll is open
- Once you (the creator) **close the poll** (or the timer runs out), results are revealed to everyone
- Animated bar charts show percentages, vote counts, and the winner

---

## 🗳️ Poll Types

| Type | Description | Voting UI |
|------|-------------|-----------|
| **Single Choice** | Pick exactly one option | Radio buttons |
| **Multiple Choice** | Select all that apply | Checkboxes |
| **Ranked** | Order options by preference | Drag & drop (or ▲▼ on mobile) |
| **Yes / No** | Binary decision | Large YES / NO cards |

---

## 🔒 Firestore Rules

Apply `firestore.rules` in your Firebase Console:
1. Go to **Firestore Database → Rules**
2. Paste the contents of `firestore.rules`
3. Click **Publish**

---

## 💡 Tips

- **Sharing**: The 6-char code works across any device. Just enter it on the home page.
- **Anonymous voting**: Voters leave the name field blank — they appear as "🎭 Anonymous"
- **Closing a poll**: As the creator, you see a "Close Poll" button on the results page. This reveals results to everyone.
- **Timer**: Set a duration in Step 4 of the wizard. The poll auto-closes when it expires.

---

Made with 💜 — VoteSpace
