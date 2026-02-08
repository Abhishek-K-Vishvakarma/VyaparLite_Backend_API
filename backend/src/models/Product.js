// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  category: {
    type: String,
    enum: [
      "ESSENTIAL_FOOD",      // 0% GST
      "PROCESSED_FOOD",      // 5% GST
      "PACKED_FOOD",         // 12% GST
      "BEVERAGES",           // 18% GST
      "MEDICINES",           // 12% GST
      "MEDICAL_DEVICES",     // 12% GST
      "COSMETICS",           // 18% GST
      "ELECTRONICS",         // 18% GST
      "MOBILE_PHONES",       // 18% GST
      "CLOTHING_BASIC",      // 5% GST
      "CLOTHING_PREMIUM",    // 12% GST
      "GENERAL",             // 18% GST (default)
    ],
    default: "GENERAL"
  },
  gstRate: {
    type: Number,
    default: 18,  // Default 18%
    enum: [0, 5, 12, 18, 28]
  },
  price: { type: Number, required: true },
  unit: {
    type: String,
    enum: ["KG", "PIECE", "BOTTLE", "PACKET"],
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  batch: { type: String },
  expiry: { type: Date },
  imei: { type: String },
  warranty: { type: String },
  image: { type: String },
}, { timestamps: true });

// ✅ Auto-set GST rate based on category
productSchema.pre('save', function (next) {
  const gstMapping = {
    ESSENTIAL_FOOD: 0,
    PROCESSED_FOOD: 5,
    PACKED_FOOD: 12,
    BEVERAGES: 18,
    MEDICINES: 12,
    MEDICAL_DEVICES: 12,
    COSMETICS: 18,
    ELECTRONICS: 18,
    MOBILE_PHONES: 18,
    CLOTHING_BASIC: 5,
    CLOTHING_PREMIUM: 12,
    GENERAL: 18
  };

  this.gstRate = gstMapping[this.category] || 18;
  // next();
});

productSchema.index({ name: 1, shop: 1 }, { unique: true });

export default mongoose.model("Product", productSchema);

/*
📊 GST Tax System Overview
1. GST Types:
CGST (Central GST) - Central Government ko jaata hai
SGST (State GST) - State Government ko jaata hai
IGST (Integrated GST) - Inter-state transactions ke liye
Formula:

Intra-state sale (same state mein): CGST + SGST
Inter-state sale (different states): IGST


🏪 Different Shop Types & GST Rates
1. Kirana Store (Grocery)
Product CategoryGST RateCGSTSGSTExamplesEssential food items0%0%0%Fresh fruits, vegetables, milk, bread, eggs, curdProcessed food5%2.5%2.5%Tea, coffee, sugar, edible oil, spicesPacked food12%6%6%Namkeen, butter, cheese, dry fruitsBranded items18%9%9%Biscuits, chocolates, ice cream, soft drinksLuxury items28%14%14%Pan masala, gutkha
Example Kirana Bill:
Rice (5 kg) @ ₹40/kg = ₹200 (0% GST) = ₹200
Sugar (2 kg) @ ₹48/kg = ₹96 (5% GST) = ₹100.80
Biscuits (Parle-G) = ₹10 (18% GST) = ₹11.80
-------------------------------------------------
Subtotal: ₹306
Tax: ₹12.60
Total: ₹318.60

2. Medical Store (Pharmacy)
Product TypeGST RateCGSTSGSTExamplesLife-saving drugs0%0%0%Insulin, vaccinesGeneral medicines12%6%6%Tablets, syrups, ointmentsMedical devices12%6%6%Bandages, thermometer, BP machineSurgical items12%6%6%Syringes, gloves, masksCosmetics/toiletries18%9%9%Soap, shampoo, toothpaste
Example Medical Bill:
Dolo 650 (10 tablets) = ₹30 (12% GST) = ₹33.60
Crocin Syrup = ₹50 (12% GST) = ₹56
Band-aid = ₹20 (12% GST) = ₹22.40
-------------------------------------------------
Subtotal: ₹100
Tax (12%): ₹12
Total: ₹112

3. Mobile Shop (Electronics)
Product TypeGST RateCGSTSGSTExamplesMobile phones18%9%9%Smartphones, feature phonesAccessories18%9%9%Chargers, earphones, casesLaptops/computers18%9%9%Laptop, desktop, tabletBatteries28%14%14%Mobile batteries
Example Mobile Shop Bill:
iPhone 15 = ₹80,000 (18% GST) = ₹94,400
Phone case = ₹500 (18% GST) = ₹590
Tempered glass = ₹300 (18% GST) = ₹354
-------------------------------------------------
Subtotal: ₹80,800
Tax (18%): ₹14,544
Total: ₹95,344

4. Clothing Store (Garments)
Product TypeGST RateCGSTSGSTExamplesCotton clothes (≤₹1000)5%2.5%2.5%Regular shirts, pantsReadymade garments12%6%6%Mid-range brandsPremium clothing18%9%9%Designer wear, branded

5. Restaurant/Food Business
TypeGST RateCGSTSGSTNoteNon-AC restaurant5%2.5%2.5%No input tax creditAC restaurant18%9%9%With input tax creditTakeaway5%2.5%2.5%Packaged food

🛠️ Implementation in Your Project
Option 1: Fixed 18% GST (Simple - Current)
Yeh sabse simple hai - har product pe 18% lagao (jo aapne abhi kiya hai).
Pros: Easy to implement, no complexity
Cons: Not accurate for real-world scenarios
 */