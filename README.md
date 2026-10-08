# Topaze Notes

Topaze Notes is a collaborative and interconnected knowledge base application. It allows you to create, organize, and link notes in real-time.

## Key Features

- Real-Time Collaboration: Edit notes simultaneously with other users using WebRTC peer-to-peer synchronization.
- Bi-directional Links: Connect notes together using the @ mention syntax.
- Interactive Graph View: Visualize the connections between all your notes through an interactive, physics-based network graph.
- Rich Text Editor: Write formatting-rich notes using Markdown syntax (headings, bold, italic, code blocks, interactive task lists).
- Global Search: Quickly find any note by title or content using the full-text search command palette (Cmd+K).
- Hierarchical Organization: Group notes into nested folders for better structure.
- Author Tracking: See who created each note or folder directly in the interface.
- Presence Avatars: See which users are currently viewing or editing the same note.

## Tech Stack

- Frontend: React (Vite, TypeScript)
- Styling: Vanilla CSS
- Database and Auth: Firebase (Firestore, Authentication)
- Rich Text Editor: Tiptap
- Collaboration: Yjs, y-webrtc
- Graph Visualization: React Force Graph

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   npm install

3. Setup Firebase:
   Create a Firebase project, enable Authentication (Email/Password) and Firestore Database.
   Replace the Firebase configuration in src/firebase.ts.

4. Start the development server:
   npm run dev

## Build for Production

To create a production build, run:
npm run build

The optimized assets will be available in the dist directory, ready to be deployed.
