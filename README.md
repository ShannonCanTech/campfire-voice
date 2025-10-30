# 🔥 Campfire Chat

**Chat around the digital campfire** - A real-time chat application built for Reddit's Devvit platform that brings Redditors together through interest-based conversations.

## What is Campfire Chat?

Campfire Chat is an interactive social application that creates virtual "campfires" where Reddit users can gather for real-time conversations. Users discover and join chat rooms based on shared interests, creating meaningful connections within the Reddit community.

### Key Features

- **🎯 Interest-Based Matching**: Select up to 5 interests to get personalized chat room recommendations
- **💬 Real-Time Conversations**: Live messaging with instant delivery and connection status indicators
- **🏕️ Room Discovery**: Browse active chat rooms with live participant counts and activity indicators
- **👥 Community Integration**: Seamlessly integrated with Reddit user profiles and authentication
- **📱 Mobile-First Design**: Responsive interface optimized for both mobile and desktop experiences
- **🔍 Smart Search**: Find chat rooms by title, topic, or interest tags
- **⚡ Live Updates**: Real-time notifications for new rooms, messages, and user activity

## What Makes This Innovative?

1. **Reddit-Native Experience**: Built specifically for Reddit's ecosystem, leveraging Reddit user profiles and community features
2. **Interest-Driven Discovery**: Advanced matching algorithm that connects users based on shared interests rather than random pairing
3. **Persistent Chat Rooms**: Unlike ephemeral chat apps, rooms persist and build ongoing communities around specific topics
4. **Real-Time Without WebSockets**: Innovative use of Devvit's real-time channels for instant messaging without traditional WebSocket infrastructure
5. **Campfire Metaphor**: Unique branding that evokes the warmth and community feeling of gathering around a campfire

## How to Play/Use Campfire Chat

### Step 1: Welcome & Onboarding
1. **Launch the App**: Click "Join the Conversation" on the animated splash screen
2. **Select Your Interests**: Choose up to 5 topics you're passionate about from the interest grid
   - Browse categories like Technology, Gaming, Art, Music, Sports, etc.
   - Each interest shows how many active chat rooms are available
   - You can skip this step, but selecting interests improves your experience

### Step 2: Discover Chat Rooms
1. **Browse Active Rooms**: View live chat rooms on the discovery page
2. **Filter Options**: 
   - **All Rooms**: See every active chat room
   - **My Interests**: View rooms matching your selected interests
3. **Room Information**: Each room shows:
   - Title and topic description
   - Number of active participants
   - Last activity time
   - Interest tags
   - Creator information

### Step 3: Join Conversations
1. **Join a Room**: Click "Join Conversation" on any room card
2. **Real-Time Chat**: 
   - Send messages instantly to all participants
   - See live typing indicators and connection status
   - View message history and participant list
3. **Room Features**:
   - View participant list and room information
   - Leave room at any time
   - Room creators can delete their rooms

### Step 4: Create Your Own Room
1. **Create New Room**: Use the "Create Room" button in navigation
2. **Room Setup**:
   - Choose an engaging title
   - Write a descriptive topic
   - Select relevant interest tags
   - Set room visibility preferences
3. **Manage Your Room**: As creator, you can moderate and delete your room

### Step 5: Search & Explore
1. **Search Functionality**: Find specific rooms by keywords
2. **Interest Exploration**: Discover new topics and communities
3. **Live Updates**: Get notified when new rooms are created in your interests

## Technical Stack

- **[Devvit](https://developers.reddit.com/)**: Reddit's developer platform for immersive applications
- **[React](https://react.dev/)**: Frontend UI framework with TypeScript
- **[Vite](https://vite.dev/)**: Build tool and development server
- **[Express](https://expressjs.com/)**: Backend API server
- **[Redis](https://redis.io/)**: Data persistence via Devvit's Redis integration
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first styling framework
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development

## Development Commands

> **Prerequisites**: Node.js 22+ required

- `npm run dev`: Start development server with live Reddit integration
- `npm run build`: Build client and server for production
- `npm run deploy`: Upload new version to Reddit
- `npm run launch`: Publish app for Reddit review
- `npm run login`: Authenticate with Reddit developers
- `npm run check`: Run type checking, linting, and formatting

## Getting Started for Developers

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Open the provided Reddit playtest URL to test the app live
5. Make changes and see them reflected in real-time

## Project Structure

```
src/
├── client/          # React frontend application
│   ├── pages/       # Main application screens
│   ├── components/  # Reusable UI components
│   ├── services/    # API and real-time clients
│   └── utils/       # Helper functions and validation
├── server/          # Express backend API
│   ├── data/        # Redis data access layer
│   └── services/    # Business logic services
└── shared/          # Shared types and utilities
    └── types/       # TypeScript type definitions
```

---

*Built with ❤️ for the Reddit community using Devvit*
