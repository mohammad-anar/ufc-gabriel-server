import express from "express";
import { TradeController } from "./trade.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { TradeValidation } from "./trade.validation.js";
import auth from "../../middlewares/auth.js";
import lockdownGuard from "../../middlewares/lockdownGuard.js";
import { Role } from "../../../types/enum.js";

const router = express.Router({ mergeParams: true }); // inherits :leagueId from parent

/**
 * @swagger
 * tags:
 *   name: Trades
 *   description: Fighter trade offers, veto system, and roster swaps between league teams
 */

/**
 * @swagger
 * /trade/{leagueId}:
 *   get:
 *     tags: [Trades]
 *     summary: Get all trades in a league (filterable by status)
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, ACCEPTED, REJECTED, VETOED] }
 *     responses:
 *       200:
 *         description: List of trades with sender/receiver info and veto records
 *   post:
 *     tags: [Trades]
 *     summary: Create a trade offer (system must not be locked)
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, senderFighterIds, receiverFighterIds]
 *             properties:
 *               receiverId: { type: string }
 *               senderFighterIds: { type: array, items: { type: string } }
 *               receiverFighterIds: { type: array, items: { type: string } }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Trade offer created and receiver notified
 *       409:
 *         description: Pending trade already exists
 *       423:
 *         description: System is locked (Saturday Lockdown)
 */
router.get("/:leagueId", auth(Role.USER, Role.ADMIN), TradeController.getLeagueTrades);
router.post(
  "/:leagueId",
  auth(Role.USER, Role.ADMIN),
  lockdownGuard,
  validateRequest(TradeValidation.createTradeZodSchema),
  TradeController.createTrade
);

/**
 * @swagger
 * /trade/offer/{tradeId}:
 *   get:
 *     tags: [Trades]
 *     summary: Get a single trade by ID
 *     parameters:
 *       - in: path
 *         name: tradeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trade details
 *       404:
 *         description: Trade not found
 */
router.get("/offer/:tradeId", auth(Role.USER, Role.ADMIN), TradeController.getTradeById);

/**
 * @swagger
 * /trade/offer/{tradeId}/accept:
 *   patch:
 *     tags: [Trades]
 *     summary: Accept a trade offer (receiver only — executes roster swap)
 *     parameters:
 *       - in: path
 *         name: tradeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fighters swapped between rosters
 *       403:
 *         description: Not the trade receiver
 *       423:
 *         description: System is locked
 */
router.patch("/offer/:tradeId/accept", auth(Role.USER, Role.ADMIN), lockdownGuard, TradeController.acceptTrade);

/**
 * @swagger
 * /trade/offer/{tradeId}/reject:
 *   patch:
 *     tags: [Trades]
 *     summary: Reject a trade offer (receiver only)
 */
router.patch("/offer/:tradeId/reject", auth(Role.USER, Role.ADMIN), lockdownGuard, TradeController.rejectTrade);

/**
 * @swagger
 * /trade/offer/{tradeId}/cancel:
 *   patch:
 *     tags: [Trades]
 *     summary: Cancel a trade offer (sender only)
 */
router.patch("/offer/:tradeId/cancel", auth(Role.USER, Role.ADMIN), lockdownGuard, TradeController.cancelTrade);

/**
 * @swagger
 * /trade/offer/{tradeId}/veto:
 *   post:
 *     tags: [Trades]
 *     summary: Veto a pending trade (any league member except sender/receiver)
 *     description: >
 *       Each league member (excluding the trade participants) can cast one veto.
 *       When veto count reaches floor(memberCount/2), the trade is auto-VETOED.
 *     parameters:
 *       - in: path
 *         name: tradeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Veto recorded. Trade may be automatically vetoed if threshold is reached.
 *       409:
 *         description: Already vetoed
 */
router.post("/offer/:tradeId/veto", auth(Role.USER, Role.ADMIN), lockdownGuard, TradeController.vetoTrade);

export const TradeRouter = router;
