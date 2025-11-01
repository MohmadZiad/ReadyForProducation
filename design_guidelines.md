# Orange Tool - Comprehensive Design Guidelines

## Design Approach
**System-Based with Custom Brand Enhancement**: Using modern web design principles with a custom orange brand identity, glassmorphism effects, and sophisticated animations. The design prioritizes visual impact while maintaining functionality and accessibility.

## Brand Identity & Visual System

### Color Palette
Primary orange gradient system with warm neutrals:
- **Orange Scale**: #FFF7F0 (50) → #FFE7D6 (100) → #FFD1AD (200) → #FFB680 (300) → #FF9A59 (400) → #FF7A1A (500 Primary) → #E06200 (600)
- **Backgrounds**: #FAFAFA (light), #0F0E0D (dark)
- **Text**: #0E0E0E (primary), #6B6B6B (secondary)
- **Gradients**: 
  - Hero: 135deg from #FF7A1A → #FFA94D → #FFE7D6
  - Glow: Radial 60% at center, rgba(255,122,26,0.25) fading to transparent

### Surface Treatment
- **Glassmorphism**: White/70% opacity (light mode), Neutral-900/50% (dark mode)
- **Borders**: White/20% (light), White/10% (dark)
- **Shadows**: Soft, elevated (0 10px 30px -15px rgba(0,0,0,0.25))
- **Corner Radius**: Large rounded-2xl to rounded-3xl throughout

## Typography
- **Font Families**: Inter for UI elements, Poppins for headings
- **Hierarchy**: 
  - Hero headlines: Extra large, bold, gradient text treatment
  - Section titles: Large, medium weight
  - Body text: Regular weight, sufficient line-height for readability
  - Labels/helpers: Small, subtle color

## Layout System

### Spacing Scale
Use Tailwind units consistently: 2, 4, 6, 8, 12, 16, 20, 24, 32 for padding/margins

### Intro/Splash Screen (1.2s First Load)
- Full viewport centered logo reveal
- Animated gradient background with subtle light particles/streaks
- Logo animation: blur-in + scale 0.96→1 + subtle glow
- Smooth transition to main page via fade + clip-path reveal

### Header (Sticky)
- Transparent background with backdrop blur initially
- Transforms to solid white/dark surface on scroll
- Subtle bottom border (white/20%)
- Elements (left to right): Logo, Language Switcher (AR/EN), Theme Toggle (Light/Dark), Primary CTA
- Height: ~70px, horizontal padding: 6-8

### Hero Section
- **Layout**: Centered content, large headline, supporting text, two prominent CTA buttons
- **Background**: Primary gradient with animated glow layer
- **Decorative Elements**: Animated SVG shapes/patterns with parallax on scroll
- **CTAs**: "Open Assistant" (primary gradient), "Launch Calculator" (secondary outline)
- **Spacing**: Generous vertical padding (py-24 to py-32)

### KPI Cards Section
- **Grid**: 3-4 cards in responsive grid (1 column mobile, 2-4 desktop)
- **Card Design**: 
  - Glassmorphism background
  - Large icon at top (Lucide icons, orange accent)
  - Metric value: Extra large, bold
  - Label: Small, secondary color
  - Hover: Lift 4px, shadow increase, subtle shine effect
- **Metrics**: Response time, uptime %, 24/7 monitoring status

### Feature Grid
- **Layout**: 3-column grid (1 on mobile)
- **Features**: "Instant Results", "Smart Pro-Rata", "Live Library"
- **Card Structure**:
  - Large iconic illustration/icon
  - Feature title (medium-large, bold)
  - Description text (2-3 lines)
  - Rounded-3xl cards with hover lift

### Summary Panel
- **Cards**: Result cards with live data (or placeholder states)
- **Animations**: Framer Motion layout spring for card transitions
- **Design**: Glassmorphism cards with subtle borders

### Optional Sticky Dock
- **Position**: Fixed bottom-right
- **Elements**: 
  - Floating action button for "Magnifier"
  - Processing progress indicator (0-100%)
  - Compact, pill-shaped design with shadow

## Component Library

### Buttons
- **Primary**: 
  - Rounded-2xl, px-5 py-2.5, medium font weight
  - Background: Orange gradient (135deg, #FF7A1A → #FFA94D)
  - Hover: Lift 1px, increase glow
  - Active: Return to baseline
  - Shadow for depth
- **Secondary**: Outline style with orange border, transparent background
- **Ghost**: No background, orange text, subtle hover background

### Cards
- **Base**: Rounded-3xl, glassmorphism background
- **Border**: 1px solid white/20% (light) or white/10% (dark)
- **Shadow**: Soft elevated shadow
- **Hover**: Lift 4px, shadow intensifies, subtle shine gradient overlay

### Form Inputs
- **Style**: Large, pill-shaped (rounded-2xl)
- **Focus**: Orange ring (2px)
- **Label**: Small text above input
- **Helper**: Small text below, secondary color
- **States**: Clear focus, error, success states

### Badges/Chips
- **Design**: Small rounded-full pills
- **Colors**: Orange/100 background for active states
- **Icons**: Lucide icons, proportional sizing

## Page-Specific Components

### Calculator Page
- **Form Cards**: Modern glassmorphism cards
- **Formula Display**: Elegant typography with highlighted variables
- **Result Panel**: Large, prominent display of calculations

### Pro-Rata Page
- **Progress Bar**: Orange gradient fill, rounded-full
- **Chart**: Recharts integration with brand colors
- **Data Cards**: Summary metrics in grid layout

### Assistant Page
- **Chat Interface**: Clean conversation layout
- **Message Bubbles**: 
  - User: Orange gradient edges, right-aligned
  - Assistant: Neutral background, left-aligned
- **Typing Indicator**: Animated dots
- **Input**: Fixed bottom, large text area with send button

### Docs Page
- **Background**: Glassmorphism overlay
- **Search**: Prominent search bar at top
- **Document List**: Cards with titles, descriptions, tags
- **Instant Filter**: Real-time search results

## Motion System (Framer Motion)

### Duration Guidelines
- **UI Interactions**: 180-260ms (buttons, hovers, toggles)
- **Page Transitions**: 480-700ms (route changes, major reveals)
- **Scroll Reveals**: 400ms with stagger for children

### Easing
- **Standard**: Cubic-bezier(0.22, 1, 0.36, 1) - springy feel
- **Spring**: Use for cards, charts, layout shifts

### Scroll-Based Animations
- **Reveal Pattern**: Elements fade + slide up as they enter viewport
- **Trigger**: Once (no repeat)
- **Parallax**: Hero decorative elements move slower than scroll

### Hover States
- **Standard Lift**: translateY(-4px)
- **Shadow**: Transition from sm to md
- **Shine Effect**: Gradient overlay with mask-image
- **Duration**: 180ms

## Accessibility

### Contrast
- All text/background combinations ≥ 4.5:1
- Orange buttons use sufficient contrast for readability

### Keyboard Navigation
- All interactive elements keyboard accessible
- Clear focus rings (orange, 2px)
- Logical tab order

### Focus Indicators
- Visible on all interactive elements
- Orange accent color
- Sufficient size/thickness

## Responsive Behavior

### Breakpoints
- **Mobile**: Base (< 640px) - single column layouts
- **Tablet**: md (640-1024px) - 2 columns where appropriate
- **Desktop**: lg (> 1024px) - full multi-column grids

### Layout Adaptations
- Header: Hamburger menu on mobile, full nav on desktop
- Hero: Maintain prominence, adjust text sizes
- Grids: Collapse to single column, then expand
- Cards: Full-width mobile, grid desktop

## Theme & Language Support

### Dark Mode
- Toggle in header switches `class="dark"` on HTML element
- All components support both themes
- Preference saved to LocalStorage

### RTL/LTR Support
- Language switcher in header (Arabic/English)
- Updates `dir` and `lang` attributes on HTML
- All layouts flip appropriately
- Icon directionality preserved (semantic icons don't flip)
- Preference saved to LocalStorage

## Feature Flag System
- Environment variable: `NEXT_PUBLIC_ORANGE_NEW_UI`
- When true: Show new design
- When false: Show original interface
- Allows gradual rollout and A/B testing

## Images
**Hero Section**: Large, full-width background image with gradient overlay showing modern technology/tools or abstract orange-themed patterns. The image should be high-quality and professionally shot. Buttons placed on hero use backdrop blur backgrounds for visibility.

## Performance Requirements
- Lighthouse score ≥ 90 for performance
- Optimized SVG icons
- Lazy load images
- Font prefetching (Inter, Poppins)
- Minimal animation impact on performance