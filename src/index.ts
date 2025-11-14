import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import "./databases/mongodb";
import UserRoutes from "./modules/user/userRoutes";
import TransactionRoutes from "./modules/transaction/transactionRoutes";
import {logRouting} from "./middleware/logrouting";
import {logRequest} from "./middleware/logrequest";
import {validateToken} from "./middleware/validateToken";
import Config from "./config";

dotenv.config();


const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// log request
app.use(logRequest);

// routing logger (onStart Elysia)
logRouting(app);

// public routes
app.use("/auth/v1", UserRoutes);

// protected routes
app.use("/api/v1", validateToken, TransactionRoutes);

// 404 handler
app.all("*", (req, res) => {
    res.status(404).json({message: "Route not found"});
});

// start server
app.listen(Config.PORT, () => {
    console.log(`🚀 Express running on port ${Config.PORT}`);
});
