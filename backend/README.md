# Aram Office API and MongoDB Atlas

The Express backend serves the frontend and stores documents and staff accounts
in MongoDB Atlas. Run the site through this backend; do not open `index.html`
directly or use a separate static server.

## Configure Atlas

1. In Atlas, create a database user with read/write access and add your current
   IP address to **Network Access**.
2. Copy the cluster connection string from **Connect → Drivers**.
3. In PowerShell, from the project root, install the backend packages and copy
   the environment template:

   ```powershell
   cd "C:\path\to\finalproject1\backend"
   npm install
   Copy-Item .env.example .env
   ```

4. Edit `backend\.env` and set `MONGODB_URI` to your Atlas connection string,
   replace `JWT_SECRET` with a random secret at least 32 characters long, and
   leave `PORT=3000`. URL-encode special characters in the database password.
   Never commit `.env`.

## Run locally

Start the backend from the `backend` folder:

```powershell
npm run dev
```

Open **http://localhost:3000**. The API connection check is at
**http://localhost:3000/api/health**. Keep the terminal open while using the
site.

At first startup, the backend creates the `documents` and `staff` collections
and indexes. The frontend copies its sample documents (or existing browser
document data) to Atlas if the collection is empty. After that, document reads,
adds, edits, version changes, and deletes use Atlas. Staff registration and
login also use Atlas; passwords are hashed on the server.

The three built-in demo accounts use password `Password@123`. They are only for
local project demonstrations; change or remove them before deploying publicly.
