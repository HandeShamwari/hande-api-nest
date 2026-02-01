# Project: Hande - Dollar-A-Day Ride Service

## 🚗 PROJECT CONTEXT
- Single-page app (SPA) for ride service like Uber/Lyft
- Drivers subscribe for $1/day instead of commission
- Three main folders: `hande-api/`, `hande-app/`, `hande-landing/`
- Mobile-first, minimalist design with Google Maps as main interface
- No surge pricing, no hidden fees, transparent $1/day model
- Zone-based ride operations with daily earnings cap
- Reduce Network calls, keep Google Maps visible at all times
- Keep the UI simple and intuitive for both drivers and riders
- Keep the App Feeling Smooth Without Frequent GPS Updates

## 🎨 BRAND IDENTITY: "Hande" (means "daily ride")
### Core Brand Colors (USE THESE ONLY)
- Primary Green: `#7ED957` (CTAs, success states, active elements)
- Accent Gold: `#FFB800` (highlight $1 pricing, important info)
- Black: `#000000` (primary text, headings)
- White: `#FFFFFF` (backgrounds, cards)
- Neutral Gray: `#F5F5F5` (secondary backgrounds)
- Dark Gray: `#333333` (secondary text)
- Danger Red: `#FF4C4C` (errors only - NEVER for positive actions)
- Info Blue: `#4DA6FF` (informational states)

### Font
- Primary: "Roboto", sans-serif

### Brand Voice
- **Empowering**: "You're in control" (drivers)
- **Transparent**: "No hidden fees" (riders)
- **Simple**: "$1/day. That's it."
- **Local**: "Support drivers in your community"

### Visual Rules
- ALWAYS highlight `$1` in gold (`#FFB800`)
- ALWAYS show subscription status prominently
- NEVER use red for positive actions
- NEVER hide the $1 pricing
- NEVER use non-brand colors for UI elements
- NEVER use non-standard fonts or colors
- NEVER use non-standard icons for map markers
- ALWAYS use car icons for drivers on map
- ALWAYS use pin icons for available rides
- ALWAYS keep Google Maps visible at all times


## 📍 CORE FEATURES
### Subscription Model
- Drivers pay $1 daily subscription
- Fixed pricing (no surge pricing)
- Zone-based operations
- Daily earnings cap for drivers
- Transparent fee structure

### Ride Requests
- Riders can request rides within zones
- Real-time driver availability on map
- Clear subscription status for drivers
- Simple ride request flow

### Single-Page Design
- Google Maps always visible (70% of screen)
- Bottom panel for user controls (30% of screen)
- NO page reloads - use hash-based navigation
- Slide-up/down panels for actions

### Google Maps Rules
- Show driver locations as car icons
- Show available rides as pin icons
- Use brand colors for map markers
- Highlight subscription zones
- NEVER expose API keys in client code

## 🛠️ TECHNICAL RULES
### API Endpoints
```
POST /api/drivers/subscribe    # $1/day subscription
GET  /api/drivers/status       # Check subscription
POST /api/rides/request        # Only active subscribers
```

### UI/UX Guidelines
- Bottom panel for all user interactions
- Drawer for profile settings
- Use slide animations for panel transitions
- Keep Google Maps visible at all times (70% of screen)
- Simple, clean UI with brand colors
- Clear subscription status display

### File Structure
```
hande-api/      - Laravel backend with subscription logic
hande-app/      - Single-page React Native mobile app
hande-landing/  - Marketing landing page (can be multi-page)
docs/           - Documentation
```

### AVOID
- Multiple page applications in app/
- Surge pricing algorithms
- Commission-based payment models
- Exposing Google Maps API keys in client code
- Page refreshes in main app
- Complex UI layouts that hide the map
- Non-subscription ride requests
- Server-side rendering for main app
- Third-party map services (use Google Maps only)
- Red color for positive actions
- Complicated pricing structures
- Non-brand colors for UI elements
- Dark mode as default
- Syntax errors

