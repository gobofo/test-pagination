const express  = require("express");
const cors     = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app       = express();
const PORT      = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

const ALLOWED_SORT_FIELDS = ["createdAt", "price", "name"];
const ALLOWED_CATEGORIES  = ["shoes", "clothing", "accessories", "bags"];

/**
 * Parses and sanitizes query parameters for the product list endpoint.
 * Invalid values are silently replaced with defaults rather than rejected.
 *
 * @param {Object} query - Express req.query object.
 * @returns {{ page: number, limit: number, category: string|null, sort: string, order: number }}
 */
function parseParams(query) {
  const page     = Math.max(1, parseInt(query.page,  10) || 1);
  const limit    = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const category = ALLOWED_CATEGORIES.includes(query.category) ? query.category : null;
  const sort     = ALLOWED_SORT_FIELDS.includes(query.sort) ? query.sort : "createdAt";
  const order    = query.order === "asc" ? 1 : -1;
  return { page, limit, category, sort, order };
}

/**
 * Builds a MongoDB filter document from sanitized query parameters.
 *
 * @param {{ category: string|null }} params
 * @returns {Object} MongoDB filter document.
 */
function buildFilter({ category }) {
  return category ? { category } : {};
}

async function start() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db("shop");
  app.locals.db = db;

  app.use(cors());
  app.use(express.json());

  /**
   * GET /api/products
   * Returns a paginated, filtered and sorted list of products.
   * Runs countDocuments and find in parallel to minimise latency.
   *
   * @param {import("express").Request}  req
   * @param {import("express").Response} res
   */
  app.get("/api/products", async (req, res) => {
    try {
      const params     = parseParams(req.query);
      const filter     = buildFilter(params);
      const collection = req.app.locals.db.collection("products");
      const skip       = (params.page - 1) * params.limit;

      const [total, data] = await Promise.all([
        collection.countDocuments(filter),
        collection
          .find(filter)
          .sort({ [params.sort]: params.order })
          .skip(skip)
          .limit(params.limit)
          .toArray(),
      ]);

      res.json({
        data,
        pagination: {
          total,
          page:       params.page,
          limit:      params.limit,
          totalPages: Math.ceil(total / params.limit),
        },
      });
    } catch (err) {
      console.error("GET /api/products:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(PORT, () => console.log("Server started on http://localhost:" + PORT));
}

start().catch((err) => {
  console.error("MongoDB connection error:", err.message);
  process.exit(1);
});
