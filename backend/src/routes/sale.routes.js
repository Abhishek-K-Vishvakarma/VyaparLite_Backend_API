import express from "express";
import { createSale } from "../controllers/sale.controller.js";
import protect from "../middlewares/auth.middleware.js";
// import { allowRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/create", protect, createSale);

export default router;
