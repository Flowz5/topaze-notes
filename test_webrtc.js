import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

const doc1 = new Y.Doc()
const provider1 = new WebrtcProvider('test-room-123', doc1)
provider1.awareness.setLocalStateField('user', { name: 'Alice' })

const doc2 = new Y.Doc()
const provider2 = new WebrtcProvider('test-room-123', doc2)
provider2.awareness.setLocalStateField('user', { name: 'Bob' })

setTimeout(() => {
  console.log("Provider 1 awareness states:", Array.from(provider1.awareness.getStates().entries()))
  console.log("Provider 2 awareness states:", Array.from(provider2.awareness.getStates().entries()))
  process.exit(0)
}, 5000)
