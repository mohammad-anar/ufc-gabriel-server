import express from "express";
import { UserRouter } from "../modules/auth/user.route.js";
import { FighterRouter } from "../modules/fighter/fighter.route.js";
import { EventRouter } from "../modules/event/event.route.js";
import { BoutRouter } from "../modules/bout/bout.route.js";
import { LeagueRouter } from "../modules/league/league.route.js";
import { TeamRouter } from "../modules/team/team.route.js";
import { DraftRouter } from "../modules/draft/draft.route.js";
import { TradeRouter } from "../modules/trade/trade.route.js";
import { QueueRouter } from "../modules/queue/queue.route.js";
import { SystemRouter } from "../modules/system/system.route.js";
import { SystemScoreRouter } from "../modules/systemScore/systemScore.route.js";
import { NewsletterRoutes } from "../modules/newsletter/newsletter.route.js";
import { DivisionRoutes } from "../modules/division/division.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth",    route: UserRouter },
  { path: "/fighter", route: FighterRouter },
  { path: "/event",   route: EventRouter },
  { path: "/bout",    route: BoutRouter },
  { path: "/league",  route: LeagueRouter },
  { path: "/team",    route: TeamRouter },
  { path: "/draft",   route: DraftRouter },
  { path: "/trade",   route: TradeRouter },
  { path: "/queue",   route: QueueRouter },
  { path: "/system",  route: SystemRouter },
  { path: "/system-score", route: SystemScoreRouter },
  { path: "/newsletter", route: NewsletterRoutes },
  { path: "/division", route: DivisionRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
