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
app.use(cors({
  origin: "http://localhost:5173", // ✅ Frontend URL
  credentials: true,                // ✅ Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],   // 🔥 Important for cookies
  preflightContinue: false,
  optionsSuccessStatus: 204
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
