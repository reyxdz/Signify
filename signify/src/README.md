# Signify Landing Page

A modern, minimal, and professional landing page for Signify - a secure digital signature application similar to DocuSign.

## 🏗️ Project Architecture

```
src/
├── components/
│   ├── Header/
│   │   ├── Header.js       # Navigation and logo
│   │   └── Header.css      # Header styling
│   ├── Hero/
│   │   ├── Hero.js         # Main hero section with CTA
│   │   └── Hero.css        # Hero styling
│   ├── Features/
│   │   ├── Features.js     # Feature cards showcase
│   │   └── Features.css    # Features styling
│   ├── CTA/
│   │   ├── CTA.js          # Call-to-action section
│   │   └── CTA.css         # CTA styling
│   └── Footer/
│       ├── Footer.js       # Footer with links and social
│       └── Footer.css      # Footer styling
├── styles/
│   └── globals.css         # Global CSS variables and utilities
├── assets/                 # Images, icons, and other assets
├── App.js                  # Main app component
├── App.css                 # App-level styles
├── index.js                # React entry point
└── index.css               # Global index styles
```

## 🎨 Features

- **Responsive Design**: Fully responsive from mobile to desktop
- **Modern UI**: Clean and professional design inspired by leading SaaS platforms
- **Accessibility**: WCAG compliant with proper semantic HTML
- **Performance**: Optimized with smooth animations and transitions
- **Component-Based**: Modular, reusable React components

## 📱 Components

### Header
- Sticky navigation bar
- Logo branding
- Navigation links (Features, Benefits, Pricing, Contact)
- Sign In and Get Started buttons
- Mobile hamburger menu

### Hero
- Compelling headline
- Supporting subtitle
- Primary and secondary CTAs
- Animated placeholder image
- Trust indicators

### Features
- 6 feature cards with icons
- Hover animations
- Responsive grid layout
- Professional descriptions

### CTA (Call-to-Action)
- Gradient background
- Strong messaging
- Primary and secondary buttons
- Supporting text

### Footer
- Company branding
- Navigation links (Product, Company, Legal)
- Social media links
- Compliance badges
- Copyright information

## 🎯 Color Scheme

- **Primary**: #2563eb (Blue)
- **Primary Dark**: #1d4ed8 (Darker Blue)
- **Text Primary**: #1f2937 (Dark Gray)
- **Text Secondary**: #6b7280 (Medium Gray)
- **Border**: #e5e7eb (Light Gray)
- **Background**: #ffffff (White)

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 📦 Dependencies

- React 19.2.4
- React DOM 19.2.4
- React Scripts 5.0.1

## 🔧 Customization

### Updating Colors
Edit CSS variables in `src/styles/globals.css`:
```css
:root {
  --primary-color: #2563eb;
  /* Update other colors */
}
```

### Adding Content
- Update component text directly in JavaScript files
- Add images to `src/assets/` and import them
- Modify styling in component CSS files

### Responsive Breakpoints
- **Mobile**: max-width: 640px
- **Tablet**: max-width: 768px
- **Desktop**: max-width: 968px+

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📄 License

All rights reserved - Signify
