import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/config";
import { logger } from "./utils/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/user";
import { profileRoutes } from "./routes/profile";
import { buyerRoutes } from "./routes/buyer";
import { sellerRoutes } from "./routes/seller";
import { eventRoutes } from "./routes/event";
import { offerRoutes } from "./routes/offer";
import { listingRoutes } from "./routes/listing";
import { transactionRoutes } from "./routes/transaction";
import { brokerRoutes } from "./routes/broker";
import { adminRoutes } from "./routes/admin";
import webhookRoutes from "./routes/webhook";
import testimonialRoutes from "./routes/testimonial";
import { setupSwagger } from "./config/swagger";

const app = express();

//Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3001",
      "http://localhost:5173",
      "https://sneatsnags.onrender.com",
      "https://sneatsnags-frontend.onrender.com"
    ],
    credentials: true,
  })
);

//Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api", limiter);

//Webhook routes (before body parsing middleware for raw body access)
app.use("/api/webhooks", express.raw({ type: 'application/json' }), webhookRoutes);

//Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

//Static file serving
app.use('/uploads', express.static('uploads'));

//Swagger documentation
setupSwagger(app);

//Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toString() });
});

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/brokers", brokerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/testimonials", testimonialRoutes);

//Error handling
app.use(errorHandler);

//404 Handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = config.PORT || 5001;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;
