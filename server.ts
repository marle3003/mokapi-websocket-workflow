import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const port = process.env.PORT || 4300
const root = path.dirname(new URL(import.meta.url).pathname)

const server = http.createServer((req, res) => {
  const file = req.url === '/' ? '/index.html' : req.url
  if (!file) {
    return
  }
  const filePath = path.join(root, file)

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    const ext = path.extname(filePath)
    const type = ext === '.html' ? 'text/html' : 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type })
    res.end(data)
  })
})

server.listen(port, () => {
  console.log(`serving ${root} at http://localhost:${port}`)
})
