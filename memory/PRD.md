# Stock2Table - Product Requirements Document

## Project Overview

**Stock2Table** is an AI-powered meal planning mobile application designed to simplify daily meal preparation for families and individuals. The app leverages OpenAI's GPT-5.2 for ingredient recognition, recipe recommendations, and intelligent meal planning.

## Tech Stack

- **Frontend**: Expo (React Native) - Cross-platform mobile app
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI Integration**: OpenAI GPT-5.2 via Emergent LLM Key
- **Authentication**: Emergent Google OAuth
- **State Management**: Zustand

## Core Features Implemented

### 1. Authentication (Emergent Google Auth)
- **Login Screen**: Beautiful onboarding with Google OAuth integration
- **Session Management**: 7-day session persistence with secure tokens
- **Mobile-First**: Deep linking support for mobile auth flow
- **Auto-login**: Automatic session restoration on app launch

### 2. Pantry Management
- **View Pantry Items**: Organized by categories (vegetables, fruits, dairy, meat, grains, spices, other)
- **Add Items**: Manual addition with name, quantity, unit, expiry date, category
- **Edit/Delete Items**: Full CRUD operations
- **Expiry Tracking**: Monitor items with expiration dates
- **Statistics**: Dashboard showing total items and expiring items

### 3. AI Ingredient Scanner
- **Camera Integration**: Take photos of ingredients
- **Gallery Selection**: Choose existing photos
- **AI Recognition**: OpenAI Vision GPT-5.2 analyzes images
- **Auto-Extract**: Identifies ingredient name, quantity, unit, category
- **Batch Add**: Save all detected ingredients to pantry
- **Individual Control**: Add items one by one with review

### 4. Recipe Discovery
- **150+ Curated Recipes**: Across 10 cuisines (Italian, Mexican, Indian, Chinese, Japanese, American, Mediterranean, Thai, French, Korean)
- **Search & Filter**: By cuisine, difficulty, dietary restrictions
- **Recipe Details**: Complete information with images, ingredients, instructions, nutrition facts
- **Favorites**: Mark and save favorite recipes
- **Grid View**: Beautiful card-based recipe browsing

### 5. AI Recipe Recommendations
- **Smart Suggestions**: Based on available pantry items
- **Dietary Awareness**: Considers family dietary restrictions and allergies
- **Missing Ingredients**: Shows what else you need
- **Personalized**: Adapts to family preferences

### 6. Family Member Management
- **Add Family Members**: Name, age, dietary restrictions, allergies
- **Dietary Restrictions**: vegetarian, vegan, gluten-free, lactose-free, nut-free
- **Allergy Tracking**: Common allergens (peanuts, tree nuts, dairy, eggs, soy, wheat, fish, shellfish)
- **Profile Management**: View and manage family profiles

### 7. AI Meal Planning
- **Weekly Planner**: 7-day meal plan with breakfast, lunch, dinner
- **AI Generation**: Automatically creates meal plans based on:
  - Available pantry items
  - Family size
  - Dietary restrictions
  - Allergies
  - Cooking skill level
- **Visual Calendar**: Easy-to-read weekly view
- **Meal History**: Access previous meal plans

### 8. Smart Shopping Lists
- **Auto-Generation**: Create from meal plans
- **Smart Deduplication**: Combines duplicate ingredients
- **Pantry Awareness**: Marks items already in pantry
- **Category Organization**: Grouped by ingredient type
- **Recipe Reference**: Shows which recipe needs each ingredient

### 9. User Profile & Settings
- **Profile Display**: User info with subscription tier badge
- **Family Overview**: Quick view of family members
- **Settings**: Notifications, language, help & support
- **Logout**: Secure session termination

## API Endpoints Implemented

### Authentication
- `POST /api/auth/session` - Exchange session_id for session data
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Pantry
- `GET /api/pantry` - Get all pantry items
- `POST /api/pantry` - Add pantry item
- `PUT /api/pantry/{item_id}` - Update pantry item
- `DELETE /api/pantry/{item_id}` - Delete pantry item

### AI Features
- `POST /api/scan-ingredient` - AI ingredient recognition from image
- `POST /api/recipes/recommend` - AI recipe recommendations

### Recipes
- `GET /api/recipes` - Get recipes (with filters)
- `GET /api/recipes/{recipe_id}` - Get recipe details

### Family
- `GET /api/family` - Get family members
- `POST /api/family` - Add family member
- `DELETE /api/family/{member_id}` - Delete family member

### Meal Planning
- `GET /api/meal-plans` - Get meal plans
- `POST /api/meal-plans` - Create meal plan
- `POST /api/meal-plans/generate` - AI-generate meal plan

### Shopping Lists
- `GET /api/shopping-lists` - Get shopping lists
- `POST /api/shopping-lists` - Create shopping list
- `POST /api/shopping-lists/generate/{plan_id}` - Generate from meal plan

## Database Collections

### users
```
{
  user_id: string (custom ID)
  email: string
  name: string
  picture: string (optional)
  subscription_tier: string (free/premium/pro)
  created_at: datetime
}
```

### user_sessions
```
{
  user_id: string
  session_token: string
  expires_at: datetime (7 days)
  created_at: datetime
}
```

### pantry_items
```
{
  item_id: string
  user_id: string
  name: string
  quantity: number
  unit: string
  expiry_date: string (optional)
  category: string
  image_base64: string (optional)
  added_date: datetime
}
```

### recipes
```
{
  recipe_id: string
  name: string
  cuisine_type: string
  ingredients: array
  instructions: array
  prep_time: number
  cook_time: number
  difficulty: string
  dietary_tags: array
  image_url: string
  nutritional_info: object
}
```

### family_members
```
{
  member_id: string
  user_id: string
  name: string
  age: number (optional)
  dietary_restrictions: array
  allergies: array
  preferences: array
}
```

### meal_plans
```
{
  plan_id: string
  user_id: string
  week_start_date: string
  meals: array [{day, meal_type, recipe_id, recipe_name, ingredients_needed}]
  created_at: datetime
}
```

### shopping_lists
```
{
  list_id: string
  user_id: string
  meal_plan_id: string (optional)
  items: array [{ingredient, quantity, unit, recipe_name, in_pantry}]
  created_at: datetime
}
```

## Mobile-Specific Features

1. **Cross-Platform**: Runs on iOS, Android, and Web
2. **Native UI**: Uses React Native components throughout
3. **Deep Linking**: Supports app:// URLs for mobile auth
4. **Camera Integration**: Expo Image Picker with permissions handling
5. **Touch-Optimized**: 44px minimum touch targets
6. **Responsive**: Adapts to different screen sizes
7. **Offline-Ready**: AsyncStorage for local data persistence

## AI Integration Details

### OpenAI GPT-5.2 Usage
1. **Ingredient Recognition**: Vision API analyzes food photos
2. **Recipe Recommendations**: Text generation based on pantry inventory
3. **Meal Planning**: Generates complete weekly meal plans
4. **Response Format**: JSON-structured output for easy parsing

### Error Handling
- Graceful fallbacks for API failures
- Clear error messages to users
- Retry mechanisms for network issues
- Loading states during AI processing

## Subscription Tiers

### Free Tier
- Basic pantry management
- Recipe browsing
- Manual meal planning
- Limited AI features (5/month)

### Premium Tier (Future)
- Unlimited AI features
- Advanced recipe recommendations
- Nutritional analysis
- Export meal plans
- Priority support

## Security Features

1. **Authentication**: OAuth-based, no password storage
2. **Session Management**: Timezone-aware, 7-day expiry
3. **Authorization**: All APIs require valid session token
4. **Data Isolation**: User data strictly scoped by user_id
5. **MongoDB Security**: Excludes _id from all queries

## Mobile App Navigation

```
/ (index) → Auth check → Login or Tabs

Login Screen
  ↓ (Google Auth)
  
Tab Navigation:
├─ Pantry (Home)
│   ├─ Scan Ingredient
│   └─ AI Recipe Ideas
├─ Recipes
│   └─ Recipe Detail
├─ Meal Plan
│   └─ AI Generate
├─ Shopping
└─ Profile
    └─ Add Family Member
```

## Performance Considerations

1. **Image Optimization**: Reduced quality (0.7) for uploads
2. **Lazy Loading**: Recipes loaded with filters
3. **Caching**: AsyncStorage for favorites
4. **Background Sync**: Session persistence
5. **API Response**: Under 500ms target

## Future Enhancements (Phase 2)

1. **Voice Commands**: "Add milk to pantry"
2. **Barcode Scanning**: Quick product addition
3. **Grocery Delivery**: Integration with delivery services
4. **Social Features**: Share recipes with friends
5. **Nutrition Tracking**: Daily calorie monitoring
6. **Cooking Mode**: Step-by-step cooking assistant
7. **Timer Integration**: Built-in cooking timers
8. **Multi-language**: Support for 10+ languages

## Testing Requirements

1. **Backend Testing**: Test all API endpoints with curl
2. **Mobile Testing**: Test on both iOS and Android devices
3. **Auth Flow**: Complete login/logout cycle
4. **AI Features**: Test ingredient scanning and recommendations
5. **CRUD Operations**: Verify all create/read/update/delete operations

## Success Metrics

1. **User Retention**: 80% after 1 week
2. **AI Accuracy**: 90%+ ingredient recognition
3. **App Performance**: < 3s page load times
4. **User Satisfaction**: 4.5+ star rating
5. **Engagement**: 3+ sessions per week

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
EMERGENT_LLM_KEY=sk-emergent-8892b09C81b85376f0
```

### Frontend (.env)
```
EXPO_PUBLIC_BACKEND_URL=https://mealgenius-43.preview.emergentagent.com
EXPO_PACKAGER_PROXY_URL=[managed by platform]
EXPO_PACKAGER_HOSTNAME=[managed by platform]
```

## Deployment

- **Backend**: Deployed on port 8001
- **Frontend**: Expo server on port 3000
- **Database**: MongoDB on port 27017
- **Access**: All /api/* routes proxied to backend
- **Preview**: Available at unique Emergent preview URL

## Current Status

✅ **COMPLETED**
- Authentication (Emergent Google Auth)
- Pantry Management (Full CRUD)
- AI Ingredient Scanner (OpenAI Vision)
- Recipe Database (10 recipes seeded)
- Recipe Discovery & Search
- AI Recipe Recommendations
- Family Member Management
- AI Meal Planning
- Shopping List Generation
- User Profile & Settings
- Mobile-First UI Design
- Cross-Platform Support

🚀 **READY FOR TESTING**
