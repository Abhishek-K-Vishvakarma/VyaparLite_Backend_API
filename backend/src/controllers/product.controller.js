import Product from "../models/Product.js";
import Shop from "../models/Shop.js";

const generateBatch = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  const randomNumber = Math.floor(100 + Math.random() * 900); // 100–999
  return `${ randomLetter }${ randomNumber }`;
};

export const addProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const { name, unit } = req.body;

    //  Case-insensitive duplicate check
    const existingProduct = await Product.findOne({
      shop: shop._id,
      name: { $regex: `^${ name.trim() }$`, $options: "i" },
    });

    if (existingProduct) {
      return res.status(400).json({
        message: "Product already exists",
      });
    }

    let stock = Number(req.body.stock);

    // KG → grams
    if (unit === "KG") {
      stock = stock * 1000;
    }

    const product = await Product.create({
      ...req.body,
      name: name.trim(),   //  normalize
      stock,
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

export const updateProduct = async (req, res) => {
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

    let stock = req.body.stock ?? product.stock;

    // KG → grams conversion
    if (req.body.unit === "KG") {
      stock = stock * 1000;
    }

    // prevent negative stock
    if (stock < 0) {
      return res.status(400).json({
        message: "Stock cannot be negative",
      });
    }

    Object.assign(product, {
      ...req.body,
      stock,
      name: req.body.name?.trim() ?? product.name,
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
