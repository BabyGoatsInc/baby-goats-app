import requests
import sys
from datetime import datetime
import json

class BackendAPITester:
    def __init__(self, base_url="https://bug-squasher-21.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            print(f"Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                print(f"Response Data: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response Text: {response.text}")
                response_data = {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
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

    def test_actual_api(self):
        """Test the actual implemented API endpoints"""
        print("=" * 60)
        print("TESTING ACTUAL IMPLEMENTED API")
        print("=" * 60)
        
        # Test root endpoint
        self.run_test("Root Endpoint", "GET", "", 200)
        
        # Test create status check
        test_status_data = {
            "client_name": f"test_client_{datetime.now().strftime('%H%M%S')}"
        }
        success, response = self.run_test(
            "Create Status Check", 
            "POST", 
            "status", 
            200, 
            data=test_status_data
        )
        
        # Test get status checks
        self.run_test("Get Status Checks", "GET", "status", 200)

    def test_requested_api(self):
        """Test the requested Baby Goats Mobile API endpoints (will likely fail)"""
        print("\n" + "=" * 60)
        print("TESTING REQUESTED BABY GOATS MOBILE API")
        print("=" * 60)
        
        # Test root endpoint (without /api prefix as requested)
        root_url = f"{self.base_url}/"
        print(f"\n🔍 Testing Root Endpoint (Baby Goats)...")
        print(f"URL: {root_url}")
        try:
            response = requests.get(root_url, timeout=10)
            print(f"Response Status: {response.status_code}")
            try:
                response_data = response.json()
                print(f"Response Data: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response Text: {response.text}")
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
        
        # Test signup endpoint
        signup_url = f"{self.base_url}/signup"
        print(f"\n🔍 Testing Signup Endpoint...")
        print(f"URL: {signup_url}")
        try:
            signup_data = {
                "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
                "email": "test@example.com",
                "password": "TestPass123!"
            }
            response = requests.post(signup_url, json=signup_data, timeout=10)
            print(f"Response Status: {response.status_code}")
            try:
                response_data = response.json()
                print(f"Response Data: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response Text: {response.text}")
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
        
        # Test login endpoint
        login_url = f"{self.base_url}/login"
        print(f"\n🔍 Testing Login Endpoint...")
        print(f"URL: {login_url}")
        try:
            login_data = {
                "username": "testuser",
                "password": "TestPass123!"
            }
            response = requests.post(login_url, json=login_data, timeout=10)
            print(f"Response Status: {response.status_code}")
            try:
                response_data = response.json()
                print(f"Response Data: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response Text: {response.text}")
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
        
        # Test health endpoint
        health_url = f"{self.base_url}/health"
        print(f"\n🔍 Testing Health Endpoint...")
        print(f"URL: {health_url}")
        try:
            response = requests.get(health_url, timeout=10)
            print(f"Response Status: {response.status_code}")
            try:
                response_data = response.json()
                print(f"Response Data: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response Text: {response.text}")
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        print("\nDetailed Results:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status} - {result['name']}")
            if not result['success']:
                if 'error' in result:
                    print(f"    Error: {result['error']}")
                else:
                    print(f"    Expected: {result['expected_status']}, Got: {result['status_code']}")

def main():
    print("🚀 Starting Backend API Testing...")
    
    # Test with the actual frontend URL from .env
    tester = BackendAPITester("https://bug-squasher-21.preview.emergentagent.com")
    
    # Test actual implemented API
    tester.test_actual_api()
    
    # Test requested API endpoints (will likely fail)
    tester.test_requested_api()
    
    # Print summary
    tester.print_summary()
    
    print("\n" + "=" * 60)
    print("CRITICAL FINDINGS:")
    print("=" * 60)
    print("1. MISMATCH: Requested 'Baby Goats Mobile API' with auth endpoints")
    print("2. ACTUAL: Simple status check API with MongoDB")
    print("3. MISSING: /signup, /login, /profile, /health endpoints")
    print("4. MISSING: JWT authentication system")
    print("5. MISSING: User management functionality")
    print("6. URL MISMATCH: Requested https://funny-treefrog-10.loca.lt")
    print("7. ACTUAL URL: https://bug-squasher-21.preview.emergentagent.com")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())