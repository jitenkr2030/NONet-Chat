# NoNet Chat

🧠 **Chat without internet. Works online and offline.**

NoNet Chat is a powerful hybrid messaging application that automatically switches between internet-based messaging and local mesh networking, ensuring seamless communication even during network failures, disasters, or internet shutdowns.

## 🚀 Core Features

### 📡 **Hybrid Connectivity Engine**
- ✅ Automatically detects network availability
- ✅ Chooses best transport: Internet (when available) or Mesh network (when offline)
- ✅ Zero manual switching required
- ✅ Uninterrupted communication
- ✅ Works in low-connectivity areas

### 💬 **Offline-First Messaging**
- ✅ Messages are stored locally first
- ✅ Instant UI response
- ✅ Automatic delivery when a route becomes available
- ✅ No message loss
- ✅ Smooth WhatsApp-like experience
- ✅ Works even if app crashes or phone restarts

### 🌐 **Mesh Network Chatting**
- ✅ Device-to-device messaging
- ✅ Multi-hop message relay
- ✅ Store-and-forward delivery
- ✅ Auto peer discovery
- ✅ Works during internet shutdowns
- ✅ Messages travel via nearby phones

### 👥 **One-to-One & Group Chats**
- ✅ Private encrypted chats
- ✅ Local mesh groups
- ✅ Internet-based global groups
- ✅ Personal + community communication
- ✅ Works online and offline

### 📎 **Media & File Sharing**
- ✅ Image, video, document sharing
- ✅ Chunked file transfer
- ✅ Resume interrupted transfers
- ✅ Reliable transfers
- ✅ Optimized for low bandwidth
- ✅ File encryption for sensitive content

### 🔐 **Privacy & Security**
- ✅ End-to-end encryption
- ✅ Device-based identity (no phone number required)
- ✅ Offline key exchange (QR code)
- ✅ No central surveillance
- ✅ Ideal for journalists & activists

### 📢 **Broadcast & Emergency Mode**
- ✅ Area-wide broadcast messages
- ✅ SOS alerts
- ✅ Emergency channels auto-enabled offline
- ✅ Disaster-ready communication
- ✅ Government / NGO adoption potential

### 🧠 **Smart Routing & Optimization**
- ✅ Shortest path routing
- ✅ Battery-aware message relays
- ✅ Hop-limit control
- ✅ Efficient energy usage
- ✅ Stable mesh performance

### 🔔 **Message Status & Sync**
- ✅ Sending / Sent / Delivered / Read status
- ✅ Retry on failure
- ✅ Auto-sync when internet returns
- ✅ User confidence
- ✅ Reliable delivery tracking

### ⚙️ **App Controls & Settings**
- ✅ Internet-only / Mesh-only mode
- ✅ Battery saver mode
- ✅ Visibility control (discoverable / hidden)
- ✅ Language & theme selection
- ✅ Profile management
- ✅ Data export/import

## 🛠 Tech Stack

### 📱 **Frontend (Web App)**
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with shadcn/ui
- **State Management**: Zustand with persistence
- **Real-time**: Socket.IO client
- **Icons**: Lucide React

### 📡 **Networking Layer**
- **Internet Mode**: WebSocket (real-time chat) + REST API
- **Mesh Mode**: Bluetooth LE + Wi-Fi Direct (simulation)
- **Transport Selection**: Intelligent automatic switching

### 🔐 **Security**
- **Encryption**: AES-256 encryption
- **Key Exchange**: ECC / RSA key exchange
- **Storage**: Secure encrypted local storage
- **Identity**: QR-based identity verification

### 🗄 **Data Storage**
- **Database**: Prisma ORM with SQLite
- **Local Storage**: IndexedDB for files and messages
- **Caching**: Local memory caching
- **Persistence**: Offline-first data storage

### ☁️ **Backend Services**
- **Main API**: Next.js API routes
- **Chat Service**: Socket.IO server (port 3001)
- **File Service**: Local file handling with encryption
- **Broadcast Service**: Emergency messaging system

## 🎯 Ideal Use Cases

- 🚫 **Internet Shutdowns** - Stay connected when governments shut down the internet
- 🆘 **Disaster & Emergency Response** - Coordinate help during natural disasters
- 🏞️ **Rural & Remote Areas** - Connect where internet infrastructure is poor
- 🏫 **Campus & Events** - Create local networks without internet dependency
- 📰 **Journalists & NGOs** - Secure communication in sensitive environments
- 📶 **Low-bandwidth Users** - Efficient messaging that works with poor connectivity
- 🔒 **Privacy Advocates** - Communication without surveillance

## 🔥 Key Differentiators

- ✅ **Works without internet** - True offline capability
- ✅ **No phone number required** - Device-based identity
- ✅ **Mesh + cloud hybrid** - Best of both worlds
- ✅ **Offline-first UX** - Instant response, reliable delivery
- ✅ **India-scale ready** - Built for mass adoption
- ✅ **Privacy by design** - End-to-end encryption, no tracking
- ✅ **Emergency ready** - SOS signals and disaster response

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Bun or npm package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jitenkr2030/NONet-Chat.git
   cd NONet-Chat
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up the database**
   ```bash
   bun run db:push
   ```

4. **Start the chat service**
   ```bash
   cd mini-services/chat-service
   bun install
   bun run dev &
   cd ../..
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Open the application**
   - Navigate to `http://localhost:3000`
   - Create your identity with username and display name
   - Start chatting!

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 📱 Usage Guide

### **First Time Setup**
1. Open the app in your browser
2. Click "Create Identity"
3. Enter a username (3-20 characters, alphanumeric + underscores)
4. Enter your display name
5. Your identity is created and stored locally

### **Sending Messages**
1. Click "New Chat" to start a conversation
2. Choose "Direct Chat" or "Create Group"
3. Select users from nearby mesh peers or search for users
4. Type your message and press Enter
5. Messages are sent instantly when online, queued when offline

### **File Sharing**
1. Click the paperclip icon in any chat
2. Drag and drop files or click to browse
3. Supported: Images, videos, documents (up to 50MB)
4. Files are encrypted and can be previewed before download

### **Emergency Broadcasting**
1. Go to the "Broadcast" tab
2. Choose message type: General, Emergency, or SOS
3. Select range: Nearby, Area, or Global
4. Type your message and send
5. SOS signals automatically enable emergency mode

### **Settings & Privacy**
1. Click your profile picture → Settings
2. Configure notifications, privacy, and connectivity
3. Export/import your data for backup
4. Manage your profile and security preferences

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NoNet Chat Architecture                    │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (Next.js + React + Tailwind)                     │
│  ├── Chat Interface                                         │
│  ├── Settings & Profile                                     │
│  └── Broadcast & Emergency                                  │
├─────────────────────────────────────────────────────────────┤
│  State Management (Zustand)                                 │
│  ├── User Authentication                                    │
│  ├── Message Store                                         │
│  └── Connectivity Status                                    │
├─────────────────────────────────────────────────────────────┤
│  Transport Selector                                         │
│  ├── Internet Mode (WebSocket/REST)                        │
│  └── Mesh Mode (Bluetooth/Wi-Fi Direct)                    │
├─────────────────────────────────────────────────────────────┤
│  Services                                                 │
│  ├── MessageService (Offline-first)                        │
│  ├── BroadcastService (Emergency)                           │
│  ├── FileService (Encryption + Storage)                    │
│  └── ConnectivityService (Network Detection)               │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                               │
│  ├── SQLite Database (Prisma)                             │
│  ├── IndexedDB (Local Files)                              │
│  └── LocalStorage (Settings)                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Development

### **Available Scripts**

```bash
# Development
bun run dev          # Start development server
bun run lint          # Run ESLint
bun run build        # Build for production

# Database
bun run db:push       # Push schema to database
bun run db:generate   # Generate Prisma client
bun run db:migrate    # Run database migrations
bun run db:reset      # Reset database

# Chat Service
cd mini-services/chat-service
bun run dev            # Start chat service
```

### **Project Structure**

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── page.tsx          # Main application page
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat interface components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and services
│   ├── auth.ts           # Authentication service
│   ├── broadcast-service.ts # Broadcast service
│   ├── connectivity.ts   # Network detection
│   ├── encryption.ts     # Encryption utilities
│   ├── file-service.ts   # File handling
│   ├── message-service.ts # Messaging service
│   ├── store.ts          # Zustand store
│   ├── websocket.ts      # WebSocket client
│   └── db.ts             # Database client
├── prisma/                # Database schema
│   └── schema.prisma     # Prisma schema
└── mini-services/        # Microservices
    └── chat-service/      # Socket.IO chat service
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write tests for new features
- Update documentation for API changes
- Ensure offline-first functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework for production
- **Socket.IO** - Real-time communication
- **Prisma** - Next-generation ORM
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Beautiful icons
- **Zustand** - Bearbones state management

## 📞 Support

- 📧 **Email**: support@nonet.chat
- 🐛 **Issues**: [GitHub Issues](https://github.com/jitenkr2030/NONet-Chat/issues)
- 📖 **Documentation**: [Wiki](https://github.com/jitenkr2030/NONet-Chat/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/jitenkr2030/NONet-Chat/discussions)

---

🌟 **Star this repository if you find NoNet Chat useful!**

🔄 **Share with others who need offline communication capabilities!**

#NoNetChat #OfflineFirst #MeshNetworking #PrivacyFirst #EmergencyCommunication