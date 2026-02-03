import Shop from "../models/Shop.js";
export const createShop = async (req, res) => {
  try {
    const { name, address, phone, type, gstin } = req.body;
    const existingShop = await Shop.findOne({ owner: req.user._id, type: type });
    if (existingShop) {
      return res.status(400).json({ message: "Shop already exists" });
    }
    const shop = await Shop.create({
      name,
      address,
      phone,
      type,
      gstin,
      owner: req.user._id,
    });
    res.status(201).json({
      message: "Shop created successfully",
      shop,
    });
  } catch (err) {
    console.error("Create Shop Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getMyShop = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {
      owner: req.user._id
    }
    if (type) {
      query.type = type;
    }
    const shop = await Shop.find(query);
    console.log(type);

    if (!shop) return res.status(404).json({ message: "No shop found" });

    res.status(200).json(shop);
  } catch (err) {
    console.error("Get Shop Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
