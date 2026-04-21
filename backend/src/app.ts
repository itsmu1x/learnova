import "dotenv/config"
import cors from "cors"
import express from "express"

const app = express()

app.use(
	cors({
		origin: process.env.FRONTEND_URL ?? true,
		credentials: true,
	}),
)
app.use(express.json())

app.get("/", (_req, res) => {
	res.json({ ok: true, service: "learnova-api" })
})

export default app
