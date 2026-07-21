import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration parameters
const API_KEY = "AIzaSyB_loVHXurGpzSZ25DsVWbmTfYrW-9L1jU";
const PROJECT_ID = "primeconnects";

const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/campaigns`;

function valueToRest(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return { integerValue: val.toString() };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(valueToRest) } };
  }
  if (typeof val === 'object' && val !== null) {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = valueToRest(v);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function docToRest(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'id') continue;
    fields[k] = valueToRest(v);
  }
  return { fields };
}

async function run() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Usage: node scratch/sync_campaigns.js <admin-email> <admin-password>");
    console.error("Or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.");
    process.exit(1);
  }

  console.log(`Authenticating admin user ${email}...`);
  let idToken;
  try {
    const authRes = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const authData = await authRes.json();
    if (authData.error) {
      throw new Error(authData.error.message);
    }
    idToken = authData.idToken;
    console.log("Authentication successful!");
  } catch (err) {
    console.error("Authentication failed:", err.message);
    process.exit(1);
  }

  const dbPath = path.join(__dirname, 'campaigns_database.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found at ${dbPath}`);
    process.exit(1);
  }

  const campaigns = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log(`Loaded ${campaigns.length} campaigns. Beginning sync...`);

  for (const camp of campaigns) {
    const docId = camp.id.trim().toLowerCase();
    const restPayload = docToRest(camp);
    const docUrl = `${FIRESTORE_BASE_URL}/${docId}`;

    try {
      console.log(`- Syncing ${camp.name} (id: ${docId})...`);
      const res = await fetch(docUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(restPayload)
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      console.log(`  Successfully synced!`);
    } catch (err) {
      console.error(`  Failed to sync ${camp.name}:`, err.message);
    }
  }

  console.log("Firestore database sync process complete!");
}

run();
