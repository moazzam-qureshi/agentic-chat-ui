# Agentic Chat UI

A modern chat interface built with React, TypeScript, and Vite. Features include authentication, real-time messaging, and document management.

## Features

- 🔐 User authentication (Login/Signup)
- 💬 Real-time chat interface
- 📄 Document management
- 🎨 Modern Bootstrap-based UI
- ⚡ Fast development with Vite
- 🔧 TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/moazzam-qureshi/agentic-chat-ui.git
cd agentic-chat-ui
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (copy from `.env.example`):
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

### Deploy to Vercel (Recommended)

1. Fork or clone this repository to your GitHub account

2. Go to [Vercel](https://vercel.com) and sign in with GitHub

3. Click "New Project" and import your repository

4. Vercel will automatically detect the Vite configuration

5. Configure environment variables if needed in the Vercel dashboard

6. Click "Deploy"

Your app will be live at `https://your-project-name.vercel.app`

### Manual Vercel Deployment

If you prefer CLI deployment:

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Run in project directory:
```bash
vercel
```

3. Follow the prompts to deploy

## Docker Support

The project includes Docker configuration for containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up

# Or build manually
docker build -t agentic-chat-ui .
docker run -p 80:80 agentic-chat-ui
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React contexts (Auth, etc.)
├── pages/          # Page components
├── services/       # API services
├── types/          # TypeScript type definitions
└── main.tsx        # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Environment Variables

See `.env.example` for available environment variables. Create a `.env.local` file for local development.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.