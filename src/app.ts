import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config/index.js";
import router from "./app/routes/index.js";
import globalErrorHandler from "./app/middlewares/globalErrorHandler.js";
import notFound from "./app/middlewares/notFound.js";
import { getIO } from "./helpers/socketHelper.js";

const app: Application = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "https://fixmincykel.dk",
    credentials: true,
  }),
);
//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("uploads"));

app.use("/api/v1", router);

app.post("/send-job", (req, res) => {
  const { roomId, jobId, message } = req.body;

  try {
    const io = getIO();
    io.to(roomId).emit("newJob", { jobId, message });

    res.json({ success: true, message: `Job sent to room ${roomId}` });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Server is running..",
    environment: config.node_env,
    uptime: process.uptime().toFixed(2) + " sec",
    timeStamp: new Date().toISOString(),
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
