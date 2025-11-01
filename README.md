# Orange Tool - Premium UI/UX Redesign

A modern, production-ready web application featuring advanced animations, bilingual support (Arabic/English), dark mode, and intelligent tools for business calculations.

## Features

### Core Features
- **Animated Splash Screen**: 1.2s elegant intro with logo reveal and gradient background
- **Bilingual Support**: Full Arabic/English localization with RTL/LTR layout switching
- **Dark Mode**: Seamless theme toggle with localStorage persistence
- **Responsive Design**: Mobile-first approach with beautiful layouts across all devices

### Pages
- **Home**: Hero section with parallax effects, KPI cards, feature grid, and activity summary
- **Calculator**: Advanced calculator with multiple calculation types and formula display
- **Pro-Rata**: Intelligent pro-rata calculations with interactive charts
- **Assistant**: AI-powered chat interface with typing indicators
- **Documentation**: Searchable documentation library with glassmorphism design

### Design System
- **Brand Colors**: Premium orange gradient palette (#FF7A1A primary)
- **Glassmorphism**: Elegant frosted glass effects throughout
- **Animations**: Framer Motion powered micro-interactions and page transitions
- **Typography**: Inter for UI, Poppins for headings
- **Accessibility**: WCAG compliant with 4.5:1 contrast ratios and keyboard navigation

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd orange-tool
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional):
Create a `.env` file in the root directory to enable/disable the new UI:
```env
VITE_ORANGE_NEW_UI=true
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Tech Stack

### Frontend
- **React 18+**: Modern React with hooks
- **Vite**: Lightning-fast build tool
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **Framer Motion**: Production-ready animation library
- **Wouter**: Lightweight routing
- **TanStack Query**: Powerful data fetching and caching
- **React Hook Form**: Performant form validation
- **Recharts**: Composable charting library
- **Lucide React**: Beautiful icon library

### Backend
- **Express**: Fast Node.js web framework
- **Drizzle ORM**: TypeScript ORM
- **In-Memory Storage**: Fast prototyping with MemStorage

## Project Structure

```
orange-tool/
├── client/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── KPICards.tsx
│   │   │   ├── FeatureGrid.tsx
│   │   │   ├── SummaryPanel.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   ├── GradientButton.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Calculator.tsx
│   │   │   ├── ProRata.tsx
│   │   │   ├── Assistant.tsx
│   │   │   └── Docs.tsx
│   │   ├── lib/             # Utilities and contexts
│   │   │   ├── i18n.ts
│   │   │   ├── theme.tsx
│   │   │   └── language-context.tsx
│   │   ├── index.css        # Global styles and CSS variables
│   │   └── App.tsx          # Main app component
│   └── index.html
├── server/
│   ├── routes.ts            # API routes
│   └── storage.ts           # Data storage interface
├── shared/
│   └── schema.ts            # Shared TypeScript types
├── tailwind.config.ts       # Tailwind configuration
└── design_guidelines.md     # Complete design specifications
```

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

### Design Guidelines

The project follows strict design guidelines outlined in `design_guidelines.md`. Key principles:

- **Orange gradient palette** for brand consistency
- **Glassmorphism effects** for modern aesthetic
- **Rounded-3xl corners** for soft, premium feel
- **Smooth animations** with 180-700ms durations
- **Accessibility first** with proper contrast and keyboard support

### Theme Customization

Colors can be customized in `client/src/index.css`:

```css
:root {
  --orange-500: 24 100% 54%;  /* Primary brand color */
  --orange-400: 28 100% 68%;  /* Secondary brand color */
  /* ... more color variables */
}
```

### Language Support

Add new languages in `client/src/lib/i18n.ts`:

```typescript
export const translations = {
  en: { /* English translations */ },
  ar: { /* Arabic translations */ },
  // Add more languages here
}
```

## Feature Flag

The application supports a feature flag to toggle between the new premium UI and a legacy interface:

Set `VITE_ORANGE_NEW_UI=true` in your environment to enable the new design (default).

## Performance

- **Lighthouse Score**: Targeting ≥90 for performance and accessibility
- **Optimized animations**: Minimal impact on performance
- **Lazy loading**: Images and components loaded on demand
- **Font optimization**: Preloading critical fonts (Inter, Poppins)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

All rights reserved.

## Support

For questions or support, please refer to the documentation page within the application or contact the development team.

---

Built with ❤️ using modern web technologies
