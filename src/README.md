# Chat Application Architecture

## Overview
This chat application is built with a clean architecture pattern that separates business logic from UI components. The application follows a modular approach with dedicated directories for different concerns.

## Directory Structure

```
client/src/
├── app/             # Next.js application routes
│   └── chat/        # Chat module pages and layouts
├── components/      # UI components 
│   └── chat/        # Chat-specific UI components
├── features/        # Feature-specific utilities and logic
│   └── chat/        # Chat feature utilities
├── hooks/           # Custom React hooks
├── lib/             # Core utilities and services
│   ├── api/         # API client services
│   └── socket/      # Socket.io connection and event handling
├── store/           # Global state management
└── types/           # TypeScript types
```

## Architectural Principles

### Separation of Concerns
The codebase follows a strict separation between:
- **UI Components**: Focused only on presentation and user interaction
- **Business Logic**: Extracted into hooks and utilities
- **Data Management**: Handled by stores and services

### Hooks
Custom hooks encapsulate complex logic:
- `useSocketConnection`: Manages socket.io connections, reconnection, and error handling
- `useChatMessaging`: Handles messaging, typing indicators, and room selection

### Utilities
Utility functions in the features directory:
- Format data for display
- Process and transform data
- Handle specific domain operations

### Components
UI components are kept simple and focused on rendering:
- They receive data and callbacks via props
- They don't contain complex business logic
- They delegate complex operations to hooks

## State Management
- Global application state is managed using Zustand
- Component-specific state is managed using React's useState and useEffect
- Socket connection state is handled in dedicated hooks

## Benefits of This Architecture
- **Maintainability**: Each part of the system has a clear responsibility
- **Testability**: Business logic is isolated and easier to test
- **Reusability**: Hooks and utilities can be reused across the application
- **Readability**: Components are simpler and easier to understand
- **Scalability**: Easy to add new features without affecting existing ones

## Styling
The application uses Tailwind CSS for styling with consistent design tokens for:
- Colors
- Spacing
- Typography
- Responsive design

## Data Flow
1. Socket connection is established at the layout level
2. Chat messaging logic is handled by the useChatMessaging hook
3. UI components render the data and handle user interactions
4. User actions trigger callbacks that are processed by hooks
5. Updated state flows back to components for rendering 