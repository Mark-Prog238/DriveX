import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const PORT = process.env.PORT || 8000;
const PUBLIC_URL = process.env.PUBLIC_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const LOCAL_URL = process.env.LOCAL_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, "uploads");
const app = express();

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables.");
  console.error(
    "   Add MONGODB_URI to your .env file locally and to your Vercel/hosting env.",
  );
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let db;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

async function startServer() {
  try {
    await client.connect();
    db = client.db("avtoDB");
    console.log("✅ MongoDB Povezan");
    app.listen(PORT, () => console.log(`🚀 Server teče na portu ${PORT}`));
  } catch (e) {
    console.error("❌ DB Error:", e);
  }
}
startServer();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});
const upload = multer({ storage });
app.use(cors({ origin: [FRONTEND_URL, LOCAL_URL], credentials: true }));
app.use("/uploads", express.static(UPLOAD_DIR));

const getUserId = (req) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
};

// LOGIN
app.post("/api/login", express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.collection("users").findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Wrong credentials" });
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" },
    );
    res.json({ success: true, token, fullName: user.fullName });
  } catch {
    res.json({ success: false });
  }
});

// REGISTER
app.post("/api/register", express.json(), async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      address,
      profileType,
      companyName,
    } = req.body;
    if (await db.collection("users").findOne({ email })) {
      return res.json({ success: false, message: "User exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection("users").insertOne({
      fullName,
      email,
      password: hashedPassword,
      phone,
      address,
      profileType,
      companyName,
      createdAt: new Date(),
    });
    res.json({ success: true, userId: result.insertedId });
  } catch {
    res.json({ success: false });
  }
});

// CREATE
app.post("/api/listings", upload.array("images"), async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      brand,
      model,
      price,
      year,
      milage,
      hp,
      description,
      bodyType,
      fuelType,
      gearbox,
      vin,
      driveType,
      doors,
      seats,
      euroStandard,
      features,
    } = req.body;
    const imageUrls = (req.files || []).map((file) => {
      return `${PUBLIC_URL}/uploads/${file.filename}`;
    });
    const parsedFeatures = features ? JSON.parse(features) : [];
    const calculatedKw = hp ? Math.round(Number(hp) * 0.74) : undefined;
    const newListing = {
      brand,
      model,
      price: Number(price),
      year: Number(year),
      milage: Number(milage),
      hp: Number(hp),
      kW: calculatedKw,
      bodyType,
      fuelType,
      gearbox,
      vin,
      driveType,
      doors,
      seats,
      euroStandard,
      features: parsedFeatures,
      description,

      sellerId: userId ? new ObjectId(userId) : new ObjectId(),
      images: imageUrls,
      createdAt: new Date(),
      status: "active",
    };
    await db.collection("listings").insertOne(newListing);
    res.json({ success: true, message: "Created" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// VSE  + filtering, sorting, pagination
app.get("/api/listings", async (req, res) => {
  try {
    const {
      make,
      model,
      minPrice,
      maxPrice,
      sort,
      limit = "20",
      skip = "0",
    } = req.query;

    const query = {};

    if (make) {
      query.brand = make;
    }
    if (model) {
      query.model = { $regex: new RegExp(model, "i") };
    }

    const priceFilter = {};
    if (minPrice) {
      priceFilter.$gte = Number(minPrice);
    }
    if (maxPrice) {
      priceFilter.$lte = Number(maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
      query.price = priceFilter;
    }

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safeSkip = Math.max(Number(skip) || 0, 0);

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") {
      sortOption = { price: 1 };
    } else if (sort === "price_desc") {
      sortOption = { price: -1 };
    }

    const collection = db.collection("listings");
    const cursor = collection
      .find(query)
      .sort(sortOption)
      .skip(safeSkip)
      .limit(safeLimit);

    const [data, total] = await Promise.all([
      cursor.toArray(),
      collection.countDocuments(query),
    ]);

    res.json({ success: true, data, total });
  } catch (e) {
    console.error("❌ /api/listings error:", e);
    res.status(500).json({ success: false, data: [], total: 0 });
  }
});

// POSAMEZNO
app.get("/api/listings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };
    const doc = await db.collection("listings").findOne(query);
    if (!doc) return res.json({ success: false });
    res.json({ success: true, data: doc });
  } catch {
    res.json({ success: false });
  }
});

// GARAGE
app.get("/api/garage/listings", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json({ success: true, data: [] });
    const userListings = await db
      .collection("listings")
      .find({
        sellerId: new ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, data: userListings });
  } catch (e) {
    res.json({ success: false });
  }
});

// DELETE
app.delete("/api/listings/:id", async (req, res) => {
  try {
    await db
      .collection("listings")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// UPDATE
app.put("/api/listings/:id", express.json(), async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates.sellerId;
    await db
      .collection("listings")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// LIKES
app.post("/api/users/:userId/likes", express.json(), async (req, res) => {
  try {
    const { userId } = req.params;
    const { listingId } = req.body;
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    const isLiked = user?.savedListings?.includes(listingId);
    if (isLiked)
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $pull: { savedListings: listingId } },
        );
    else
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $addToSet: { savedListings: listingId } },
        );
    res.json({ success: true, isLiked: !isLiked });
  } catch {
    res.json({ success: false });
  }
});

// GET LIKES
app.get("/api/users/:userId/likes", async (req, res) => {
  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(req.params.userId) });
    const ids = (user?.savedListings || []).map((id) => new ObjectId(id));
    const data = await db
      .collection("listings")
      .find({ _id: { $in: ids } })
      .toArray();
    res.json({ success: true, data });
  } catch {
    res.json({ success: true, data: [] });
  }
});

app.get("/api/users/:userId", async (req, res) => {
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(req.params.userId) });
  res.json({ success: true, savedListings: user?.savedListings || [] });
});

// KONTAKT
app.get("/api/listings/:id/contact", async (req, res) => {
  try {
    const listing = await db
      .collection("listings")
      .findOne({ _id: new ObjectId(req.params.id) });
    const slrId = listing.sellerId;
    const seller = await db
      .collection("users")
      .findOne({ _id: new ObjectId(listing.sellerId) });
    console.log("📞 Fetched Seller Phone:", seller?.phone);
    console.log("📞 For Listing ID:", req.params.id);
    console.log("📞 Seller ObjectId:", listing.sellerId);
    res.json({ success: true, phone: seller?.phone });
  } catch {
    res.json({ success: false });
  }
});

// FIRME
app.get("/api/cars/makes", async (req, res) => {
  const r = await fetch("https://carapi.app/api/makes/v2");
  const j = await r.json();
  res.json({ data: j.data });
});
app.get("/api/cars/models/:make", async (req, res) => {
  const r = await fetch(
    `https://carapi.app/api/models/v2?make=${req.params.make}`,
  );
  const j = await r.json();
  res.json({ data: j.data });
});

app.get("/api/users/:userId/listings", async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("🔍 SellerID from Token:", userId);
    const sellerObjectId = new ObjectId(userId);
    const userListings = await db
      .collection("listings")
      .find({
        sellerId: sellerObjectId,
      })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, data: userListings });
  } catch (e) {
    console.error("❌ Garage Fetch Error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
