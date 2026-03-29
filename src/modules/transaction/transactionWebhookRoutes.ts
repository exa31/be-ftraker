import { Router } from "express";
import TransactionService from "./transactionService";
import { wrappingDbTransaction } from "../../utils/db";
import verifyN8nWebhook from "../../middleware/verifyN8nWebhook";

const webhookRouter = Router();

// N8N Webhook endpoint dengan HMAC verification dan API key
// Headers required:
//   - x-api-key: Your API key
//   - x-webhook-signature: HMAC-SHA256 signature
webhookRouter.post(
    "/transactions/webhook/n8n",
    verifyN8nWebhook,
    wrappingDbTransaction(TransactionService.handleN8nWebhook)
);

export default webhookRouter;
