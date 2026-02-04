# Demo Users Setup

This script creates demo users for all roles in the CASE platform.

## Prerequisites

1. Add your Firebase Admin SDK service account key to `firebaseConfig.json` in the root directory
2. Make sure `firebase-admin` is installed (already in package.json)

## Demo User Accounts

The script creates the following demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Citizen | citizen@demo.com | demo123 | Regular citizen user who can report issues |
| Contractor | contractor@demo.com | demo123 | Contractor who receives and completes work orders |
| Class C Officer | officer.c@demo.com | demo123 | Ward-level supervisor |
| Class B Officer | officer.b@demo.com | demo123 | Department head |
| Admin | admin@demo.com | demo123 | City Commissioner with full access |

## How to Run

```bash
npm run create-demo-users
```

Or directly:

```bash
node scripts/createDemoUsers.js
```

## What It Does

1. Creates Firebase Authentication accounts for each demo user
2. Creates corresponding Firestore user documents with role information
3. Sets all accounts as active and email-verified
4. If users already exist, it updates their Firestore documents

## Usage in Login

These demo accounts are automatically shown in the login page under "Show Demo Accounts" for easy testing and demonstration purposes.

## Security Note

These are demo accounts for development and testing only. In production:
- Remove or disable these accounts
- Use strong, unique passwords
- Implement proper user registration flow
- Add email verification for new users

---

**Designed & Developed by Coding Gurus**
