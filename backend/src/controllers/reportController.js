import Sale from "../models/Sale.js";
import Shop from "../models/Shop.js";

export const dailyReport = async (req, res) => {
  // 🔐 find shop
  const shop = await Shop.findOne({ owner: req.user._id });
  if (!shop) {
    return res.status(404).json({ message: "Shop not found" });
  }
  // 📅 today range
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  // 🔍 find sales
  const sales = await Sale.find({
    shop: shop._id,
    createdAt: { $gte: start, $lte: end }
  });
  console.log(sales);

  const total = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  res.json({
    total,
    count: sales.length,
    sales
  });
};

export const monthlyReport = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const now = new Date();

    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const sales = await Sale.find({
      shop: shop._id,
      createdAt: { $gte: start, $lte: end }
    });

    const total = sales.reduce((sum, s) => sum + s.totalAmount, 0);

    res.json({
      month: start.toLocaleString("en-IN", { month: "long", year: "numeric" }),
      total,
      count: sales.length,
      sales
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const dateRangeReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from & to required" });
    }

    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);

    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      shop: shop._id,
      createdAt: { $gte: start, $lte: end }
    });

    const total = sales.reduce((sum, s) => sum + s.totalAmount, 0);

    res.json({
      from,
      to,
      total,
      count: sales.length,
      sales
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const salesChartData = async (req, res) => {
  const shop = await Shop.findOne({ owner: req.user._id });

  const data = await Sale.aggregate([
    {
      $match: { shop: shop._id }
    },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        total: { $sum: "$totalAmount" }
      }
    },
    {
      $sort: { "_id.day": 1 }
    }
  ]);

  res.json(data);
};
