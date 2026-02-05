import dotenv from 'dotenv';
dotenv.config();
import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./src/config/db.js";
import routes from "./index.js";
import path from "path";

// TODO: Later add shopRoutes, productRoutes, saleRoutes, notificationRoutes

const app = express();

// Connect Database
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS setup
const allowedOrigins = [
  "https://vyapar-lite-frontend.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    // allow vercel preview + prod
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
}));


// Routes
// app.use("/api/auth", authRoutes);
routes.forEach(({ path, router }) => {
  app.use(path, router);
})

// Default route
app.get("/", (req, res) => {
  res.send("VyaparLite API is running...");
});
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${ PORT }`));
