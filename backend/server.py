from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import base64
from PIL import Image
import io
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import asyncio
from functools import lru_cache
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Environment variables
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'test_database')
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', '')

# MongoDB connection
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# ==================== IN-MEMORY CACHE ====================
# Simple in-memory cache for fast responses
CACHE = {
    "trending": {"data": None, "expires": None},
    "videos": {"data": None, "expires": None},
    "suggestions": {},  # user_id -> {data, expires}
    "recommendations": {},  # user_id -> {data, expires}
}
CACHE_DURATION = timedelta(minutes=30)  # Cache for 30 minutes
SUGGESTION_CACHE_DURATION = timedelta(hours=4)  # Daily suggestion cache

def get_cached(key: str, user_id: str = None):
    """Get cached data if not expired"""
    now = datetime.now(timezone.utc)
    if user_id:
        cache_entry = CACHE.get(key, {}).get(user_id)
    else:
        cache_entry = CACHE.get(key)
    
    if cache_entry and cache_entry.get("expires") and cache_entry["expires"] > now:
        return cache_entry["data"]
    return None

def set_cached(key: str, data: Any, user_id: str = None, duration: timedelta = None):
    """Set cache with expiration"""
    expires = datetime.now(timezone.utc) + (duration or CACHE_DURATION)
    if user_id:
        if key not in CACHE:
            CACHE[key] = {}
        CACHE[key][user_id] = {"data": data, "expires": expires}
    else:
        CACHE[key] = {"data": data, "expires": expires}

# Pre-computed trending dishes with ingredients (fast fallback)
PRECOMPUTED_TRENDING = [
    {"id": "t1", "name": "Korean Fried Chicken", "cuisine": "Korean", "time": 45, "calories": 580, "rating": 4.9, "image_url": "https://images.unsplash.com/photo-1575932444877-5106bee2a599?w=400&q=80", "ingredients": ["chicken", "flour", "cornstarch", "garlic", "ginger", "soy sauce", "gochujang", "honey", "sesame oil"]},
    {"id": "t2", "name": "Butter Chicken", "cuisine": "Indian", "time": 40, "calories": 490, "rating": 4.8, "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80", "ingredients": ["chicken", "butter", "tomato", "cream", "onion", "garlic", "ginger", "garam masala", "cumin", "yogurt"]},
    {"id": "t3", "name": "Tacos Al Pastor", "cuisine": "Mexican", "time": 35, "calories": 420, "rating": 4.7, "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80", "ingredients": ["pork", "pineapple", "onion", "cilantro", "lime", "tortillas", "achiote", "garlic", "cumin"]},
    {"id": "t4", "name": "Sushi Bowl", "cuisine": "Japanese", "time": 30, "calories": 380, "rating": 4.9, "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", "ingredients": ["rice", "salmon", "avocado", "cucumber", "nori", "soy sauce", "rice vinegar", "sesame seeds", "edamame"]},
    {"id": "t5", "name": "Margherita Pizza", "cuisine": "Italian", "time": 25, "calories": 450, "rating": 4.6, "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80", "ingredients": ["flour", "yeast", "tomato", "mozzarella", "basil", "olive oil", "salt", "garlic"]},
    {"id": "t6", "name": "Pad Thai", "cuisine": "Thai", "time": 30, "calories": 520, "rating": 4.8, "image_url": "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80", "ingredients": ["rice noodles", "shrimp", "egg", "tofu", "bean sprouts", "peanuts", "lime", "fish sauce", "tamarind"]},
]

PRECOMPUTED_VIDEOS = [
    {"id": "v1", "title": "Knife Skills Masterclass", "duration": "12:45", "thumbnail_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80", "video_url": "https://www.youtube.com/results?search_query=knife+skills+cooking", "estimated_views": "2.1M"},
    {"id": "v2", "title": "Perfect Eggs 5 Ways", "duration": "8:30", "thumbnail_url": "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&q=80", "video_url": "https://www.youtube.com/results?search_query=how+to+cook+eggs", "estimated_views": "1.8M"},
    {"id": "v3", "title": "Homemade Pasta", "duration": "15:20", "thumbnail_url": "https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=400&q=80", "video_url": "https://www.youtube.com/results?search_query=homemade+pasta+recipe", "estimated_views": "950K"},
    {"id": "v4", "title": "Sushi at Home", "duration": "18:45", "thumbnail_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80", "video_url": "https://www.youtube.com/results?search_query=how+to+make+sushi", "estimated_views": "3.2M"},
]

PRECOMPUTED_SUGGESTIONS = [
    {"name": "Honey Garlic Salmon", "description": "A perfectly glazed salmon with sweet honey and aromatic garlic.", "cuisine": "American", "prep_time": 10, "cook_time": 20, "calories": 420, "rating": 4.9, "image_url": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80", "reason": "Quick and nutritious - perfect for a busy weeknight", "ingredients": ["salmon", "honey", "garlic", "soy sauce", "butter", "lemon", "olive oil"]},
    {"name": "Chicken Stir Fry", "description": "Colorful vegetables and tender chicken in a savory sauce.", "cuisine": "Asian", "prep_time": 15, "cook_time": 15, "calories": 380, "rating": 4.7, "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80", "reason": "Quick, healthy, and uses common pantry ingredients", "ingredients": ["chicken", "broccoli", "bell pepper", "carrot", "soy sauce", "garlic", "ginger", "sesame oil"]},
    {"name": "Mediterranean Salad", "description": "Fresh, crunchy, and packed with Mediterranean flavors.", "cuisine": "Mediterranean", "prep_time": 10, "cook_time": 0, "calories": 280, "rating": 4.6, "image_url": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80", "reason": "Light and refreshing - no cooking needed", "ingredients": ["lettuce", "cucumber", "tomato", "feta cheese", "olive", "red onion", "olive oil", "lemon"]},
    {"name": "Beef Tacos", "description": "Seasoned ground beef with fresh toppings in warm tortillas.", "cuisine": "Mexican", "prep_time": 10, "cook_time": 15, "calories": 450, "rating": 4.8, "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80", "reason": "Family favorite - customizable for everyone", "ingredients": ["ground beef", "tortillas", "lettuce", "tomato", "cheese", "sour cream", "onion", "cumin", "chili powder"]},
]

def calculate_missing_ingredients(recipe_ingredients: List[str], pantry_items: List[str]) -> List[str]:
    """Calculate which ingredients are missing from pantry"""
    pantry_lower = [p.lower().strip() for p in pantry_items]
    missing = []
    for ingredient in recipe_ingredients:
        ing_lower = ingredient.lower().strip()
        # Check if any pantry item contains the ingredient or vice versa
        found = any(ing_lower in p or p in ing_lower for p in pantry_lower)
        if not found:
            missing.append(ingredient)
    return missing

# Create the main app
app = FastAPI(title="Stock2Table API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    subscription_tier: str = "free"  # free, premium, pro
    created_at: datetime

class UserPreferences(BaseModel):
    user_id: str
    dietary_restrictions: List[str] = []  # vegetarian, vegan, gluten-free, etc.
    favorite_cuisines: List[str] = []  # Italian, Mexican, Indian, etc.
    cooking_skill: str = "intermediate"  # beginner, intermediate, advanced
    serving_size: int = 4
    max_cook_time: int = 60  # minutes
    allergies: List[str] = []
    disliked_ingredients: List[str] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserActivity(BaseModel):
    activity_id: str = Field(default_factory=lambda: f"activity_{uuid.uuid4().hex[:12]}")
    user_id: str
    activity_type: str  # recipe_view, recipe_cook, recipe_save, ingredient_add, search
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class PantryItem(BaseModel):
    item_id: str = Field(default_factory=lambda: f"item_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    quantity: float
    unit: str
    expiry_date: Optional[str] = None
    category: str = "other"
    image_base64: Optional[str] = None
    added_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PantryItemCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    expiry_date: Optional[str] = None
    category: str = "other"

class Recipe(BaseModel):
    recipe_id: str
    name: str
    cuisine_type: str
    ingredients: List[Dict[str, Any]]
    instructions: List[str]
    prep_time: int  # minutes
    cook_time: int  # minutes
    difficulty: str  # easy, medium, hard
    dietary_tags: List[str]  # vegetarian, vegan, gluten-free, etc.
    image_url: str
    nutritional_info: Optional[Dict[str, Any]] = None
    video_url: Optional[str] = None

class FamilyMember(BaseModel):
    member_id: str = Field(default_factory=lambda: f"member_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    age: Optional[int] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    dietary_restrictions: List[str] = []
    allergies: List[str] = []
    preferences: List[str] = []

class FamilyMemberCreate(BaseModel):
    name: str
    age: Optional[int] = None
    email: Optional[str] = None
    relationship: Optional[str] = None
    dietary_restrictions: List[str] = []
    allergies: List[str] = []
    preferences: List[str] = []

class MealPlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: f"plan_{uuid.uuid4().hex[:12]}")
    user_id: str
    week_start_date: str
    meals: List[Dict[str, Any]]  # [{day, meal_type, recipe_id}]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MealPlanCreate(BaseModel):
    week_start_date: str
    meals: List[Dict[str, Any]] = []

class ShoppingList(BaseModel):
    list_id: str = Field(default_factory=lambda: f"list_{uuid.uuid4().hex[:12]}")
    user_id: str
    meal_plan_id: Optional[str] = None
    items: List[Dict[str, Any]]  # [{ingredient, quantity, unit, recipe_name, in_pantry}]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShoppingListCreate(BaseModel):
    meal_plan_id: Optional[str] = None
    items: List[Dict[str, Any]] = []

class SavedRecipe(BaseModel):
    recipe_id: str = Field(default_factory=lambda: f"saved_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    description: Optional[str] = None
    youtube_url: Optional[str] = None
    thumbnail: Optional[str] = None
    source: str = "youtube"
    meal_types: List[str] = []  # ["breakfast", "lunch", "dinner"]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SavedRecipeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    youtube_url: Optional[str] = None
    thumbnail: Optional[str] = None
    source: str = "youtube"
    meal_types: List[str] = []  # ["breakfast", "lunch", "dinner"]

class ScanImageRequest(BaseModel):
    image_base64: str

class AIRecommendationRequest(BaseModel):
    preferences: Optional[Dict[str, Any]] = None

class AIMealPlanRequest(BaseModel):
    week_start_date: str
    preferences: Optional[Dict[str, Any]] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token in cookie or Authorization header"""
    session_token = None
    
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Find session in database
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check if session is expired
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if user_doc:
        return User(**user_doc)
    
    return None

async def require_auth(request: Request) -> User:
    """Require authentication, raise 401 if not authenticated"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/session")
async def create_session(x_session_id: str = Header(..., alias="X-Session-ID")):
    """Exchange session_id for session data"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": x_session_id}
            )
            response.raise_for_status()
            user_data = response.json()
        
        # Create session data response
        session_data = SessionDataResponse(**user_data)
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": session_data.email}, {"_id": 0})
        
        if not existing_user:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": session_data.email,
                "name": session_data.name,
                "picture": session_data.picture,
                "subscription_tier": "free",
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(new_user)
        else:
            user_id = existing_user["user_id"]
        
        # Create session
        session = {
            "user_id": user_id,
            "session_token": session_data.session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(session)
        
        return session_data
    
    except Exception as e:
        logger.error(f"Session creation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to create session")

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(require_auth)):
    """Get current user info"""
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, current_user: User = Depends(require_auth)):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token")
    return {"message": "Logged out successfully"}

# ==================== PANTRY ENDPOINTS ====================

@api_router.get("/pantry", response_model=List[PantryItem])
async def get_pantry(current_user: User = Depends(require_auth)):
    """Get all pantry items for current user"""
    items = await db.pantry_items.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(1000)
    return [PantryItem(**item) for item in items]

@api_router.post("/pantry", response_model=PantryItem)
async def add_pantry_item(item: PantryItemCreate, current_user: User = Depends(require_auth)):
    """Add item to pantry"""
    pantry_item = PantryItem(
        user_id=current_user.user_id,
        **item.dict()
    )
    await db.pantry_items.insert_one(pantry_item.dict())
    return pantry_item

@api_router.put("/pantry/{item_id}", response_model=PantryItem)
async def update_pantry_item(item_id: str, item: PantryItemCreate, current_user: User = Depends(require_auth)):
    """Update pantry item"""
    result = await db.pantry_items.update_one(
        {"item_id": item_id, "user_id": current_user.user_id},
        {"$set": item.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = await db.pantry_items.find_one({"item_id": item_id}, {"_id": 0})
    return PantryItem(**updated_item)

@api_router.delete("/pantry/{item_id}")
async def delete_pantry_item(item_id: str, current_user: User = Depends(require_auth)):
    """Delete pantry item"""
    result = await db.pantry_items.delete_one({"item_id": item_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

# ==================== AI SCANNING ENDPOINT ====================

@api_router.post("/scan-ingredient")
async def scan_ingredient(request: ScanImageRequest, current_user: User = Depends(require_auth)):
    """Scan image to identify ingredients using AI"""
    try:
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"scan_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert at identifying food ingredients from images. Analyze the image and return ONLY a JSON array of ingredients with their estimated quantities. Format: [{\"name\": \"ingredient_name\", \"quantity\": 1, \"unit\": \"unit_type\", \"category\": \"category\"}]. Categories: vegetables, fruits, dairy, meat, grains, spices, other."
        ).with_model("openai", "gpt-5.2")
        
        # Create image content
        image_content = ImageContent(image_base64=request.image_base64)
        
        # Create message with image
        user_message = UserMessage(
            text="Identify all food ingredients in this image. Return ONLY valid JSON array, no other text.",
            file_contents=[image_content]
        )
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        # Parse response
        import json
        # Clean response to extract JSON
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
        
        ingredients = json.loads(response_text)
        
        return {"ingredients": ingredients}
    
    except Exception as e:
        logger.error(f"Ingredient scanning error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scan ingredient: {str(e)}")

# ==================== RECIPE ENDPOINTS ====================

@api_router.get("/recipes", response_model=List[Recipe])
async def get_recipes(cuisine: Optional[str] = None, dietary: Optional[str] = None, difficulty: Optional[str] = None):
    """Get recipes with optional filters"""
    query = {}
    if cuisine:
        query["cuisine_type"] = cuisine
    if dietary:
        query["dietary_tags"] = dietary
    if difficulty:
        query["difficulty"] = difficulty
    
    recipes = await db.recipes.find(query, {"_id": 0}).to_list(1000)
    return [Recipe(**recipe) for recipe in recipes]

@api_router.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    """Get recipe by ID"""
    recipe = await db.recipes.find_one({"recipe_id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return Recipe(**recipe)

@api_router.post("/recipes/recommend")
async def recommend_recipes(request: AIRecommendationRequest, current_user: User = Depends(require_auth)):
    """Get AI-powered recipe recommendations based on pantry"""
    try:
        # Get pantry items
        pantry_items = await db.pantry_items.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(1000)
        
        # Get family dietary restrictions
        family_members = await db.family_members.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
        
        # Build prompt
        pantry_list = ", ".join([item["name"] for item in pantry_items])
        dietary_restrictions = set()
        for member in family_members:
            dietary_restrictions.update(member.get("dietary_restrictions", []))
            dietary_restrictions.update(member.get("allergies", []))
        
        restrictions_text = ", ".join(dietary_restrictions) if dietary_restrictions else "none"
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recommend_{uuid.uuid4().hex[:8]}",
            system_message="You are a culinary expert. Recommend 5 recipes based on available ingredients and dietary restrictions. Return ONLY a JSON array with recipe names and why they're suitable."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Available ingredients: {pantry_list}
Dietary restrictions: {restrictions_text}

Recommend 5 recipes. Format: [{{\"name\": \"recipe_name\", \"reason\": \"why suitable\", \"missing_ingredients\": [\"item1\", \"item2\"]}}]"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        import json
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
        
        recommendations = json.loads(response_text)
        
        return {"recommendations": recommendations}
    
    except Exception as e:
        logger.error(f"Recipe recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

class RecipeDetailsRequest(BaseModel):
    recipe_name: str
    available_ingredients: List[str] = []
    missing_ingredients: List[str] = []
    required_ingredients: List[str] = []
    custom_additions: List[str] = []

@api_router.post("/recipes/generate-details")
async def generate_recipe_details(request: RecipeDetailsRequest, current_user: User = Depends(require_auth)):
    """Generate detailed recipe instructions using AI"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"trending_{uuid.uuid4().hex[:8]}",
            system_message="You are a culinary expert. Generate detailed recipe instructions."
        ).with_model("openai", "gpt-4.1-mini")
        
        # Build custom additions text
        custom_text = ""
        if request.custom_additions:
            custom_text = f"\nUser's custom additions to include: {', '.join(request.custom_additions)}"
        
        prompt = f"""Generate a detailed recipe for: {request.recipe_name}

Available ingredients: {', '.join(request.available_ingredients) if request.available_ingredients else 'Not specified'}
Missing ingredients to buy: {', '.join(request.missing_ingredients) if request.missing_ingredients else 'None'}
Required ingredients for this recipe: {', '.join(request.required_ingredients) if request.required_ingredients else 'Standard recipe ingredients'}{custom_text}

{"IMPORTANT: The user wants to ADD these extra ingredients: " + ', '.join(request.custom_additions) + ". Please incorporate them into the recipe creatively!" if request.custom_additions else ""}

Respond with a JSON object containing:
{{
    "name": "Recipe Name",
    "description": "Brief appetizing description",
    "prep_time": 15,
    "cook_time": 30,
    "servings": 4,
    "difficulty": "easy|medium|hard",
    "ingredients": [
        {{"name": "ingredient name", "quantity": "1", "unit": "cup", "custom": false}}
    ],
    "instructions": [
        "Step 1: Detailed instruction...",
        "Step 2: Next step..."
    ],
    "nutritional_info": {{"calories": 400, "protein": 25, "carbs": 40, "fat": 15}},
    "tips": ["Chef tip 1", "Chef tip 2"]
}}

Make the instructions detailed and easy to follow. Include 6-10 steps. Be specific with quantities and cooking times.
{"Mark custom ingredients with 'custom': true in the ingredients array." if request.custom_additions else ""}"""

        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        import json
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
        
        recipe_details = json.loads(response_text)
        
        # Mark missing ingredients
        for ing in recipe_details.get("ingredients", []):
            ing_name = ing.get("name", "").lower()
            if any(missing.lower() in ing_name or ing_name in missing.lower() for missing in request.missing_ingredients):
                ing["missing"] = True
        
        return recipe_details
    
    except Exception as e:
        logger.error(f"Recipe details generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recipe details: {str(e)}")

# ==================== USER PREFERENCES ENDPOINTS ====================

class UserPreferencesUpdate(BaseModel):
    dietary_restrictions: Optional[List[str]] = None
    favorite_cuisines: Optional[List[str]] = None
    cooking_skill: Optional[str] = None
    serving_size: Optional[int] = None
    max_cook_time: Optional[int] = None
    allergies: Optional[List[str]] = None
    disliked_ingredients: Optional[List[str]] = None

@api_router.get("/preferences")
async def get_user_preferences(current_user: User = Depends(require_auth)):
    """Get user preferences"""
    prefs = await db.user_preferences.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not prefs:
        # Return default preferences
        return {
            "user_id": current_user.user_id,
            "dietary_restrictions": [],
            "favorite_cuisines": [],
            "cooking_skill": "intermediate",
            "serving_size": 4,
            "max_cook_time": 60,
            "allergies": [],
            "disliked_ingredients": []
        }
    return prefs

@api_router.put("/preferences")
async def update_user_preferences(prefs: UserPreferencesUpdate, current_user: User = Depends(require_auth)):
    """Update user preferences"""
    update_data = {k: v for k, v in prefs.dict().items() if v is not None}
    update_data["user_id"] = current_user.user_id
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.user_preferences.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data},
        upsert=True
    )
    
    return await get_user_preferences(current_user)

# ==================== ACTIVITY TRACKING ENDPOINTS ====================

class ActivityCreate(BaseModel):
    activity_type: str  # recipe_view, recipe_cook, recipe_save, search
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    metadata: Dict[str, Any] = {}

@api_router.post("/activity")
async def track_activity(activity: ActivityCreate, current_user: User = Depends(require_auth)):
    """Track user activity for learning"""
    activity_record = UserActivity(
        user_id=current_user.user_id,
        **activity.dict()
    )
    await db.user_activities.insert_one(activity_record.dict())
    return {"message": "Activity tracked"}

@api_router.get("/activity/history")
async def get_activity_history(limit: int = 50, current_user: User = Depends(require_auth)):
    """Get user activity history"""
    activities = await db.user_activities.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return activities

# ==================== DYNAMIC CONTENT ENDPOINTS ====================

@api_router.get("/discover/trending")
async def get_trending_content(current_user: User = Depends(require_auth)):
    """Get trending dishes with missing ingredients info"""
    try:
        # Get user's pantry items
        pantry_items = await db.pantry_items.find(
            {"user_id": current_user.user_id},
            {"_id": 0, "name": 1}
        ).to_list(100)
        pantry_names = [p.get('name', '') for p in pantry_items]
        
        # Use pre-computed trending and add missing ingredients
        trending = []
        for dish in PRECOMPUTED_TRENDING:
            dish_copy = dish.copy()
            ingredients = dish.get('ingredients', [])
            missing = calculate_missing_ingredients(ingredients, pantry_names)
            dish_copy['missing_ingredients'] = missing
            dish_copy['have_ingredients'] = len(ingredients) - len(missing)
            dish_copy['total_ingredients'] = len(ingredients)
            dish_copy['can_make'] = len(missing) == 0
            trending.append(dish_copy)
        
        # Sort by fewest missing ingredients
        trending.sort(key=lambda x: len(x.get('missing_ingredients', [])))
        
        return {"trending": trending}
    
    except Exception as e:
        logger.error(f"Trending content error: {str(e)}")
        return {"trending": PRECOMPUTED_TRENDING}

@api_router.get("/discover/videos")
async def get_video_tutorials(current_user: User = Depends(require_auth)):
    """Get video tutorials - uses cache for fast response"""
    try:
        # Check cache first
        cached = get_cached("videos")
        if cached:
            logger.info("Returning cached videos")
            return {"videos": cached}
        
        # Return pre-computed videos immediately (fast!)
        videos = PRECOMPUTED_VIDEOS.copy()
        
        # Cache the result
        set_cached("videos", videos)
        
        return {"videos": videos}
    
    except Exception as e:
        logger.error(f"Video tutorials error: {str(e)}")
        return {"videos": PRECOMPUTED_VIDEOS}

@api_router.get("/discover/suggestion")
async def get_daily_suggestion(current_user: User = Depends(require_auth)):
    """Get AI-powered daily suggestion with missing ingredients"""
    try:
        # Get user's pantry items
        pantry_items = await db.pantry_items.find(
            {"user_id": current_user.user_id},
            {"_id": 0, "name": 1}
        ).to_list(100)
        pantry_names = [p.get('name', '') for p in pantry_items]
        
        # Get user preferences
        prefs = await db.user_preferences.find_one({"user_id": current_user.user_id}, {"_id": 0})
        
        # Find best matching suggestion based on pantry and preferences
        best_suggestion = None
        best_score = -1
        
        for s in PRECOMPUTED_SUGGESTIONS:
            suggestion = s.copy()
            ingredients = s.get('ingredients', [])
            missing = calculate_missing_ingredients(ingredients, pantry_names)
            
            # Score: more ingredients in pantry = better
            score = len(ingredients) - len(missing)
            
            # Bonus for matching cuisine preference
            if prefs and prefs.get('favorite_cuisines'):
                if s.get('cuisine', '').lower() in [c.lower() for c in prefs.get('favorite_cuisines', [])]:
                    score += 3
            
            if score > best_score:
                best_score = score
                suggestion['missing_ingredients'] = missing
                suggestion['have_ingredients'] = len(ingredients) - len(missing)
                suggestion['total_ingredients'] = len(ingredients)
                suggestion['can_make'] = len(missing) == 0
                
                # Update reason based on pantry
                if len(missing) == 0:
                    suggestion['reason'] = "You have all ingredients! Ready to cook"
                elif len(missing) <= 2:
                    suggestion['reason'] = f"Almost ready - just need {', '.join(missing[:2])}"
                else:
                    suggestion['reason'] = suggestion.get('reason', 'Recommended for you')
                
                best_suggestion = suggestion
        
        return {"suggestion": best_suggestion or PRECOMPUTED_SUGGESTIONS[0]}
    
    except Exception as e:
        logger.error(f"Daily suggestion error: {str(e)}")
        import random
        return {"suggestion": random.choice(PRECOMPUTED_SUGGESTIONS)}

# ==================== FAMILY MEMBER ENDPOINTS ====================

@api_router.get("/family", response_model=List[FamilyMember])
async def get_family_members(current_user: User = Depends(require_auth)):
    """Get all family members"""
    members = await db.family_members.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
    return [FamilyMember(**member) for member in members]

@api_router.post("/family", response_model=FamilyMember)
async def add_family_member(member: FamilyMemberCreate, current_user: User = Depends(require_auth)):
    """Add family member"""
    family_member = FamilyMember(
        user_id=current_user.user_id,
        **member.dict()
    )
    await db.family_members.insert_one(family_member.dict())
    return family_member

@api_router.delete("/family/{member_id}")
async def delete_family_member(member_id: str, current_user: User = Depends(require_auth)):
    """Delete family member"""
    result = await db.family_members.delete_one({"member_id": member_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Family member not found")
    return {"message": "Family member deleted successfully"}

# ==================== MEAL PLAN ENDPOINTS ====================

@api_router.get("/meal-plans", response_model=List[MealPlan])
async def get_meal_plans(current_user: User = Depends(require_auth)):
    """Get all meal plans"""
    plans = await db.meal_plans.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(1000)
    return [MealPlan(**plan) for plan in plans]

@api_router.post("/meal-plans", response_model=MealPlan)
async def create_meal_plan(plan: MealPlanCreate, current_user: User = Depends(require_auth)):
    """Create meal plan"""
    meal_plan = MealPlan(
        user_id=current_user.user_id,
        **plan.dict()
    )
    await db.meal_plans.insert_one(meal_plan.dict())
    return meal_plan

@api_router.post("/meal-plans/generate")
async def generate_meal_plan(request: AIMealPlanRequest, current_user: User = Depends(require_auth)):
    """Generate AI-powered meal plan"""
    try:
        # Get pantry items
        pantry_items = await db.pantry_items.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(1000)
        
        # Get family info
        family_members = await db.family_members.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
        
        # Get saved recipes (YouTube favorites)
        saved_recipes = await db.saved_recipes.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
        
        pantry_list = ", ".join([item["name"] for item in pantry_items])
        family_size = len(family_members) + 1  # Include user
        
        # Build saved recipes list for prompt with meal type info
        saved_recipes_text = ""
        if saved_recipes:
            # Group recipes by meal type for better AI understanding
            breakfast_recipes = []
            lunch_recipes = []
            dinner_recipes = []
            any_meal_recipes = []
            
            for r in saved_recipes:
                meal_types = r.get("meal_types", [])
                recipe_name = r.get("name", "")
                
                if not meal_types:  # No meal type specified, can be used for any meal
                    any_meal_recipes.append(recipe_name)
                else:
                    if "breakfast" in meal_types:
                        breakfast_recipes.append(recipe_name)
                    if "lunch" in meal_types:
                        lunch_recipes.append(recipe_name)
                    if "dinner" in meal_types:
                        dinner_recipes.append(recipe_name)
            
            saved_recipes_text = "\n\nUser's favorite/saved recipes:"
            if breakfast_recipes:
                saved_recipes_text += f"\n- FOR BREAKFAST: {', '.join(breakfast_recipes)}"
            if lunch_recipes:
                saved_recipes_text += f"\n- FOR LUNCH: {', '.join(lunch_recipes)}"
            if dinner_recipes:
                saved_recipes_text += f"\n- FOR DINNER: {', '.join(dinner_recipes)}"
            if any_meal_recipes:
                saved_recipes_text += f"\n- FOR ANY MEAL: {', '.join(any_meal_recipes)}"
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"mealplan_{uuid.uuid4().hex[:8]}",
            system_message="You are a meal planning expert. Create a weekly meal plan with breakfast, lunch, and dinner for each day. Return ONLY valid JSON."
        ).with_model("openai", "gpt-4.1-mini")
        
        prompt = f"""Create a 7-day meal plan starting {request.week_start_date}.
Family size: {family_size}
Available ingredients: {pantry_list}{saved_recipes_text}

IMPORTANT: 
- If the user has saved recipes, MUST include them in the appropriate meal slots (breakfast recipes for breakfast, lunch recipes for lunch, dinner recipes for dinner).
- Try to include at least 2-3 of the user's saved recipes in the weekly plan.
- Recipes marked "FOR ANY MEAL" can be used for any meal type.

Format: {{\"meals\": [{{\"day\": \"{request.week_start_date}\", \"meal_type\": \"breakfast\", \"recipe_name\": \"...\", \"ingredients_needed\": [...]}}]}}

Note: Use actual dates (YYYY-MM-DD format) for the "day" field, starting from {request.week_start_date}."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        import json
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
        
        meal_plan_data = json.loads(response_text)
        
        # Create meal plan
        meal_plan = MealPlan(
            user_id=current_user.user_id,
            week_start_date=request.week_start_date,
            meals=meal_plan_data.get("meals", [])
        )
        await db.meal_plans.insert_one(meal_plan.dict())
        
        return meal_plan
    
    except Exception as e:
        logger.error(f"Meal plan generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan: {str(e)}")

class AddMealRequest(BaseModel):
    day: str
    meal_type: str
    recipe_name: str
    ingredients_needed: List[str] = []
    is_custom: bool = True

@api_router.post("/meal-plans/{plan_id}/add-meal")
async def add_meal_to_plan(plan_id: str, request: AddMealRequest, current_user: User = Depends(require_auth)):
    """Add a custom meal to an existing meal plan"""
    try:
        # Find the meal plan
        meal_plan = await db.meal_plans.find_one({"plan_id": plan_id, "user_id": current_user.user_id})
        if not meal_plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        # Create the new meal
        new_meal = {
            "day": request.day,
            "meal_type": request.meal_type,
            "recipe_name": request.recipe_name,
            "ingredients_needed": request.ingredients_needed,
            "is_custom": request.is_custom
        }
        
        # Add the meal to the plan
        await db.meal_plans.update_one(
            {"plan_id": plan_id, "user_id": current_user.user_id},
            {"$push": {"meals": new_meal}}
        )
        
        # Track activity
        await db.activity_logs.insert_one({
            "user_id": current_user.user_id,
            "activity_type": "meal_added",
            "item_name": request.recipe_name,
            "details": {"plan_id": plan_id, "meal_type": request.meal_type},
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {"status": "success", "meal": new_meal}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add meal error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add meal: {str(e)}")

# ==================== SAVED RECIPES ENDPOINTS ====================

@api_router.get("/saved-recipes", response_model=List[SavedRecipe])
async def get_saved_recipes(current_user: User = Depends(require_auth)):
    """Get all saved recipes for the user"""
    recipes = await db.saved_recipes.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
    return [SavedRecipe(**r) for r in recipes]

@api_router.post("/saved-recipes", response_model=SavedRecipe)
async def create_saved_recipe(recipe: SavedRecipeCreate, current_user: User = Depends(require_auth)):
    """Save a new recipe (e.g., from YouTube)"""
    new_recipe = SavedRecipe(
        user_id=current_user.user_id,
        **recipe.dict()
    )
    await db.saved_recipes.insert_one(new_recipe.dict())
    
    # Track activity
    await db.activity_logs.insert_one({
        "user_id": current_user.user_id,
        "activity_type": "recipe_saved",
        "item_name": recipe.name,
        "details": {"source": recipe.source, "youtube_url": recipe.youtube_url},
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return new_recipe

@api_router.delete("/saved-recipes/{recipe_id}")
async def delete_saved_recipe(recipe_id: str, current_user: User = Depends(require_auth)):
    """Delete a saved recipe"""
    result = await db.saved_recipes.delete_one({"recipe_id": recipe_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"status": "deleted"}

# ==================== SHOPPING LIST ENDPOINTS ====================

@api_router.get("/shopping-lists", response_model=List[ShoppingList])
async def get_shopping_lists(current_user: User = Depends(require_auth)):
    """Get all shopping lists"""
    lists = await db.shopping_lists.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(1000)
    return [ShoppingList(**lst) for lst in lists]

@api_router.post("/shopping-lists", response_model=ShoppingList)
async def create_shopping_list(shopping_list: ShoppingListCreate, current_user: User = Depends(require_auth)):
    """Create shopping list"""
    new_list = ShoppingList(
        user_id=current_user.user_id,
        **shopping_list.dict()
    )
    await db.shopping_lists.insert_one(new_list.dict())
    return new_list

@api_router.post("/shopping-lists/generate/{plan_id}")
async def generate_shopping_list(plan_id: str, current_user: User = Depends(require_auth)):
    """Generate shopping list from meal plan"""
    # Get meal plan
    meal_plan = await db.meal_plans.find_one({"plan_id": plan_id, "user_id": current_user.user_id}, {"_id": 0})
    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    
    # Get pantry items
    pantry_items = await db.pantry_items.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(1000)
    pantry_names = set([item["name"].lower() for item in pantry_items])
    
    # Extract ingredients from meals
    shopping_items = []
    for meal in meal_plan.get("meals", []):
        for ingredient in meal.get("ingredients_needed", []):
            if isinstance(ingredient, str):
                ingredient_name = ingredient.lower()
                in_pantry = ingredient_name in pantry_names
                shopping_items.append({
                    "ingredient": ingredient,
                    "quantity": 1,
                    "unit": "unit",
                    "recipe_name": meal.get("recipe_name", ""),
                    "in_pantry": in_pantry
                })
    
    # Create shopping list
    shopping_list = ShoppingList(
        user_id=current_user.user_id,
        meal_plan_id=plan_id,
        items=shopping_items
    )
    await db.shopping_lists.insert_one(shopping_list.dict())
    
    return shopping_list

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Stock2Table API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
