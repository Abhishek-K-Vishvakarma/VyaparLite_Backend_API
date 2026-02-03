import authRouter from "./src/routes/auth.routes.js";
import shopRouter from "./src/routes/shop.routes.js";
import productRouter from './src/routes/product.routes.js';
import salesRouter from './src/routes/sale.routes.js';
import notificationRouter from "./src/routes/notification.routes.js";
import invoiceRouter from './src/routes/invoice.routes.js';
import dailyReportRouter from "./src/routes/reportRoutes.js";
const routes = [
  { path: '/api/auth', router: authRouter },
  { path: '/api/shop', router: shopRouter },
  { path: '/api/product', router: productRouter },
  { path: '/api/sale', router: salesRouter },
  { path: '/api/notification', router: notificationRouter },
  { path: '/api/invoice', router: invoiceRouter },
  { path: '/api/report', router: dailyReportRouter }
]

export default routes;