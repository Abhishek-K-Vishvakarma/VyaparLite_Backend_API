import express from 'express';
const router = express.Router();
import { allowRoles } from "../middlewares/roleMiddleware.js";
import protect from '../middlewares/auth.middleware.js';
import { dailyReport, dateRangeReport, monthlyReport, salesChartData } from '../controllers/reportController.js';
router.get("/daily", protect, allowRoles("owner","manager"), dailyReport);
router.get("/monthly", protect, allowRoles("owner","manager"), monthlyReport); // manager only see report (manager full control) and Staff report nahi dekh sakta
router.get("/range", protect, allowRoles("owner","manager"), dateRangeReport);
router.get("/chart", protect, allowRoles("owner","manager"), salesChartData);

export default router;