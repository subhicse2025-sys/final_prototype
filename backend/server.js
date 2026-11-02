"use strict";

const path = require("node:path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: path.join(__dirname, "\.env") });

const app = express();
const projectRoot = path.join(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET;
const mongoUri = process.env.MONGODB_URI;

app.use(express.json({ limit: "2mb" }));

let database;
let staffCollection;
let documentsCollection;

const demoStaff = [
  {
    id: "EMP-REV-1042",
    name: "Thiru. S. Ramanathan, M.A.",
    email: "ramanathan.rev@aram.tn.gov.in",
    password: "Password@123",
    department: "Revenue Department",
    designation: "Tahsildar & Executive Magistrate",
    proofType: "Government Service Identity Card",
    proofFileName: "Govt_ID_Ramanathan_REV1042.pdf",
    verificationStatus: "Verified",
    verificationToken: "GOV-TN-AUTH-2024-9841",
    registeredAt: "2024-01-10"
  },
  {
    id: "EMP-HLT-2019",
    name: "Dr. K. Meenakshi, MBBS, DPH",
    email: "meenakshi.dph@aram.tn.gov.in",
    password: "Password@123",
    department: "Health Department",
    designation: "Deputy Director of Health Services",
    proofType: "Gazetted Medical Officer Card",
    proofFileName: "Dr_Meenakshi_Gazette_ID.pdf",
    verificationStatus: "Verified",
    verificationToken: "GOV-TN-AUTH-2024-7729",
    registeredAt: "2024-02-14"
  },
  {
    id: "EMP-EDU-3088",
    name: "Tmt. P. Vasanthi, M.Sc., M.Ed.",
    email: "vasanthi.deo@aram.tn.gov.in",
    password: "Password@123",
    department: "Education Department",
    designation: "District Educational Officer (DEO)",
    proofType: "Education Department Service Register",
    proofFileName: "DEO_Service_Book_Copy.pdf",
    verificationStatus: "Verified",
    verificationToken: "GOV-TN-AUTH-2024-6310",
    registeredAt: "2024-03-01"
  }
];

function publicStaff(staff) {
  const { passwordHash, _id, ...safeStaff } = staff;
  return safeStaff;
}

function createToken(staff) {
  return jwt.sign({ sub: staff.id }, jwtSecret, { expiresIn: "8h" });
}

function requireStaff(req, res, next) {
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) {
    return res.status(401).json({ error: "Sign in is required for this action." });
  }
  try {
    req.staffId = jwt.verify(token, jwtSecret).sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Your session expired. Please sign in again." });
  }
}

function validateDocument(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }
  const { id, title, type, department, category, importance, keywords, content, versions } = input;
  if (
    typeof id !== "string" || !id.trim() || id.length > 80 ||
    typeof title !== "string" || !title.trim() ||
    typeof type !== "string" ||
    typeof department !== "string" ||
    typeof category !== "string" ||
    typeof importance !== "string" ||
    !Array.isArray(keywords) || !keywords.every(keyword => typeof keyword === "string") ||
    typeof content !== "string" ||
    !Array.isArray(versions)
  ) {
    return null;
  }
  return {
    id: id.trim().toUpperCase(),
    title: title.trim(),
    type,
    department,
    category,
    importance,
    keywords,
    content,
    versions
  };
}

app.get("/api/health", async (req, res) => {
  await database.command({ ping: 1 });
  res.json({ connected: true, database: database.databaseName });
});

app.get("/api/documents", async (req, res) => {
  const documents = await documentsCollection.find({}, { projection: { _id: 0 } }).sort({ id: 1 }).toArray();
  res.json(documents);
});

app.post("/api/documents/bootstrap", async (req, res) => {
  if (await documentsCollection.countDocuments() !== 0) {
    return res.status(409).json({ error: "The document collection has already been initialized." });
  }
  if (!Array.isArray(req.body) || req.body.length === 0 || req.body.length > 1000) {
    return res.status(400).json({ error: "A valid non-empty document list is required." });
  }
  const documents = req.body.map(validateDocument);
  const ids = new Set();
  if (documents.some(document => {
    if (!document || ids.has(document.id)) return true;
    ids.add(document.id);
    return false;
  })) {
    return res.status(400).json({ error: "The initial document list contains invalid data." });
  }
  try {
    await documentsCollection.insertMany(documents, { ordered: true });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "The initial document list contains duplicate IDs." });
    }
    throw error;
  }
  res.status(201).json({ inserted: documents.length });
});

app.post("/api/documents", requireStaff, async (req, res) => {
  const document = validateDocument(req.body);
  if (!document) {
    return res.status(400).json({ error: "The document data is incomplete or invalid." });
  }
  try {
    await documentsCollection.insertOne(document);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: `Document ID "${document.id}" already exists.` });
    }
    throw error;
  }
  res.status(201).json(document);
});

app.put("/api/documents/:id", requireStaff, async (req, res) => {
  const document = validateDocument(req.body);
  if (!document || document.id !== req.params.id.toUpperCase()) {
    return res.status(400).json({ error: "The document data is incomplete or invalid." });
  }
  const result = await documentsCollection.replaceOne({ id: document.id }, document);
  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Document not found." });
  }
  res.json(document);
});

app.delete("/api/documents/:id", requireStaff, async (req, res) => {
  const result = await documentsCollection.deleteOne({ id: req.params.id.toUpperCase() });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Document not found." });
  }
  res.status(204).end();
});

app.post("/api/auth/register", async (req, res) => {
  const { id, name, email, password, department, designation, proofType, proofFileName } = req.body || {};
  if (
    typeof id !== "string" || !id.trim() ||
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" || password.length < 6 ||
    typeof department !== "string" || !department ||
    typeof designation !== "string" || !designation.trim()
  ) {
    return res.status(400).json({ error: "Please provide valid staff details and a password of at least 6 characters." });
  }

  const normalizedId = id.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  const existingStaff = await staffCollection.findOne({
    $or: [{ id: normalizedId }, { email: normalizedEmail }]
  });
  if (existingStaff) {
    return res.status(409).json({ error: "That Employee ID or official email is already registered." });
  }

  const staff = {
    id: normalizedId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    department,
    designation: designation.trim(),
    proofType: typeof proofType === "string" ? proofType : "",
    proofFileName: typeof proofFileName === "string" ? proofFileName : "",
    verificationStatus: "Verified",
    verificationToken: `GOV-TN-AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
    registeredAt: new Date().toISOString().slice(0, 10)
  };

  try {
    await staffCollection.insertOne(staff);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "That Employee ID or official email is already registered." });
    }
    throw error;
  }
  res.status(201).json({ token: createToken(staff), staff: publicStaff(staff) });
});

app.post("/api/auth/login", async (req, res) => {
  const identifier = typeof req.body?.identifier === "string" ? req.body.identifier.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!identifier || !password) {
    return res.status(400).json({ error: "Employee ID/email and password are required." });
  }
  const staff = await staffCollection.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { id: identifier.toUpperCase() }
    ]
  });
  if (!staff || !(await bcrypt.compare(password, staff.passwordHash))) {
    return res.status(401).json({ error: "Invalid Employee ID/email or password." });
  }
  res.json({ token: createToken(staff), staff: publicStaff(staff) });
});

app.get("/api/auth/me", requireStaff, async (req, res) => {
  const staff = await staffCollection.findOne({ id: req.staffId });
  if (!staff) {
    return res.status(401).json({ error: "Staff account not found. Please sign in again." });
  }
  res.json(publicStaff(staff));
});

app.use("/css", express.static(path.join(projectRoot, "css")));
app.use("/js", express.static(path.join(projectRoot, "js")));
app.get("/", (req, res) => res.sendFile(path.join(projectRoot, "index.html")));
app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found." }));

app.use((error, req, res, next) => {
  console.error("Request failed:", error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "The server could not complete the request." });
});

let initializationPromise;

async function initialize() {
  if (initializationPromise) return initializationPromise;
  initializationPromise = (async () => {
  if (!mongoUri || !jwtSecret || jwtSecret.length < 32) {
    throw new Error("Set MONGODB_URI and a JWT_SECRET of at least 32 characters in backend/.env.");
  }
  const client = new MongoClient(mongoUri);
  await client.connect();
  database = client.db();
  await database.command({ ping: 1 });
  documentsCollection = database.collection("documents");
  staffCollection = database.collection("staff");
  await documentsCollection.createIndex({ id: 1 }, { unique: true });
  await staffCollection.createIndex({ id: 1 }, { unique: true });
  await staffCollection.createIndex({ email: 1 }, { unique: true });

  for (const sample of demoStaff) {
    const { password, ...staff } = sample;
    await staffCollection.updateOne(
      { id: staff.id },
      {
        $setOnInsert: {
          ...staff,
          email: staff.email.toLowerCase(),
          passwordHash: await bcrypt.hash(password, 12)
        }
      },
      { upsert: true }
    );
  }

  })().catch(error => {
    initializationPromise = undefined;
    throw error;
  });
  return initializationPromise;
}

async function start() {
  await initialize();
  return app.listen(port, () => {
    console.log(`Aram Office is running at http://localhost:${port}`);
    console.log(`MongoDB connected to database "${database.databaseName}".`);
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error("Backend startup failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, initialize };
