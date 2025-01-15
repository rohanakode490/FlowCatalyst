import express from "express";
import { userRouter } from "./router/user";
import { zapRouter } from "./router/zap";
import cors from "cors";
import { triggerRouter } from "./router/trigger";
import { actionRouter } from "./router/action";
import { triggerResponseRouter } from "./router/triggerResponse";
import { JWT_PASSWORD } from "./config";
const cookieParser = require("cookie-parser");
const rateLimiter = require("express-rate-limit");

const app = express();

app.use(express.json());
app.use(cookieParser(JWT_PASSWORD));
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  }),
);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use("/api/v1/user", userRouter);

app.use("/api/v1/zap", zapRouter);

app.use("/api/v1/trigger", triggerRouter);

app.use("/api/v1/action", actionRouter);

app.use("/api/v1/trigger-response", triggerResponseRouter);

app.listen(4000, () => {
  console.log(`Server is working on http://localhost:4000`);
});
