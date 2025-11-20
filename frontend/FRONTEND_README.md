# MindCubes Frontend

A modern, futuristic, and eye-friendly frontend for the MindCubes AI Agent platform built with Next.js 16, React 19, and Tailwind CSS 4.

## 🎨 Design Philosophy

- **Modern & Futuristic**: Clean, contemporary design with subtle futuristic elements
- **Eye-Friendly**: Carefully chosen color palette that's easy on the eyes
- **No Harsh Neon**: Professional gradients and soft colors instead of bright neons
- **Cohesive Design**: Consistent design language across all pages
- **Responsive**: Works perfectly on all device sizes

## 📁 Project Structure

```
frontend/
├── app/
│   ├── components/         # Reusable components
│   │   ├── Navbar.tsx      # Navigation bar with responsive menu
│   │   ├── Footer.tsx      # Footer with links
│   │   └── Loading.tsx     # Loading state component
│   ├── agents/             # AI Agents management page
│   ├── chat/               # Interactive chat interface
│   ├── login/              # Login page
│   ├── models/             # AI Models management page
│   ├── register/           # Registration page
│   ├── tasks/              # Task management page
│   ├── globals.css         # Global styles and custom CSS
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── not-found.tsx       # 404 page
└── public/                 # Static assets
```

## 🚀 Pages Overview

### 1. Landing Page (`/`)
- Hero section with gradient text and call-to-action buttons
- Floating agent cards with animations
- Features section showcasing platform capabilities
- Call-to-action section
- Professional footer

### 2. Login Page (`/login`)
- Clean authentication form
- Social login options (Google, GitHub)
- Remember me and forgot password options
- Animated background decorations
- Demo mode: Redirects to chat without actual authentication

### 3. Register Page (`/register`)
- Comprehensive registration form
- Terms of service checkbox
- Social signup options
- Form validation
- Demo mode: Redirects to chat without actual authentication

### 4. Chat Page (`/chat`)
- Interactive chat interface with AI agents
- Agent selection sidebar
- Real-time message display
- Message history
- Loading states with animated dots
- Recent chats sidebar
- Beautiful message bubbles with gradients

### 5. Agents Page (`/agents`)
- Grid of specialized AI agents
- Detailed agent cards with:
  - Icon and status badge
  - Description and capabilities
  - Performance metrics (tasks completed, accuracy)
  - Technology tags
  - Quick action buttons
- Stats overview (total agents, tasks, accuracy)

### 6. Models Page (`/models`)
- AI model management interface
- Model cards showing:
  - Provider information (OpenAI, Anthropic, Meta, etc.)
  - Type (API, Local, Fine-tuned)
  - Specifications (context window, speed, cost)
  - Status badges
- Active training jobs section with progress bars
- Actions for adding/importing models

### 7. Tasks Page (`/tasks`)
- Comprehensive task management dashboard
- Task statistics overview (total, completed, running, failed, pending)
- Task cards showing:
  - Task details and status
  - Agent assignment
  - Priority levels
  - Progress bars for running tasks
  - Duration and error information
- Filtering and search functionality
- Task actions (view, stop, retry)

### 8. 404 Page (`/not-found`)
- Custom 404 error page
- Large gradient "404" text
- Quick navigation links
- Animated background

## 🎨 Color Palette

The design uses a carefully selected color palette that's easy on the eyes:

**Light Mode:**
- Primary: Indigo (#4f46e5)
- Secondary: Cyan (#06b6d4)
- Accent: Purple (#8b5cf6)
- Background: White (#ffffff)
- Text: Dark gray (#0f1419)

**Dark Mode:**
- Primary: Lighter Indigo (#6366f1)
- Secondary: Lighter Cyan (#22d3ee)
- Accent: Lighter Purple (#a78bfa)
- Background: Very dark blue (#0a0a0f)
- Text: Light gray (#e5e7eb)

## ✨ Special Features

### 1. Gradient Text
Uses CSS background-clip for beautiful gradient text effects on headings.

### 2. Glass Effect
Backdrop blur effects on navigation and certain cards for a modern glassmorphism look.

### 3. Floating Animations
Subtle floating animations on hero cards and decorative elements.

### 4. Responsive Navigation
Mobile-friendly navigation with hamburger menu.

### 5. Status Badges
Color-coded status badges for agents, models, and tasks:
- Green: Active/Completed
- Blue: Running
- Yellow: Beta/Pending
- Red: Failed

### 6. Progress Bars
Animated gradient progress bars for training jobs and running tasks.

### 7. Interactive Cards
Hover effects on all cards with smooth transitions.

## 🔧 Running the Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`.

## 🌐 Navigation

All pages are accessible through the navigation bar:
- **Home** (`/`) - Landing page
- **Features** (`/#features`) - Scroll to features section
- **Agents** (`/agents`) - AI agents overview
- **Models** (`/models`) - Model management
- **Chat** (`/chat`) - Interactive chat
- **Tasks** (`/tasks`) - Task management
- **Login** (`/login`) - Login page
- **Get Started** (`/register`) - Registration page

## 🎯 Demo Mode

For demonstration purposes, the authentication pages (login/register) are set up to redirect to the chat page without actual authentication. This allows you to explore all pages freely.

## 🔄 Next Steps

To connect the frontend to your backend:

1. Update API endpoints in each page
2. Implement actual authentication logic
3. Connect to WebSocket for real-time chat
4. Integrate with backend API for agents, models, and tasks
5. Add state management (e.g., Redux, Zustand) if needed

## 📝 Notes

- The design is fully responsive and works on all screen sizes
- Dark mode is automatically detected from system preferences
- All animations are performance-optimized
- The color scheme is designed to reduce eye strain during extended use
- SVG icons are used for crisp rendering at any size

## 🎨 Customization

You can easily customize the design by modifying:
- Colors in `globals.css` (`:root` variables)
- Gradient combinations in component files
- Animation durations and effects
- Spacing and sizing using Tailwind classes

Enjoy building with MindCubes! 🚀

