import express from "express";
import { createShop, getMyShop } from "../controllers/shop.controller.js";
import protect from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
const router = express.Router();

router.post("/create", protect, allowRoles("owner"), createShop);
router.get("/my/shop", protect, allowRoles("owner"), getMyShop);

export default router;
