#!/usr/bin/env python3
"""
Backend API Testing Script for Stock2Table
Tests the Add Family Member API endpoint functionality
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
        """Test authentication by creating a session"""
        print("🔐 Testing Authentication...")
        
        # For testing purposes, we'll use a mock session ID
        # In real app, this would come from OAuth flow
        test_session_id = "test_session_12345"
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/auth/session",
                headers={"X-Session-ID": test_session_id},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.session_token = data.get("session_token")
                print(f"✅ Authentication successful")
                print(f"   Session token: {self.session_token[:20]}...")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers for API calls"""
        if not self.session_token:
            return {}
        return {"Authorization": f"Bearer {self.session_token}"}
    
    def test_add_family_member(self):
        """Test adding a family member with all fields"""
        print("\n👨‍👩‍👧‍👦 Testing Add Family Member API...")
        
        if not self.session_token:
            print("❌ No session token available for testing")
            return False
        
        # Test payload with all fields including email and relationship
        test_member = {
            "name": "Sarah Johnson",
            "email": "sarah.johnson@example.com",
            "age": 30,
            "relationship": "spouse",
            "dietary_restrictions": ["vegetarian", "gluten-free"],
            "allergies": ["peanuts", "shellfish"],
            "preferences": ["italian", "mediterranean"]
        }
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/family",
                headers=self.get_auth_headers(),
                json=test_member,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Family member added successfully")
                print(f"   Member ID: {data.get('member_id')}")
                print(f"   Name: {data.get('name')}")
                print(f"   Email: {data.get('email')}")
                print(f"   Relationship: {data.get('relationship')}")
                print(f"   Age: {data.get('age')}")
                print(f"   Dietary restrictions: {data.get('dietary_restrictions')}")
                print(f"   Allergies: {data.get('allergies')}")
                print(f"   Preferences: {data.get('preferences')}")
                
                # Verify all fields are present in response
                required_fields = ['member_id', 'user_id', 'name', 'email', 'relationship', 'age', 'dietary_restrictions', 'allergies', 'preferences']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    print(f"⚠️  Missing fields in response: {missing_fields}")
                    return False
                
                # Store member_id for cleanup
                self.test_member_id = data.get('member_id')
                return True
            else:
                print(f"❌ Failed to add family member: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Add family member error: {str(e)}")
            return False
    
    def test_get_family_members(self):
        """Test retrieving family members to verify persistence"""
        print("\n📋 Testing Get Family Members API...")
        
        if not self.session_token:
            print("❌ No session token available for testing")
            return False
        
        try:
            response = requests.get(
                f"{BACKEND_URL}/family",
                headers=self.get_auth_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Family members retrieved successfully")
                print(f"   Total members: {len(data)}")
                
                # Look for our test member
                test_member_found = False
                for member in data:
                    if member.get('name') == 'Sarah Johnson':
                        test_member_found = True
                        print(f"   Found test member:")
                        print(f"     Name: {member.get('name')}")
                        print(f"     Email: {member.get('email')}")
                        print(f"     Relationship: {member.get('relationship')}")
                        print(f"     Age: {member.get('age')}")
                        print(f"     Dietary restrictions: {member.get('dietary_restrictions')}")
                        print(f"     Allergies: {member.get('allergies')}")
                        print(f"     Preferences: {member.get('preferences')}")
                        
                        # Verify all fields are persisted correctly
                        expected_values = {
                            'name': 'Sarah Johnson',
                            'email': 'sarah.johnson@example.com',
                            'age': 30,
                            'relationship': 'spouse',
                            'dietary_restrictions': ['vegetarian', 'gluten-free'],
                            'allergies': ['peanuts', 'shellfish'],
                            'preferences': ['italian', 'mediterranean']
                        }
                        
                        all_correct = True
                        for field, expected in expected_values.items():
                            actual = member.get(field)
                            if actual != expected:
                                print(f"     ⚠️  Field '{field}' mismatch: expected {expected}, got {actual}")
                                all_correct = False
                        
                        if all_correct:
                            print(f"     ✅ All fields persisted correctly")
                        
                        break
                
                if not test_member_found:
                    print(f"❌ Test member 'Sarah Johnson' not found in family members list")
                    return False
                
                return True
            else:
                print(f"❌ Failed to get family members: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get family members error: {str(e)}")
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
        if hasattr(self, 'test_member_id') and self.test_member_id:
            print(f"\n🧹 Cleaning up test data...")
            try:
                response = requests.delete(
                    f"{BACKEND_URL}/family/{self.test_member_id}",
                    headers=self.get_auth_headers(),
                    timeout=10
                )
                if response.status_code == 200:
                    print("✅ Test data cleaned up successfully")
                else:
                    print(f"⚠️  Failed to clean up test data: {response.status_code}")
            except Exception as e:
                print(f"⚠️  Cleanup error: {str(e)}")
    
    def run_all_tests(self):
        """Run all family member API tests"""
        print("=" * 60)
        print("🧪 STOCK2TABLE FAMILY MEMBER API TESTS")
        print("=" * 60)
        
        results = {
            'health_check': False,
            'auth_session': False,
            'add_family_member': False,
            'get_family_members': False
        }
        
        # Test 1: Health check
        results['health_check'] = self.test_health_check()
        
        # Test 2: Authentication
        results['auth_session'] = self.test_auth_session()
        
        # Test 3: Add family member (only if auth works)
        if results['auth_session']:
            results['add_family_member'] = self.test_add_family_member()
            
            # Test 4: Get family members (only if add works)
            if results['add_family_member']:
                results['get_family_members'] = self.test_get_family_members()
        
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