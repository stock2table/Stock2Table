#!/usr/bin/env python3
"""
Backend API Testing Script for Stock2Table
Testing Pantry Delete API endpoint as requested
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
    
    def test_pantry_delete_api(self):
        """Test the Pantry Delete API endpoint as requested"""
        print("\n🧪 Testing Pantry Delete API...")
        
        if not self.session_token:
            print("❌ No session token available for testing")
            return False
        
        # Step 1: Get existing pantry items
        print("   📋 Step 1: Getting existing pantry items...")
        try:
            response = requests.get(
                f"{BACKEND_URL}/pantry",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print("   ❌ Authentication failed - need valid session token")
                return False
            elif response.status_code != 200:
                print(f"   ❌ Failed to get pantry items: {response.text}")
                return False
            
            pantry_items = response.json()
            print(f"   ✅ Found {len(pantry_items)} existing pantry items")
            
            # Display current pantry items
            if pantry_items:
                print("   Current pantry items:")
                for item in pantry_items[:3]:  # Show first 3 items
                    print(f"     - {item['name']} (ID: {item['item_id']}, Qty: {item['quantity']} {item['unit']})")
            
            # If no items exist, create one for testing
            if not pantry_items:
                print("   ℹ️ No existing pantry items found. Creating one for testing...")
                test_item = {
                    "name": "Test Tomato for Delete",
                    "quantity": 2.0,
                    "unit": "pieces",
                    "category": "vegetables",
                    "expiry_date": "2024-12-31"
                }
                
                create_response = requests.post(
                    f"{BACKEND_URL}/pantry",
                    headers=self.get_auth_headers(),
                    json=test_item,
                    timeout=10
                )
                
                if create_response.status_code == 200:
                    created_item = create_response.json()
                    pantry_items = [created_item]
                    print(f"   ✅ Created test item: {created_item['name']} (ID: {created_item['item_id']})")
                else:
                    print(f"   ❌ Failed to create test item: {create_response.text}")
                    return False
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error getting pantry items: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Error getting pantry items: {e}")
            return False
        
        # Step 2: Delete a pantry item
        if pantry_items:
            item_to_delete = pantry_items[0]
            item_id = item_to_delete['item_id']
            item_name = item_to_delete['name']
            
            print(f"\n   🗑️ Step 2: Deleting pantry item: {item_name} (ID: {item_id})")
            try:
                delete_response = requests.delete(
                    f"{BACKEND_URL}/pantry/{item_id}",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                
                print(f"   Status Code: {delete_response.status_code}")
                
                if delete_response.status_code == 200:
                    result = delete_response.json()
                    print(f"   ✅ Delete successful: {result.get('message', 'Item deleted')}")
                elif delete_response.status_code == 404:
                    print("   ❌ Pantry item not found")
                    return False
                elif delete_response.status_code == 401:
                    print("   ❌ Authentication failed")
                    return False
                else:
                    print(f"   ❌ Delete failed: {delete_response.text}")
                    return False
                    
            except requests.exceptions.RequestException as e:
                print(f"   ❌ Network error deleting item: {e}")
                return False
            except Exception as e:
                print(f"   ❌ Error deleting item: {e}")
                return False
        
        # Step 3: Verify deletion by fetching the list again
        print(f"\n   ✅ Step 3: Verifying deletion...")
        try:
            verify_response = requests.get(
                f"{BACKEND_URL}/pantry",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            print(f"   Status Code: {verify_response.status_code}")
            
            if verify_response.status_code == 200:
                updated_items = verify_response.json()
                print(f"   ✅ Now have {len(updated_items)} pantry items")
                
                # Check if the deleted item is still in the list
                deleted_item_found = any(item['item_id'] == item_id for item in updated_items)
                
                if deleted_item_found:
                    print(f"   ❌ FAILED: Item {item_name} still exists after deletion!")
                    return False
                else:
                    print(f"   ✅ SUCCESS: Item {item_name} successfully deleted!")
                    
                    # Display remaining items
                    if updated_items:
                        print("   Remaining pantry items:")
                        for item in updated_items[:3]:  # Show first 3 items
                            print(f"     - {item['name']} (ID: {item['item_id']})")
                    else:
                        print("   No pantry items remaining.")
                    
                    return True
            else:
                print(f"   ❌ Failed to verify deletion: {verify_response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error verifying deletion: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Error verifying deletion: {e}")
            return False
    
    def test_delete_nonexistent_item(self):
        """Test deleting a non-existent pantry item"""
        print("\n🧪 Testing Delete Non-existent Pantry Item...")
        
        if not self.session_token:
            print("❌ No session token available for testing")
            return False
        
        fake_item_id = "item_nonexistent123"
        print(f"   Attempting to delete non-existent item ID: {fake_item_id}")
        
        try:
            response = requests.delete(
                f"{BACKEND_URL}/pantry/{fake_item_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 404:
                print("   ✅ Correctly returned 404 for non-existent item")
                return True
            elif response.status_code == 401:
                print("   ❌ Authentication failed")
                return False
            else:
                print(f"   ❌ Unexpected response: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    
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
        # Clean up any remaining pantry item test data
        if hasattr(self, 'test_item_id') and self.test_item_id:
            print(f"\n🧹 Cleaning up pantry item test data...")
            try:
                response = requests.delete(
                    f"{BACKEND_URL}/pantry/{self.test_item_id}",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                if response.status_code == 200:
                    print("✅ Pantry item test data cleaned up successfully")
                else:
                    print(f"⚠️  Failed to clean up pantry item test data: {response.status_code}")
            except Exception as e:
                print(f"⚠️  Pantry item cleanup error: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🧪 PANTRY DELETE API TESTS")
        print("=" * 60)
        
        results = {
            'health_check': False,
            'auth_session': False,
            'delete_pantry_item': False,
            'delete_nonexistent_item': False
        }
        
        # Test 1: Health check
        results['health_check'] = self.test_health_check()
        
        # Test 2: Authentication
        results['auth_session'] = self.test_auth_session()
        
        # Test 3: Delete Pantry Item (only if auth works)
        if results['auth_session']:
            results['delete_pantry_item'] = self.test_pantry_delete_api()
        
        # Test 4: Delete Non-existent Item (only if auth works)
        if results['auth_session']:
            results['delete_nonexistent_item'] = self.test_delete_nonexistent_item()
        
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