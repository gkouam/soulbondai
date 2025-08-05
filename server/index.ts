import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { initializeSocketServer } from "./socket-handler"
import { validateEnv } from "../lib/env-validation"

// Validate environment variables before starting
validateEnv()

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // Initialize Socket.IO
  const io = initializeSocketServer(httpServer)
  
  // Make io available globally
  global.io = io

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket server initialized`)
  })
})