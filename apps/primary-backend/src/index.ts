import express from "express";
import { userRouter } from "./router/user";
import { zapRouter } from "./router/zap";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1/user", userRouter);

app.use("/api/v1/user", zapRouter);

app.listen(3000, () => {
  console.log(`Server is working on http://localhost:3000`);
});
