import express, { ErrorRequestHandler } from "express"
import dotenv from "dotenv"

import publicRouter from "./routes/public"
import adminRouter from "./routes/admin"

dotenv.config()

const app = express()

// Basic CORS (configurable origin)
const allowedOrigin = process.env.CORS_ORIGIN || "*"
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigin)
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-admin-key")
  if (req.method === "OPTIONS") {
    return res.sendStatus(204)
  }
  return next()
})

app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/", publicRouter)
app.use("/api/admin", adminRouter)

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Basic error logging; extend with structured logging and Sentry later
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err)
  res.status(500).json({ message: "Internal server error" })
}

app.use(errorHandler)

const port = Number(process.env.PORT || 4000)

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Gift of Time API listening on port ${port}`)
})

