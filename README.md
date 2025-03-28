# Real-Time Chat Application (Client)

This is the client-side application for a modern real-time chat application built with Next.js and Socket.io.

## Features

- Real-time messaging with Socket.io
- User authentication (login/register)
- Private conversations
- Group chats
- Message read status
- Online/offline user status

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Socket.io Client
- Zustand (State Management)
- Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory with the following content:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/app` - Next.js App Router pages
- `/components` - Reusable UI components
- `/lib` - Utility functions and API services
  - `/api` - API service functions
  - `/socket` - Socket.io configuration
- `/store` - Zustand state management

## Deployment

Build the application for production:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

Then start the production server:

```bash
npm start
# or
yarn start
# or
pnpm start
```
