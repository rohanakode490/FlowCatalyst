import express from "express"
import { prisma, Prisma } from "@repo/database"

const app = express()
app.use(express.json())

// Password Logic
app.post("/hooks/catch/:userId/:zapId", async (req, res) => {
    const userId = req.params.userId;
    const zapId = req.params.zapId;
    const body = req.body;
    
    // Store in db a new trigger
    const result = await prisma.$transaction(async (tx:Prisma.TransactionClient) => {
        const run = await tx.zapRun.create({
            data: {
                zapId: zapId,
                metadata: body
            }
        })

        await tx.zapRunOutbox.create({
            data: {
                zapRunId: run.id,
            }
        })
    })
    res.json({
        message: "Webhook received successfully"
    })
    // TODO: push it to a queue(redis/kafka)
})

app.listen(3000)