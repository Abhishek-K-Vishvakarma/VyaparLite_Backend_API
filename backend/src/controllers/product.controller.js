import Product from "../models/Product.js";
import Shop from "../models/Shop.js";

const convertToBaseUnit = (stock, unit) => {
  stock = Number(stock);
  if (unit === "KG") return stock * 1000;
  return stock; // PIECE, BOTTLE, PACKET
};

export const addProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }
    const { name, unit, stock } = req.body;
    //  Case-insensitive duplicate check
    const existingProduct = await Product.findOne({
      shop: shop._id,
      name: { $regex: `^${ name.trim() }$`, $options: "i" },
    });
    if (existingProduct) {
      return res.status(400).json({ message: "Product already exists" });
    }
    const baseStock = convertToBaseUnit(stock, unit);
    if (baseStock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }
    const product = await Product.create({
      ...req.body,
      name: name.trim(),
      stock: baseStock,       // stored in base unit
      batch: generateBatch(),
      shop: shop._id,
    });
    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }
    const product = await Product.findOne({ _id: id, shop: shop._id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    let updatedStock = product.stock;
    //  Only recalculate stock if user actually changed stock OR unit
    if (req.body.stock !== undefined || req.body.unit !== undefined) {
      const incomingUnit = req.body.unit ?? product.unit;
      const incomingStock = req.body.stock ?? product.stock;
      //  Convert ONLY once
      updatedStock = convertToBaseUnit(incomingStock, incomingUnit);
    }
    if (updatedStock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }
    Object.assign(product, {
      ...req.body,
      name: req.body.name?.trim() ?? product.name,
      stock: updatedStock,
    });
    await product.save();
    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findOne({ owner: req.user._id });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const product = await Product.findOne({
      _id: id,
      shop: shop._id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ❌ block delete if stock > 0
    if (product.stock > 0) {
      return res.status(400).json({
        message:
          "Cannot delete product with available stock. Set stock to 0 first.",
      });
    }

    await product.deleteOne();

    res.json({
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getShopProducts = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const products = await Product.find({ shop: shop._id });
    res.status(200).json(products);
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
