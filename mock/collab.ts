import { on } from 'mokapi'

// one entry per docId: { content, version, users: Set }
const docs: Record<string, any> = {}

function getDoc(docId: string) {
  if (!docs[docId]) {
    docs[docId] = { content: '', version: 0, users: new Set() }
  }
  return docs[docId]
}

function syncMessage(doc: any) {
  return {
    content: doc.content,
    version: doc.version,
    users: Array.from(doc.users)
  }
}

export default function () {
  on('websocket', function (event) {
    const docId = event.channel.params.docId
    const doc = getDoc(docId)

    if (event.type === 'connect') {
      const userId = event.client.query['userId']
      doc.users.add(userId)

      // catch the new client up on everything that happened before they joined
      event.client.send(syncMessage(doc))

      // let everyone else know someone new showed up
      event.broadcast({ userId, status: 'joined' })
    }

    if (event.type === 'message') {
      const patch = event.message

      // reject stale patches: this client was working off an old version
      if (patch.version < doc.version) {
        event.client.send(syncMessage(doc))
        return
      }

      const before = doc.content.slice(0, patch.offset)
      const after = doc.content.slice(patch.offset + patch.deleteCount)
      doc.content = before + patch.text + after
      doc.version += 1

      event.broadcast(syncMessage(doc))
    }

    if (event.type === 'close') {
      const userId = event.client.query['userId']
      doc.users.delete(userId)
      event.broadcast({ userId, status: 'left' })
    }
  })
}