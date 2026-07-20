# CollabDocs — Collaborative Document Editor

A lightweight Google Docs-inspired collaborative editor.

## Tech Stack
- **Frontend:** Next.js 16, TipTap, Tailwind CSS → deployed on Vercel
- **Backend:** Node.js, Express, MongoDB Atlas → deployed on Render

## Project Structure
```
collab-editor/
├── client/    # Next.js frontend
└── server/    # Express backend
```

## Local Development

### Backend
```bash
cd server
npm install
npm run dev   # runs on port 5000
```

### Frontend
```bash
cd client
npm install
npm run dev   # runs on port 3000
```

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Client (`client/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
