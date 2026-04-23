import express from "express";
import { UserRouter } from "../modules/auth/user.route.js";
import { BikeRouter } from "../modules/bike/bike.routes.js";
import { BookingRouter } from "../modules/booking/booking.routes.js";
import { CategoryRouter } from "../modules/category/category.routes.js";
import { JobRouter } from "../modules/job/job.routes.js";
import { JobOfferRouter } from "../modules/jobOffer/jobOffer.routes.js";
import { WorkshopRouter } from "../modules/workshop/workshop.routes.js";
import { BlogRouter } from "../modules/blog/blog.routes.js";
import { BlogCategoryRouter } from "../modules/blogCategory/blogCategory.routes.js";
import { NotificationRouter } from "../modules/notification/notification.routes.js";
import { ChatNotificationRouter } from "../modules/chatNotification/chatNotification.routes.js";
import { ReviewRouter } from "../modules/review/review.route.js";
import { InvoiceRouter } from "../modules/invoice/invoice.route.js";
import { AnalyticsRouter } from "../modules/analytics/analytics.route.js";
import { ChatRouter } from "../modules/chat/chat.routes.js";
import { NewsletterRouter } from "../modules/newsletter/newsletter.routes.js";
import { PlatformDataRouter } from "../modules/platformData/platformData.routes.js";
import { ServiceCategoryRouter } from "../modules/serviceCategory/serviceCategory.routes.js";
import { ContactRouter } from "../modules/contact/contact.routes.js";
import { WorkshopCategoryRouter } from "../modules/workshopCategory/workshopCategory.routes.js";
import { WorkshopOpeningHourRouter } from "../modules/workshopOpeningHours/workshopOpeningHours.routes.js";
import { ActivityRouter } from "../modules/activity/activity.routes.js";
import { VisionStatisticsRouter } from "../modules/visionStatistics/visionStatistics.routes.js";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: UserRouter,
  },
  {
    path: "/workshop",
    route: WorkshopRouter,
  },
  {
    path: "/jobs",
    route: JobRouter,
  },
  {
    path: "/category",
    route: CategoryRouter,
  },
  {
    path: "/offers",
    route: JobOfferRouter,
  },
  {
    path: "/booking",
    route: BookingRouter,
  },
  {
    path: "/bike",
    route: BikeRouter,
  },
  {
    path: "/blog",
    route: BlogRouter,
  },
  {
    path: "/blog-category",
    route: BlogCategoryRouter,
  },
  {
    path: "/notification",
    route: NotificationRouter,
  },
  {
    path: "/chat-notification",
    route: ChatNotificationRouter,
  },
  {
    path: "/review",
    route: ReviewRouter,
  },
  {
    path: "/invoice",
    route: InvoiceRouter,
  },
  {
    path: "/analytics",
    route: AnalyticsRouter,
  },
  {
    path: "/chat",
    route: ChatRouter,
  },
  {
    path: "/newsletter",
    route: NewsletterRouter,
  },
  {
    path: "/platform-data",
    route: PlatformDataRouter,
  },
  {
    path: "/service-category",
    route: ServiceCategoryRouter,
  },
  {
    path: "/contact",
    route: ContactRouter,
  },
  {
    path: "/workshop-category",
    route: WorkshopCategoryRouter,
  },
  {
    path: "/workshop-opening-hour",
    route: WorkshopOpeningHourRouter,
  },
  {
    path: "/activity",
    route: ActivityRouter,
  },
  {
    path: "/vision-statistics",
    route: VisionStatisticsRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
