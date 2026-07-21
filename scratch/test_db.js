const url = "https://firestore.googleapis.com/v1/projects/primeconnects/databases/(default)/documents/users?pageSize=100";

async function run() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.documents) {
      console.log("No documents found or error:", data);
      return;
    }
    console.log(`Found ${data.documents.length} users:`);
    for (const doc of data.documents) {
      const path = doc.name;
      const fields = doc.fields || {};
      const uid = path.split("/").pop();
      const name = fields.name?.stringValue || "N/A";
      const email = fields.email?.stringValue || "N/A";
      const referralPath = fields.referralPath?.arrayValue?.values?.map(v => v.stringValue) || [];
      const parentUserId = fields.parentUserId?.stringValue || "N/A";
      const sponsorUid = fields.sponsor?.mapValue?.fields?.uid?.stringValue || "N/A";
      console.log(`- UID: ${uid} | Name: ${name} | Email: ${email} | parentUserId: ${parentUserId} | sponsorUid: ${sponsorUid} | referralPath:`, referralPath);
    }
  } catch (err) {
    console.error("Error fetching Firestore REST:", err);
  }
}

run();
