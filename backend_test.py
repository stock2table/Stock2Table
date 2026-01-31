#!/usr/bin/env python3
"""
Backend API Testing Script for Stock2Table
Testing Delete Family Member API endpoint
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://foodinventory-6.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session_token = None
        self.user_id = None
        
    def test_auth_session(self):
        """Test authentication by creating a session directly in database"""
        print("🔐 Testing Authentication...")
        
        # Since the external OAuth service is not available in test environment,
        # we'll create a test user and session directly in the database
        try:
            # Install required packages
            import subprocess
            import sys
            
            try:
                import motor
            except ImportError:
                print("   Installing motor for MongoDB access...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "motor"])
                import motor
            
            import uuid
            from datetime import datetime, timedelta, timezone
            from motor.motor_asyncio import AsyncIOMotorClient
            import asyncio
            
            async def create_test_session():
                # Connect to MongoDB
                client = AsyncIOMotorClient("mongodb://localhost:27017")
                db = client["test_database"]
                
                # Create test user
                user_id = f"test_user_{uuid.uuid4().hex[:12]}"
                test_user = {
                    "user_id": user_id,
                    "email": "test@example.com",
                    "name": "Test User",
                    "picture": None,
                    "subscription_tier": "free",
                    "created_at": datetime.now(timezone.utc)
                }
                
                # Insert or update user
                await db.users.update_one(
                    {"email": "test@example.com"},
                    {"$set": test_user},
                    upsert=True
                )
                
                # Create session token
                session_token = f"test_token_{uuid.uuid4().hex}"
                session = {
                    "user_id": user_id,
                    "session_token": session_token,
                    "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
                    "created_at": datetime.now(timezone.utc)
                }
                
                # Insert session
                await db.user_sessions.insert_one(session)
                
                client.close()
                return session_token, user_id
            
            # Run async function
            self.session_token, self.user_id = asyncio.run(create_test_session())
            
            print(f"✅ Test session created successfully")
            print(f"   Session token: {self.session_token[:20]}...")
            print(f"   User ID: {self.user_id}")
            return True
                
        except Exception as e:
            print(f"❌ Authentication setup error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_auth_headers(self):
        """Get authorization headers for API calls"""
        if not self.session_token:
            return {}
        return {"Authorization": f"Bearer {self.session_token}"}
    
    def test_saved_recipes_with_meal_types(self):
        """Test Saved Recipes API with meal_types field"""
        print("\n🍽️ Testing Saved Recipes API with meal_types field...")
        
        if not self.session_token:
            print("❌ No session token available for testing")
            return False
        
        # Test data as specified in the review request
        test_recipes = [
            {
                "name": "Gordon Ramsay's Scrambled Eggs",
                "description": "Perfect fluffy scrambled eggs",
                "youtube_url": "https://www.youtube.com/watch?v=PUP7U5vTMM0",
                "thumbnail": "https://img.youtube.com/vi/PUP7U5vTMM0/hqdefault.jpg",
                "source": "youtube",
                "meal_types": ["breakfast"]
            },
            {
                "name": "Chicken Stir Fry",
                "description": "Quick and healthy",
                "youtube_url": "https://www.youtube.com/watch?v=test123",
                "source": "youtube",
                "meal_types": ["lunch", "dinner"]
            },
            {
                "name": "Midnight Snack",
                "description": "Simple late night treat",
                "youtube_url": "https://www.youtube.com/watch?v=snack456",
                "source": "youtube",
                "meal_types": []  # Test empty array
            }
        ]
        
        created_recipe_ids = []
        
        # Test 1: POST /api/saved-recipes with single meal type
        print("   📝 Test 1: POST /api/saved-recipes (single meal type)")
        try:
            response = requests.post(
                f"{BACKEND_URL}/saved-recipes",
                headers=self.get_auth_headers(),
                json=test_recipes[0],
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Recipe created successfully")
                print(f"      Recipe ID: {data.get('recipe_id')}")
                print(f"      Name: {data.get('name')}")
                print(f"      Meal Types: {data.get('meal_types')}")
                
                # Verify meal_types field is present and correct
                if data.get('meal_types') == ["breakfast"]:
                    print("   ✅ meal_types field correctly saved")
                    created_recipe_ids.append(data.get('recipe_id'))
                else:
                    print(f"   ❌ meal_types field incorrect. Expected: ['breakfast'], Got: {data.get('meal_types')}")
                    return False
            else:
                print(f"   ❌ Failed to create recipe. Status: {response.status_code}")
                print(f"      Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error in Test 1: {str(e)}")
            return False
        
        # Test 2: POST /api/saved-recipes with multiple meal types
        print("   📝 Test 2: POST /api/saved-recipes (multiple meal types)")
        try:
            response = requests.post(
                f"{BACKEND_URL}/saved-recipes",
                headers=self.get_auth_headers(),
                json=test_recipes[1],
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Recipe created successfully")
                print(f"      Recipe ID: {data.get('recipe_id')}")
                print(f"      Name: {data.get('name')}")
                print(f"      Meal Types: {data.get('meal_types')}")
                
                # Verify meal_types field is present and correct
                if data.get('meal_types') == ["lunch", "dinner"]:
                    print("   ✅ meal_types field correctly saved")
                    created_recipe_ids.append(data.get('recipe_id'))
                else:
                    print(f"   ❌ meal_types field incorrect. Expected: ['lunch', 'dinner'], Got: {data.get('meal_types')}")
                    return False
            else:
                print(f"   ❌ Failed to create recipe. Status: {response.status_code}")
                print(f"      Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error in Test 2: {str(e)}")
            return False
        
        # Test 3: POST /api/saved-recipes with empty meal_types array
        print("   📝 Test 3: POST /api/saved-recipes (empty meal_types)")
        try:
            response = requests.post(
                f"{BACKEND_URL}/saved-recipes",
                headers=self.get_auth_headers(),
                json=test_recipes[2],
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Recipe created successfully")
                print(f"      Recipe ID: {data.get('recipe_id')}")
                print(f"      Name: {data.get('name')}")
                print(f"      Meal Types: {data.get('meal_types')}")
                
                # Verify meal_types field is present and correct (empty array)
                if data.get('meal_types') == []:
                    print("   ✅ Empty meal_types array correctly saved")
                    created_recipe_ids.append(data.get('recipe_id'))
                else:
                    print(f"   ❌ meal_types field incorrect. Expected: [], Got: {data.get('meal_types')}")
                    return False
            else:
                print(f"   ❌ Failed to create recipe. Status: {response.status_code}")
                print(f"      Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error in Test 3: {str(e)}")
            return False
        
        # Test 4: GET /api/saved-recipes - Verify meal_types is returned
        print("   📝 Test 4: GET /api/saved-recipes (verify meal_types in response)")
        try:
            response = requests.get(
                f"{BACKEND_URL}/saved-recipes",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Retrieved {len(data)} saved recipes")
                
                # Find our created recipes and verify meal_types
                found_recipes = 0
                for recipe in data:
                    if recipe.get('recipe_id') in created_recipe_ids:
                        found_recipes += 1
                        print(f"      Found recipe: {recipe.get('name')}")
                        print(f"        Meal Types: {recipe.get('meal_types')}")
                        
                        # Verify meal_types field exists
                        if 'meal_types' not in recipe:
                            print(f"      ❌ meal_types field missing in GET response for {recipe.get('name')}")
                            return False
                        
                        # Verify meal_types is a list
                        if not isinstance(recipe.get('meal_types'), list):
                            print(f"      ❌ meal_types should be a list, got {type(recipe.get('meal_types'))}")
                            return False
                
                if found_recipes == len(created_recipe_ids):
                    print("   ✅ All created recipes found in GET response with meal_types field")
                else:
                    print(f"   ❌ Only found {found_recipes} out of {len(created_recipe_ids)} created recipes")
                    return False
            else:
                print(f"   ❌ Failed to get recipes. Status: {response.status_code}")
                print(f"      Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error in Test 4: {str(e)}")
            return False
        
        # Store recipe IDs for cleanup
        self.test_recipe_ids = created_recipe_ids
        
        print("   🎉 All Saved Recipes API tests with meal_types passed!")
        return True
    
    def test_health_check(self):
        """Test basic API health"""
        print("🏥 Testing API Health...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                print("✅ API health check passed")
                return True
            else:
                print(f"❌ API health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API health check error: {str(e)}")
            return False
    def cleanup_test_data(self):
        """Clean up test data"""
        # Clean up family member test data
        if hasattr(self, 'test_member_id') and self.test_member_id:
            print(f"\n🧹 Cleaning up family member test data...")
            try:
                response = requests.delete(
                    f"{BACKEND_URL}/family/{self.test_member_id}",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                if response.status_code == 200:
                    print("✅ Family member test data cleaned up successfully")
                else:
                    print(f"⚠️  Failed to clean up family member test data: {response.status_code}")
            except Exception as e:
                print(f"⚠️  Family member cleanup error: {str(e)}")
        
        # Clean up saved recipes test data
        if hasattr(self, 'test_recipe_ids') and self.test_recipe_ids:
            print(f"\n🧹 Cleaning up saved recipes test data...")
            for recipe_id in self.test_recipe_ids:
                try:
                    response = requests.delete(
                        f"{BACKEND_URL}/saved-recipes/{recipe_id}",
                        headers=self.get_auth_headers(),
                        timeout=10
                    )
                    if response.status_code == 200:
                        print(f"✅ Recipe {recipe_id} cleaned up successfully")
                    else:
                        print(f"⚠️  Failed to clean up recipe {recipe_id}: {response.status_code}")
                except Exception as e:
                    print(f"⚠️  Recipe cleanup error for {recipe_id}: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🧪 STOCK2TABLE SAVED RECIPES API TESTS")
        print("=" * 60)
        
        results = {
            'health_check': False,
            'auth_session': False,
            'saved_recipes_meal_types': False
        }
        
        # Test 1: Health check
        results['health_check'] = self.test_health_check()
        
        # Test 2: Authentication
        results['auth_session'] = self.test_auth_session()
        
        # Test 3: Saved Recipes with meal_types (only if auth works)
        if results['auth_session']:
            results['saved_recipes_meal_types'] = self.test_saved_recipes_with_meal_types()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(results)
        passed_tests = sum(1 for result in results.values() if result)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed!")
            return False

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()