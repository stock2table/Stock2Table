# Stock2Table Design Guidelines

## Design Approach: Utility-Focused Design System

**Selected Approach**: Material Design System with clean, efficiency-focused customizations
**Justification**: Stock2Table is a daily-use utility app where efficiency, learnability, and trust are paramount. Users need quick access to meal planning tools without visual distractions.

**Key Design Principles**:
- **Efficiency First**: Minimize cognitive load for daily meal planning decisions
- **Trust & Reliability**: Clean, medical-app-inspired aesthetics to build confidence in AI recommendations
- **Family Accessibility**: Clear hierarchy and readable interfaces for all family members
- **Content-Forward**: Let food imagery and recipe information be the visual stars

## Core Design Elements

### A. Color Palette
**Primary Colors**:
- Light Mode: 142 69% 58% (fresh green - represents healthy cooking)
- Dark Mode: 142 45% 65% (softer green for evening use)

**Supporting Colors**:
- Neutral: 220 8% 46% (sophisticated gray for text/backgrounds)
- Success: 142 69% 58% (matches primary for consistency)
- Warning: 38 92% 50% (warm orange for alerts)
- Background Light: 0 0% 98%
- Background Dark: 222 84% 5%

### B. Typography
**Primary Font**: Inter (Google Fonts) - excellent readability for data-heavy interfaces
**Hierarchy**:
- Headers: Inter 600 (Semi-bold)
- Body: Inter 400 (Regular) 
- Captions: Inter 400 (Regular, smaller size)
- UI Elements: Inter 500 (Medium)

### C. Layout System
**Spacing Scale**: Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Tight spacing (p-2, m-2) for compact list items
- Standard spacing (p-4, m-4) for cards and sections  
- Generous spacing (p-6, p-8) for major layout divisions

### D. Component Library

**Navigation**: 
- Bottom tab bar for core functions (Pantry, Recipes, Plans, Shopping)
- Clean top navigation with search and family account switching

**Cards**: 
- Recipe cards with rounded corners, subtle shadows
- Ingredient cards with checkable states
- Meal plan cards showing day/week views

**Forms**: 
- Single-column layouts for dietary preferences
- Toggle switches for family member inclusion
- Smart input fields with AI assistance indicators

**Data Displays**:
- Clean list views for recipes and ingredients
- Calendar-style meal planning grids
- Progress indicators for meal prep steps

**Overlays**:
- Modal sheets for recipe details
- Quick-action bottom sheets for adding ingredients
- Confirmation dialogs with clear primary actions

### E. Animations
**Minimal Animation Strategy**:
- Subtle loading states during AI processing
- Smooth transitions between meal planning views
- No decorative animations that slow down daily workflows

## Images
**Food Photography**: High-quality recipe images in 16:9 aspect ratio cards
**Ingredient Recognition**: Camera viewfinder interface with scanning indicators  
**No Large Hero Image**: This is a utility app - launch directly into functional interface
**Family Icons**: Simple illustrated avatars for family member profiles
**Empty States**: Friendly illustrations encouraging first-time recipe additions

## Accessibility & Family Features
- High contrast ratios for all age groups
- Large touch targets (44px minimum) for easy family use
- Clear visual hierarchy distinguishing AI suggestions from user actions
- Consistent dark mode implementation across all screens and form inputs
- Voice input indicators and feedback for hands-free cooking scenarios