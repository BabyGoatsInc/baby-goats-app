import requests
import sys
from datetime import datetime
import json

class BabyGoatsAPITester:
    def __init__(self, base_url="https://bug-squasher-21.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.auth_token = None
        self.test_user_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_api_prefix=True):
        """Run a single API test"""
        if use_api_prefix:
            url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        else:
            url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url

        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        # Add auth token if available
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        if data:
            print(f"Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            print(f"Response Status: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response Data: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response Text: {response.text[:500]}...")
                response_data = {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check for success field in response
                if response_data and 'success' in response_data:
                    if response_data['success']:
                        print("✅ Response includes success: true")
                    else:
                        print("⚠️  Response includes success: false")
                        
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")

            self.test_results.append({
                'name': name,
                'success': success,
                'status_code': response.status_code,
                'expected_status': expected_status,
                'response_data': response_data
            })

            return success, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'success': False,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoints(self):
        """Test root endpoints with both /api and direct access"""
        print("=" * 60)
        print("TESTING ROOT ENDPOINTS")
        print("=" * 60)
        
        # Test /api/ endpoint
        self.run_test("Root API Endpoint (/api/)", "GET", "", 200, use_api_prefix=True)
        
        # Test / endpoint (direct)
        self.run_test("Root Direct Endpoint (/)", "GET", "", 200, use_api_prefix=False)

    def test_health_endpoints(self):
        """Test health endpoints"""
        print("\n" + "=" * 60)
        print("TESTING HEALTH ENDPOINTS")
        print("=" * 60)
        
        # Test /api/health
        self.run_test("Health API Endpoint (/api/health)", "GET", "health", 200, use_api_prefix=True)
        
        # Test /health (direct)
        self.run_test("Health Direct Endpoint (/health)", "GET", "health", 200, use_api_prefix=False)

    def test_signup_flow(self):
        """Test user signup with both endpoints"""
        print("\n" + "=" * 60)
        print("TESTING SIGNUP ENDPOINTS")
        print("=" * 60)
        
        # Generate unique test user
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        # Test /api/signup
        success, response = self.run_test(
            "Signup API Endpoint (/api/signup)", 
            "POST", 
            "signup", 
            201, 
            data=self.test_user_data,
            use_api_prefix=True
        )
        
        if success and response:
            print("✅ Signup successful via /api/signup")
            # Verify response structure
            if 'user' in response:
                print("✅ Response contains user object")
                if 'password' not in response['user']:
                    print("✅ Password not included in response")
                else:
                    print("⚠️  Password included in response (security issue)")
        
        # Test /signup (direct) with different user
        different_user = {
            "username": f"testuser2_{timestamp}",
            "email": f"test2_{timestamp}@example.com", 
            "password": "TestPass123!"
        }
        
        self.run_test(
            "Signup Direct Endpoint (/signup)", 
            "POST", 
            "signup", 
            201, 
            data=different_user,
            use_api_prefix=False
        )

    def test_login_flow(self):
        """Test user login with both endpoints"""
        print("\n" + "=" * 60)
        print("TESTING LOGIN ENDPOINTS")
        print("=" * 60)
        
        if not self.test_user_data:
            print("❌ No test user data available for login test")
            return
        
        login_data = {
            "username": self.test_user_data["username"],
            "password": self.test_user_data["password"]
        }
        
        # Test /api/login
        success, response = self.run_test(
            "Login API Endpoint (/api/login)", 
            "POST", 
            "login", 
            200, 
            data=login_data,
            use_api_prefix=True
        )
        
        if success and response:
            print("✅ Login successful via /api/login")
            # Extract token for future requests
            if 'token' in response:
                self.auth_token = response['token']
                print("✅ JWT token received and stored")
            else:
                print("⚠️  No token in login response")
                
            # Verify response structure
            if 'user' in response:
                print("✅ Response contains user object")
        
        # Test /login (direct)
        self.run_test(
            "Login Direct Endpoint (/login)", 
            "POST", 
            "login", 
            200, 
            data=login_data,
            use_api_prefix=False
        )

    def test_profile_endpoints(self):
        """Test profile endpoints with authentication"""
        print("\n" + "=" * 60)
        print("TESTING PROFILE ENDPOINTS")
        print("=" * 60)
        
        if not self.auth_token:
            print("❌ No auth token available for profile tests")
            return
        
        # Test GET /api/profile
        self.run_test(
            "Get Profile API Endpoint (/api/profile)", 
            "GET", 
            "profile", 
            200,
            use_api_prefix=True
        )
        
        # Test GET /profile (direct)
        self.run_test(
            "Get Profile Direct Endpoint (/profile)", 
            "GET", 
            "profile", 
            200,
            use_api_prefix=False
        )
        
        # Test PUT /api/profile
        update_data = {
            "email": f"updated_{datetime.now().strftime('%H%M%S')}@example.com"
        }
        
        self.run_test(
            "Update Profile API Endpoint (/api/profile)", 
            "PUT", 
            "profile", 
            200,
            data=update_data,
            use_api_prefix=True
        )
        
        # Test PUT /profile (direct)
        self.run_test(
            "Update Profile Direct Endpoint (/profile)", 
            "PUT", 
            "profile", 
            200,
            data=update_data,
            use_api_prefix=False
        )

    def test_authentication_errors(self):
        """Test authentication error scenarios"""
        print("\n" + "=" * 60)
        print("TESTING AUTHENTICATION ERRORS")
        print("=" * 60)
        
        # Test profile access without token
        original_token = self.auth_token
        self.auth_token = None
        
        self.run_test(
            "Profile without token", 
            "GET", 
            "profile", 
            401,
            use_api_prefix=True
        )
        
        # Test profile access with invalid token
        self.auth_token = "invalid_token_12345"
        
        self.run_test(
            "Profile with invalid token", 
            "GET", 
            "profile", 
            401,
            use_api_prefix=True
        )
        
        # Restore original token
        self.auth_token = original_token

    def test_validation_errors(self):
        """Test input validation errors"""
        print("\n" + "=" * 60)
        print("TESTING VALIDATION ERRORS")
        print("=" * 60)
        
        # Test signup with missing fields
        self.run_test(
            "Signup with missing username", 
            "POST", 
            "signup", 
            400,
            data={"email": "test@example.com", "password": "TestPass123!"},
            use_api_prefix=True
        )
        
        self.run_test(
            "Signup with missing password", 
            "POST", 
            "signup", 
            400,
            data={"username": "testuser", "email": "test@example.com"},
            use_api_prefix=True
        )
        
        # Test login with missing fields
        self.run_test(
            "Login with missing password", 
            "POST", 
            "login", 
            400,
            data={"username": "testuser"},
            use_api_prefix=True
        )
        
        # Test duplicate user registration
        if self.test_user_data:
            self.run_test(
                "Duplicate user registration", 
                "POST", 
                "signup", 
                409,
                data=self.test_user_data,
                use_api_prefix=True
            )

    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        print("\n" + "=" * 60)
        print("TESTING INVALID CREDENTIALS")
        print("=" * 60)
        
        # Test login with wrong password
        self.run_test(
            "Login with wrong password", 
            "POST", 
            "login", 
            401,
            data={"username": "testuser", "password": "WrongPassword123!"},
            use_api_prefix=True
        )
        
        # Test login with non-existent user
        self.run_test(
            "Login with non-existent user", 
            "POST", 
            "login", 
            401,
            data={"username": "nonexistentuser", "password": "TestPass123!"},
            use_api_prefix=True
        )

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("BABY GOATS MOBILE API - TEST SUMMARY")
        print("=" * 80)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"📊 Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        
        print("\nDetailed Results:")
        print("-" * 80)
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} - {result['name']}")
            if not result['success']:
                if 'error' in result:
                    print(f"    Error: {result['error']}")
                else:
                    print(f"    Expected: {result['expected_status']}, Got: {result['status_code']}")
        
        # Analyze results
        print("\n" + "=" * 80)
        print("ANALYSIS")
        print("=" * 80)
        
        passed_tests = [r for r in self.test_results if r['success']]
        failed_tests = [r for r in self.test_results if not r['success']]
        
        if len(passed_tests) > 0:
            print("✅ WORKING FEATURES:")
            for test in passed_tests:
                print(f"   - {test['name']}")
        
        if len(failed_tests) > 0:
            print("\n❌ FAILING FEATURES:")
            for test in failed_tests:
                print(f"   - {test['name']}")
                if 'status_code' in test:
                    print(f"     Status: {test['status_code']} (Expected: {test['expected_status']})")

def main():
    print("🚀 Starting Baby Goats Mobile API Testing...")
    print("🎯 Testing comprehensive API functionality as requested")
    
    tester = BabyGoatsAPITester("https://bug-squasher-21.preview.emergentagent.com")
    
    # Run all test suites
    tester.test_root_endpoints()
    tester.test_health_endpoints()
    tester.test_signup_flow()
    tester.test_login_flow()
    tester.test_profile_endpoints()
    tester.test_authentication_errors()
    tester.test_validation_errors()
    tester.test_invalid_credentials()
    
    # Print comprehensive summary
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())