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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Environment variables
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'test_database')
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', '')

# MongoDB connection
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

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
    dietary_restrictions: List[str] = []
    allergies: List[str] = []
    preferences: List[str] = []

class FamilyMemberCreate(BaseModel):
    name: str
    age: Optional[int] = None
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

@api_router.post("/recipes/generate-details")
async def generate_recipe_details(request: RecipeDetailsRequest, current_user: User = Depends(require_auth)):
    """Generate detailed recipe instructions using AI"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            model="gpt-5.2"
        )
        
        prompt = f"""Generate a detailed recipe for: {request.recipe_name}

Available ingredients: {', '.join(request.available_ingredients) if request.available_ingredients else 'Not specified'}
Missing ingredients to buy: {', '.join(request.missing_ingredients) if request.missing_ingredients else 'None'}

Respond with a JSON object containing:
{{
    "name": "Recipe Name",
    "description": "Brief appetizing description",
    "prep_time": 15,
    "cook_time": 30,
    "servings": 4,
    "difficulty": "easy|medium|hard",
    "ingredients": [
        {{"name": "ingredient name", "quantity": "1", "unit": "cup"}}
    ],
    "instructions": [
        "Step 1: Detailed instruction...",
        "Step 2: Next step..."
    ],
    "nutritional_info": {{"calories": 400, "protein": 25, "carbs": 40, "fat": 15}},
    "tips": ["Chef tip 1", "Chef tip 2"]
}}

Make the instructions detailed and easy to follow. Include 6-10 steps. Be specific with quantities and cooking times."""

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
        
        pantry_list = ", ".join([item["name"] for item in pantry_items])
        family_size = len(family_members) + 1  # Include user
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"mealplan_{uuid.uuid4().hex[:8]}",
            system_message="You are a meal planning expert. Create a weekly meal plan with breakfast, lunch, and dinner for each day. Return ONLY valid JSON."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Create a 7-day meal plan starting {request.week_start_date}.
Family size: {family_size}
Available ingredients: {pantry_list}

Format: {{\"meals\": [{{\"day\": \"Monday\", \"meal_type\": \"breakfast\", \"recipe_name\": \"...\", \"ingredients_needed\": [...]}}]}}"""
        
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
