import { z } from "zod";

const createTradeZodSchema = z.object({
 
    receiverId: z.string().min(1, "Receiver ID is required"),
    senderFighterIds: z
      .array(z.string())
      .min(1, "You must offer at least one fighter"),
    receiverFighterIds: z
      .array(z.string())
      .min(1, "You must request at least one fighter"),
    message: z.string().max(500).optional(),

});

const vetoTradeZodSchema = z.object({


});

export const TradeValidation = {
  createTradeZodSchema,
  vetoTradeZodSchema,
};
