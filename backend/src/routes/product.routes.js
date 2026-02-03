import express from "express";
import { addProduct, deleteProduct, getShopProducts, updateProduct } from "../controllers/product.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", protect, addProduct);
router.get("/my-products", protect, getShopProducts);
router.put("/put-product/:id", protect, updateProduct);
router.delete("/del-product/:id", protect, deleteProduct);

export default router;
