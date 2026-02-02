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
    
    def test_delete_family_member_api(self):
        """Test the Delete Family Member API endpoint"""
        print("\n🧪 Testing Delete Family Member API...")
        
        if not self.session_token:
            print("❌ No session token available for testing")
            return False
        
        # Step 1: Get existing family members
        print("   📋 Step 1: Getting existing family members...")
        try:
            response = requests.get(
                f"{BACKEND_URL}/family",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print("   ❌ Authentication failed - need valid session token")
                return False
            elif response.status_code != 200:
                print(f"   ❌ Failed to get family members: {response.text}")
                return False
            
            family_members = response.json()
            print(f"   ✅ Found {len(family_members)} existing family members")
            
            # Display current family members
            if family_members:
                print("   Current family members:")
                for member in family_members:
                    print(f"     - {member['name']} (ID: {member['member_id']}, Email: {member.get('email', 'N/A')})")
            
            # If no members exist, create one for testing
            if not family_members:
                print("   ℹ️ No existing family members found. Creating one for testing...")
                test_member = {
                    "name": "Test Family Member for Deletion",
                    "age": 28,
                    "email": "test.delete@example.com",
                    "relationship": "sibling",
                    "dietary_restrictions": ["vegetarian"],
                    "allergies": ["nuts"],
                    "preferences": ["italian", "mexican"]
                }
                
                create_response = requests.post(
                    f"{BACKEND_URL}/family",
                    headers=self.get_auth_headers(),
                    json=test_member,
                    timeout=10
                )
                
                if create_response.status_code == 200:
                    created_member = create_response.json()
                    family_members = [created_member]
                    print(f"   ✅ Created test member: {created_member['name']} (ID: {created_member['member_id']})")
                else:
                    print(f"   ❌ Failed to create test member: {create_response.text}")
                    return False
                    
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error getting family members: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Error getting family members: {e}")
            return False
        
        # Step 2: Delete a family member
        if family_members:
            member_to_delete = family_members[0]
            member_id = member_to_delete['member_id']
            member_name = member_to_delete['name']
            
            print(f"\n   🗑️ Step 2: Deleting family member: {member_name} (ID: {member_id})")
            try:
                delete_response = requests.delete(
                    f"{BACKEND_URL}/family/{member_id}",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                
                print(f"   Status Code: {delete_response.status_code}")
                
                if delete_response.status_code == 200:
                    result = delete_response.json()
                    print(f"   ✅ Delete successful: {result.get('message', 'Member deleted')}")
                elif delete_response.status_code == 404:
                    print("   ❌ Family member not found")
                    return False
                elif delete_response.status_code == 401:
                    print("   ❌ Authentication failed")
                    return False
                else:
                    print(f"   ❌ Delete failed: {delete_response.text}")
                    return False
                    
            except requests.exceptions.RequestException as e:
                print(f"   ❌ Network error deleting member: {e}")
                return False
            except Exception as e:
                print(f"   ❌ Error deleting member: {e}")
                return False
        
        # Step 3: Verify deletion by fetching the list again
        print(f"\n   ✅ Step 3: Verifying deletion...")
        try:
            verify_response = requests.get(
                f"{BACKEND_URL}/family",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            print(f"   Status Code: {verify_response.status_code}")
            
            if verify_response.status_code == 200:
                updated_members = verify_response.json()
                print(f"   ✅ Now have {len(updated_members)} family members")
                
                # Check if the deleted member is still in the list
                deleted_member_found = any(m['member_id'] == member_id for m in updated_members)
                
                if deleted_member_found:
                    print(f"   ❌ FAILED: Member {member_name} still exists after deletion!")
                    return False
                else:
                    print(f"   ✅ SUCCESS: Member {member_name} successfully deleted!")
                    
                    # Display remaining members
                    if updated_members:
                        print("   Remaining family members:")
                        for member in updated_members:
                            print(f"     - {member['name']} (ID: {member['member_id']})")
                    else:
                        print("   No family members remaining.")
                    
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
    
    def test_delete_nonexistent_member(self):
        """Test deleting a non-existent family member"""
        print("\n🧪 Testing Delete Non-existent Family Member...")
        
        if not self.session_token:
            print("❌ No session token available for testing")
            return False
        
        fake_member_id = "member_nonexistent123"
        print(f"   Attempting to delete non-existent member ID: {fake_member_id}")
        
        try:
            response = requests.delete(
                f"{BACKEND_URL}/family/{fake_member_id}",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 404:
                print("   ✅ Correctly returned 404 for non-existent member")
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
        # Clean up any remaining family member test data
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
    
    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🧪 DELETE FAMILY MEMBER API TESTS")
        print("=" * 60)
        
        results = {
            'health_check': False,
            'auth_session': False,
            'delete_family_member': False,
            'delete_nonexistent_member': False
        }
        
        # Test 1: Health check
        results['health_check'] = self.test_health_check()
        
        # Test 2: Authentication
        results['auth_session'] = self.test_auth_session()
        
        # Test 3: Delete Family Member (only if auth works)
        if results['auth_session']:
            results['delete_family_member'] = self.test_delete_family_member_api()
        
        # Test 4: Delete Non-existent Member (only if auth works)
        if results['auth_session']:
            results['delete_nonexistent_member'] = self.test_delete_nonexistent_member()
        
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