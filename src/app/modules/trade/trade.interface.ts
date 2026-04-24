export interface ICreateTradePayload {
  receiverId: string;
  senderFighterIds: string[];   // Fighter IDs the sender offers
  receiverFighterIds: string[]; // Fighter IDs the sender wants back
  message?: string;
}

export interface ITradeFilterRequest {
  status?: string;
}
