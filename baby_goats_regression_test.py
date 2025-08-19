#!/usr/bin/env python3
"""
URGENT: Baby Goats APIs Regression Testing After Foreign Key Constraints

**CRITICAL STATUS:** After adding foreign key constraints to fix 3 failing APIs, 
now 4 APIs are failing including Messages API which was previously working.

**IMMEDIATE TESTING FOCUS:**
1. Messages API - WAS WORKING (200 OK), NOW FAILING ("Failed to fetch conversations")
2. Leaderboards API - Should still be working 
3. Friendships API - Was failing, still failing
4. Teams API - Was failing, still failing  
5. Notifications API - Was failing, still failing

**OBJECTIVE:** Identify what broke the Messages API and verify current status of all APIs
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Configuration
BASE_URL = "https://goatyouth.preview.emergentagent.com/api"

HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Test data
TEST_USER_ID = str(uuid.uuid4())
TEST_FRIEND_ID = str(uuid.uuid4())

class BabyGoatsRegressionTester:
    def __init__(self):
        self.results = []
        self.api_status = {}
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['response'] = response_data
        self.results.append(result)
        
        status = "✅ WORKING" if success else "❌ FAILING"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data:
            print(f"   Response: {response_data}")
        print()

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=HEADERS, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=HEADERS, params=params, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
            
        except requests.exceptions.Timeout:
            print(f"Request timed out: {method} {url}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"Connection error: {method} {url}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None

    def test_messages_api_regression(self):
        """CRITICAL: Test Messages API - Was working, now failing"""
        print("🚨 CRITICAL REGRESSION TEST: Messages API")
        print("Previous Status: ✅ WORKING (200 OK)")
        print("Current Status: Testing...")
        
        # Test 1: GET /api/messages - Basic fetch
        try:
            response = self.make_request('GET', '/messages')
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "Messages API - GET /messages (basic)",
                        True,
                        f"Status: 200 OK, Response: {data}"
                    )
                    self.api_status['messages_get'] = 'WORKING'
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Messages API - GET /messages (basic)",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
                    self.api_status['messages_get'] = 'FAILING'
            else:
                self.log_result(
                    "Messages API - GET /messages (basic)",
                    False,
                    "No response received"
                )
                self.api_status['messages_get'] = 'NO_RESPONSE'
                
        except Exception as e:
            self.log_result(
                "Messages API - GET /messages (basic)",
                False,
                f"Exception: {str(e)}"
            )
            self.api_status['messages_get'] = 'ERROR'

        # Test 2: GET /api/messages with parameters
        try:
            params = {'user_id': TEST_USER_ID, 'limit': 10}
            response = self.make_request('GET', '/messages', params=params)
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "Messages API - GET /messages (with params)",
                        True,
                        f"Status: 200 OK, Response: {data}"
                    )
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Messages API - GET /messages (with params)",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
            else:
                self.log_result(
                    "Messages API - GET /messages (with params)",
                    False,
                    "No response received"
                )
                
        except Exception as e:
            self.log_result(
                "Messages API - GET /messages (with params)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 3: POST /api/messages - Send message
        try:
            message_data = {
                'sender_id': TEST_USER_ID,
                'recipient_id': TEST_FRIEND_ID,
                'message': 'Test message for regression testing',
                'message_type': 'text'
            }
            
            response = self.make_request('POST', '/messages', data=message_data)
            
            if response:
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.log_result(
                        "Messages API - POST /messages",
                        True,
                        f"Status: {response.status_code}, Response: {data}"
                    )
                    self.api_status['messages_post'] = 'WORKING'
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Messages API - POST /messages",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
                    self.api_status['messages_post'] = 'FAILING'
            else:
                self.log_result(
                    "Messages API - POST /messages",
                    False,
                    "No response received"
                )
                self.api_status['messages_post'] = 'NO_RESPONSE'
                
        except Exception as e:
            self.log_result(
                "Messages API - POST /messages",
                False,
                f"Exception: {str(e)}"
            )
            self.api_status['messages_post'] = 'ERROR'

    def test_leaderboards_api_status(self):
        """Test Leaderboards API - Should still be working"""
        print("📊 LEADERBOARDS API STATUS CHECK")
        print("Expected Status: ✅ WORKING")
        print("Current Status: Testing...")
        
        # Test 1: GET /api/leaderboards
        try:
            response = self.make_request('GET', '/leaderboards')
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "Leaderboards API - GET /leaderboards",
                        True,
                        f"Status: 200 OK, Response: {data}"
                    )
                    self.api_status['leaderboards_get'] = 'WORKING'
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Leaderboards API - GET /leaderboards",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
                    self.api_status['leaderboards_get'] = 'FAILING'
            else:
                self.log_result(
                    "Leaderboards API - GET /leaderboards",
                    False,
                    "No response received"
                )
                self.api_status['leaderboards_get'] = 'NO_RESPONSE'
                
        except Exception as e:
            self.log_result(
                "Leaderboards API - GET /leaderboards",
                False,
                f"Exception: {str(e)}"
            )
            self.api_status['leaderboards_get'] = 'ERROR'

        # Test 2: GET /api/leaderboards with parameters
        try:
            params = {'type': 'global', 'limit': 10}
            response = self.make_request('GET', '/leaderboards', params=params)
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "Leaderboards API - GET /leaderboards (with params)",
                        True,
                        f"Status: 200 OK, Response: {data}"
                    )
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Leaderboards API - GET /leaderboards (with params)",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
            else:
                self.log_result(
                    "Leaderboards API - GET /leaderboards (with params)",
                    False,
                    "No response received"
                )
                
        except Exception as e:
            self.log_result(
                "Leaderboards API - GET /leaderboards (with params)",
                False,
                f"Exception: {str(e)}"
            )

    def test_failing_apis_status(self):
        """Test APIs that were failing before and should still be failing"""
        print("🔍 FAILING APIS STATUS CHECK")
        print("Expected Status: ❌ FAILING (but with proper error handling)")
        
        # Test 1: Friendships API
        try:
            response = self.make_request('GET', '/friendships', params={'user_id': TEST_USER_ID})
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "Friendships API - GET /friendships",
                        True,
                        f"UNEXPECTED SUCCESS! Status: 200 OK, Response: {data}"
                    )
                    self.api_status['friendships_get'] = 'WORKING'
                elif response.status_code == 500:
                    error_text = response.text[:200] if response.text else "No error text"
                    # Check if it's a foreign key constraint error
                    if 'foreign key' in error_text.lower() or 'constraint' in error_text.lower():
                        self.log_result(
                            "Friendships API - GET /friendships",
                            False,
                            f"FOREIGN KEY CONSTRAINT ERROR: {error_text}"
                        )
                        self.api_status['friendships_get'] = 'FOREIGN_KEY_ERROR'
                    else:
                        self.log_result(
                            "Friendships API - GET /friendships",
                            False,
                            f"Status: 500, Error: {error_text}"
                        )
                        self.api_status['friendships_get'] = 'FAILING'
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Friendships API - GET /friendships",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
                    self.api_status['friendships_get'] = 'FAILING'
            else:
                self.log_result(
                    "Friendships API - GET /friendships",
                    False,
                    "No response received"
                )
                self.api_status['friendships_get'] = 'NO_RESPONSE'
                
        except Exception as e:
            self.log_result(
                "Friendships API - GET /friendships",
                False,
                f"Exception: {str(e)}"
            )
            self.api_status['friendships_get'] = 'ERROR'

        # Test 2: Teams API
        try:
            response = self.make_request('GET', '/teams', params={'limit': 10})
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "Teams API - GET /teams",
                        True,
                        f"UNEXPECTED SUCCESS! Status: 200 OK, Response: {data}"
                    )
                    self.api_status['teams_get'] = 'WORKING'
                elif response.status_code == 500:
                    error_text = response.text[:200] if response.text else "No error text"
                    # Check if it's a foreign key constraint error
                    if 'foreign key' in error_text.lower() or 'constraint' in error_text.lower():
                        self.log_result(
                            "Teams API - GET /teams",
                            False,
                            f"FOREIGN KEY CONSTRAINT ERROR: {error_text}"
                        )
                        self.api_status['teams_get'] = 'FOREIGN_KEY_ERROR'
                    else:
                        self.log_result(
                            "Teams API - GET /teams",
                            False,
                            f"Status: 500, Error: {error_text}"
                        )
                        self.api_status['teams_get'] = 'FAILING'
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Teams API - GET /teams",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
                    self.api_status['teams_get'] = 'FAILING'
            else:
                self.log_result(
                    "Teams API - GET /teams",
                    False,
                    "No response received"
                )
                self.api_status['teams_get'] = 'NO_RESPONSE'
                
        except Exception as e:
            self.log_result(
                "Teams API - GET /teams",
                False,
                f"Exception: {str(e)}"
            )
            self.api_status['teams_get'] = 'ERROR'

        # Test 3: Notifications API
        try:
            response = self.make_request('GET', '/notifications', params={'user_id': TEST_USER_ID})
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "Notifications API - GET /notifications",
                        True,
                        f"UNEXPECTED SUCCESS! Status: 200 OK, Response: {data}"
                    )
                    self.api_status['notifications_get'] = 'WORKING'
                elif response.status_code == 500:
                    error_text = response.text[:200] if response.text else "No error text"
                    # Check if it's a foreign key constraint error
                    if 'foreign key' in error_text.lower() or 'constraint' in error_text.lower():
                        self.log_result(
                            "Notifications API - GET /notifications",
                            False,
                            f"FOREIGN KEY CONSTRAINT ERROR: {error_text}"
                        )
                        self.api_status['notifications_get'] = 'FOREIGN_KEY_ERROR'
                    else:
                        self.log_result(
                            "Notifications API - GET /notifications",
                            False,
                            f"Status: 500, Error: {error_text}"
                        )
                        self.api_status['notifications_get'] = 'FAILING'
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Notifications API - GET /notifications",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
                    self.api_status['notifications_get'] = 'FAILING'
            else:
                self.log_result(
                    "Notifications API - GET /notifications",
                    False,
                    "No response received"
                )
                self.api_status['notifications_get'] = 'NO_RESPONSE'
                
        except Exception as e:
            self.log_result(
                "Notifications API - GET /notifications",
                False,
                f"Exception: {str(e)}"
            )
            self.api_status['notifications_get'] = 'ERROR'

    def test_database_connectivity(self):
        """Test direct database connectivity via working APIs"""
        print("🗄️ DATABASE CONNECTIVITY CHECK")
        print("Testing via known working APIs...")
        
        # Test 1: Profiles API (should work)
        try:
            response = self.make_request('GET', '/profiles', params={'limit': 5})
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    profiles = data.get('profiles', [])
                    self.log_result(
                        "Database Connectivity - Profiles API",
                        True,
                        f"Status: 200 OK, Profiles: {len(profiles)}"
                    )
                    self.api_status['database_profiles'] = 'WORKING'
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Database Connectivity - Profiles API",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
                    self.api_status['database_profiles'] = 'FAILING'
            else:
                self.log_result(
                    "Database Connectivity - Profiles API",
                    False,
                    "No response received"
                )
                self.api_status['database_profiles'] = 'NO_RESPONSE'
                
        except Exception as e:
            self.log_result(
                "Database Connectivity - Profiles API",
                False,
                f"Exception: {str(e)}"
            )
            self.api_status['database_profiles'] = 'ERROR'

        # Test 2: Challenges API (should work)
        try:
            response = self.make_request('GET', '/challenges', params={'limit': 5})
            
            if response:
                if response.status_code == 200:
                    data = response.json()
                    challenges = data.get('challenges', [])
                    self.log_result(
                        "Database Connectivity - Challenges API",
                        True,
                        f"Status: 200 OK, Challenges: {len(challenges)}"
                    )
                    self.api_status['database_challenges'] = 'WORKING'
                else:
                    error_text = response.text[:200] if response.text else "No error text"
                    self.log_result(
                        "Database Connectivity - Challenges API",
                        False,
                        f"Status: {response.status_code}, Error: {error_text}"
                    )
                    self.api_status['database_challenges'] = 'FAILING'
            else:
                self.log_result(
                    "Database Connectivity - Challenges API",
                    False,
                    "No response received"
                )
                self.api_status['database_challenges'] = 'NO_RESPONSE'
                
        except Exception as e:
            self.log_result(
                "Database Connectivity - Challenges API",
                False,
                f"Exception: {str(e)}"
            )
            self.api_status['database_challenges'] = 'ERROR'

    def generate_regression_report(self):
        """Generate comprehensive regression analysis report"""
        print("\n" + "="*80)
        print("🚨 BABY GOATS APIS REGRESSION ANALYSIS REPORT")
        print("="*80)
        
        # API Status Summary
        print("\n📊 API STATUS SUMMARY:")
        print("-" * 40)
        
        working_apis = []
        failing_apis = []
        regression_apis = []
        
        for api, status in self.api_status.items():
            if status == 'WORKING':
                working_apis.append(api)
                print(f"✅ {api}: WORKING")
            elif status in ['FAILING', 'FOREIGN_KEY_ERROR', 'NO_RESPONSE', 'ERROR']:
                failing_apis.append(api)
                if 'messages' in api.lower():
                    regression_apis.append(api)
                    print(f"🚨 {api}: {status} (REGRESSION!)")
                else:
                    print(f"❌ {api}: {status}")
        
        # Calculate success rate
        total_apis = len(self.api_status)
        working_count = len(working_apis)
        success_rate = (working_count / total_apis * 100) if total_apis > 0 else 0
        
        print(f"\n📈 OVERALL SUCCESS RATE: {success_rate:.1f}% ({working_count}/{total_apis} APIs working)")
        
        # Regression Analysis
        print(f"\n🚨 REGRESSION ANALYSIS:")
        print("-" * 40)
        if regression_apis:
            print(f"❌ CRITICAL REGRESSION DETECTED!")
            print(f"   APIs that were working but now failing: {len(regression_apis)}")
            for api in regression_apis:
                print(f"   - {api}: {self.api_status[api]}")
        else:
            print("✅ No regression detected in previously working APIs")
        
        # Foreign Key Impact Analysis
        foreign_key_errors = [api for api, status in self.api_status.items() if status == 'FOREIGN_KEY_ERROR']
        if foreign_key_errors:
            print(f"\n🔗 FOREIGN KEY CONSTRAINT IMPACT:")
            print("-" * 40)
            print(f"APIs affected by foreign key constraints: {len(foreign_key_errors)}")
            for api in foreign_key_errors:
                print(f"   - {api}: Foreign key constraint error")
        
        # Recovery Recommendations
        print(f"\n💡 RECOVERY RECOMMENDATIONS:")
        print("-" * 40)
        
        if regression_apis:
            print("🚨 URGENT ACTIONS REQUIRED:")
            print("1. Investigate foreign key constraints impact on Messages API")
            print("2. Check if Messages table schema was modified")
            print("3. Verify Messages API route configuration")
            print("4. Test Messages API with different parameters")
            print("5. Consider rolling back foreign key constraints temporarily")
        
        if foreign_key_errors:
            print("\n🔗 FOREIGN KEY ISSUES:")
            print("1. Review foreign key constraint definitions")
            print("2. Ensure all referenced tables exist")
            print("3. Check if cascade rules are causing issues")
            print("4. Validate data integrity requirements")
        
        if success_rate < 80:
            print(f"\n⚠️ LOW SUCCESS RATE ({success_rate:.1f}%):")
            print("1. Focus on restoring previously working APIs first")
            print("2. Implement gradual rollout of foreign key constraints")
            print("3. Add comprehensive error handling")
            print("4. Consider feature flags for new constraints")
        
        print("\n" + "="*80)
        
        return {
            'total_apis': total_apis,
            'working_apis': working_count,
            'success_rate': success_rate,
            'regression_apis': regression_apis,
            'foreign_key_errors': foreign_key_errors,
            'api_status': self.api_status
        }

def main():
    """Run Baby Goats regression testing"""
    print("🚨 BABY GOATS APIS REGRESSION TESTING")
    print("Testing after foreign key constraints implementation...")
    print("="*80)
    
    tester = BabyGoatsRegressionTester()
    
    # Run regression tests
    tester.test_messages_api_regression()
    tester.test_leaderboards_api_status()
    tester.test_failing_apis_status()
    tester.test_database_connectivity()
    
    # Generate comprehensive report
    report = tester.generate_regression_report()
    
    return report

if __name__ == "__main__":
    main()