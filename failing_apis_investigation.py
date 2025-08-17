#!/usr/bin/env python3
"""
Baby Goats Social Platform - Failing APIs Deep Investigation
CRITICAL STATUS UPDATE: Focus on 500 errors in specific APIs

**FAILING APIS TO INVESTIGATE:**
- ❌ Friendships API: 500 "Failed to fetch friends"
- ❌ Teams API: 500 "Failed to fetch teams"  
- ❌ Notifications API: 500 "Internal server error"

**WORKING APIS (for comparison):**
- ✅ Messages API: Working (200 OK)
- ✅ Leaderboards API: Working (200 OK)

**TESTING OBJECTIVE:** 
Determine exactly what is causing 500 errors and provide definitive solution.
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Configuration
BASE_URL = "https://youthgoat-social.preview.emergentagent.com/api"

HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Test data
TEST_USER_ID = str(uuid.uuid4())
TEST_FRIEND_ID = str(uuid.uuid4())
TEST_TEAM_ID = str(uuid.uuid4())

class FailingAPIsInvestigator:
    def __init__(self):
        self.results = []
        self.error_details = {}
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result with detailed error information"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['response'] = response_data
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()

    def make_detailed_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with detailed error capture"""
        url = f"{BASE_URL}{endpoint}"
        start_time = time.time()
        
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
            
            end_time = time.time()
            response_time = end_time - start_time
            
            # Capture detailed response information
            response_info = {
                'status_code': response.status_code,
                'response_time': response_time,
                'headers': dict(response.headers),
                'url': url,
                'method': method
            }
            
            # Try to parse JSON response
            try:
                response_info['json'] = response.json()
            except:
                response_info['text'] = response.text[:1000]  # First 1000 chars
            
            return response, response_info
            
        except requests.exceptions.Timeout:
            return None, {'error': 'TIMEOUT', 'response_time': time.time() - start_time}
        except requests.exceptions.ConnectionError:
            return None, {'error': 'CONNECTION_ERROR'}
        except requests.exceptions.RequestException as e:
            return None, {'error': str(e)}

    def test_working_apis_baseline(self):
        """Test working APIs to establish baseline behavior"""
        print("🔍 Testing Working APIs (Baseline)...")
        
        # Test Messages API (should work)
        try:
            response, info = self.make_detailed_request('GET', '/messages', params={'user_id': TEST_USER_ID})
            
            if response and response.status_code == 200:
                self.log_result(
                    "BASELINE - Messages API GET",
                    True,
                    f"Working correctly: {response.status_code}, {info['response_time']:.2f}s",
                    info.get('json', {})
                )
            else:
                self.log_result(
                    "BASELINE - Messages API GET",
                    False,
                    f"Unexpected failure: {response.status_code if response else 'No response'}",
                    info
                )
        except Exception as e:
            self.log_result(
                "BASELINE - Messages API GET",
                False,
                f"Exception: {str(e)}"
            )

        # Test Leaderboards API (should work)
        try:
            response, info = self.make_detailed_request('GET', '/leaderboards', params={'type': 'global'})
            
            if response and response.status_code == 200:
                self.log_result(
                    "BASELINE - Leaderboards API GET",
                    True,
                    f"Working correctly: {response.status_code}, {info['response_time']:.2f}s",
                    info.get('json', {})
                )
            else:
                self.log_result(
                    "BASELINE - Leaderboards API GET",
                    False,
                    f"Unexpected failure: {response.status_code if response else 'No response'}",
                    info
                )
        except Exception as e:
            self.log_result(
                "BASELINE - Leaderboards API GET",
                False,
                f"Exception: {str(e)}"
            )

    def test_failing_friendships_api(self):
        """Deep investigation of Friendships API 500 errors"""
        print("🚨 Deep Investigation: Friendships API (500 errors)...")
        
        # Test 1: Basic GET request
        try:
            response, info = self.make_detailed_request('GET', '/friendships')
            
            self.log_result(
                "FAILING - Friendships API GET (no params)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['friendships_no_params'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Friendships API GET (no params)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 2: GET with user_id parameter
        try:
            response, info = self.make_detailed_request('GET', '/friendships', params={'user_id': TEST_USER_ID})
            
            self.log_result(
                "FAILING - Friendships API GET (with user_id)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['friendships_with_user_id'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Friendships API GET (with user_id)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 3: GET with different parameters
        try:
            response, info = self.make_detailed_request('GET', '/friendships', params={
                'user_id': TEST_USER_ID,
                'status': 'accepted',
                'limit': 10
            })
            
            self.log_result(
                "FAILING - Friendships API GET (with multiple params)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['friendships_multiple_params'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Friendships API GET (with multiple params)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 4: POST request
        try:
            friendship_data = {
                'requester_id': TEST_USER_ID,
                'recipient_id': TEST_FRIEND_ID,
                'status': 'pending'
            }
            
            response, info = self.make_detailed_request('POST', '/friendships', data=friendship_data)
            
            self.log_result(
                "FAILING - Friendships API POST",
                response and response.status_code in [200, 201],
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['friendships_post'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Friendships API POST",
                False,
                f"Exception: {str(e)}"
            )

    def test_failing_teams_api(self):
        """Deep investigation of Teams API 500 errors"""
        print("🚨 Deep Investigation: Teams API (500 errors)...")
        
        # Test 1: Basic GET request
        try:
            response, info = self.make_detailed_request('GET', '/teams')
            
            self.log_result(
                "FAILING - Teams API GET (no params)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['teams_no_params'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Teams API GET (no params)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 2: GET with filters
        try:
            response, info = self.make_detailed_request('GET', '/teams', params={
                'sport': 'Soccer',
                'limit': 10
            })
            
            self.log_result(
                "FAILING - Teams API GET (with filters)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['teams_with_filters'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Teams API GET (with filters)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 3: GET with user_id
        try:
            response, info = self.make_detailed_request('GET', '/teams', params={'user_id': TEST_USER_ID})
            
            self.log_result(
                "FAILING - Teams API GET (with user_id)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['teams_with_user_id'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Teams API GET (with user_id)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 4: POST request
        try:
            team_data = {
                'name': 'Test Elite Team',
                'sport': 'Soccer',
                'captain_id': TEST_USER_ID,
                'max_members': 15,
                'privacy_level': 'public'
            }
            
            response, info = self.make_detailed_request('POST', '/teams', data=team_data)
            
            self.log_result(
                "FAILING - Teams API POST",
                response and response.status_code in [200, 201],
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['teams_post'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Teams API POST",
                False,
                f"Exception: {str(e)}"
            )

    def test_failing_notifications_api(self):
        """Deep investigation of Notifications API 500 errors"""
        print("🚨 Deep Investigation: Notifications API (500 errors)...")
        
        # Test 1: Basic GET request
        try:
            response, info = self.make_detailed_request('GET', '/notifications')
            
            self.log_result(
                "FAILING - Notifications API GET (no params)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['notifications_no_params'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Notifications API GET (no params)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 2: GET with user_id
        try:
            response, info = self.make_detailed_request('GET', '/notifications', params={'user_id': TEST_USER_ID})
            
            self.log_result(
                "FAILING - Notifications API GET (with user_id)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['notifications_with_user_id'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Notifications API GET (with user_id)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 3: GET with filters
        try:
            response, info = self.make_detailed_request('GET', '/notifications', params={
                'user_id': TEST_USER_ID,
                'type': 'friend_request',
                'read': False
            })
            
            self.log_result(
                "FAILING - Notifications API GET (with filters)",
                response and response.status_code == 200,
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['notifications_with_filters'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Notifications API GET (with filters)",
                False,
                f"Exception: {str(e)}"
            )

        # Test 4: POST request
        try:
            notification_data = {
                'user_id': TEST_USER_ID,
                'type': 'friend_request',
                'title': 'New Friend Request',
                'message': 'You have a new friend request',
                'data': {'requester_id': TEST_FRIEND_ID}
            }
            
            response, info = self.make_detailed_request('POST', '/notifications', data=notification_data)
            
            self.log_result(
                "FAILING - Notifications API POST",
                response and response.status_code in [200, 201],
                f"Status: {response.status_code if response else 'No response'}, Time: {info.get('response_time', 0):.2f}s",
                info
            )
            
            if response and response.status_code == 500:
                self.error_details['notifications_post'] = info
                
        except Exception as e:
            self.log_result(
                "FAILING - Notifications API POST",
                False,
                f"Exception: {str(e)}"
            )

    def analyze_error_patterns(self):
        """Analyze error patterns to identify root causes"""
        print("🔬 Analyzing Error Patterns...")
        
        # Common error patterns to look for
        common_patterns = [
            'table',
            'relation',
            'does not exist',
            'PGRST',
            'RLS',
            'permission',
            'authentication',
            'authorization',
            'foreign key',
            'constraint',
            'syntax error',
            'connection',
            'timeout'
        ]
        
        pattern_analysis = {}
        
        for error_key, error_info in self.error_details.items():
            patterns_found = []
            
            # Check in JSON response
            if 'json' in error_info:
                error_text = json.dumps(error_info['json']).lower()
                for pattern in common_patterns:
                    if pattern in error_text:
                        patterns_found.append(pattern)
            
            # Check in text response
            if 'text' in error_info:
                error_text = error_info['text'].lower()
                for pattern in common_patterns:
                    if pattern in error_text:
                        patterns_found.append(pattern)
            
            pattern_analysis[error_key] = {
                'patterns': patterns_found,
                'status_code': error_info.get('status_code'),
                'response_time': error_info.get('response_time')
            }
        
        # Print analysis
        print("\n📊 ERROR PATTERN ANALYSIS:")
        for error_key, analysis in pattern_analysis.items():
            print(f"\n{error_key}:")
            print(f"  Status Code: {analysis['status_code']}")
            print(f"  Response Time: {analysis.get('response_time', 'N/A')}")
            print(f"  Patterns Found: {analysis['patterns']}")
        
        return pattern_analysis

    def generate_recommendations(self, pattern_analysis):
        """Generate specific recommendations based on error analysis"""
        print("\n💡 RECOMMENDATIONS:")
        
        # Analyze patterns across all errors
        all_patterns = []
        for analysis in pattern_analysis.values():
            all_patterns.extend(analysis['patterns'])
        
        pattern_counts = {}
        for pattern in all_patterns:
            pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
        
        # Generate recommendations based on most common patterns
        if 'table' in pattern_counts or 'relation' in pattern_counts:
            print("🔧 DATABASE SCHEMA ISSUE:")
            print("   - Missing database tables detected")
            print("   - Recommendation: Create missing social tables in Supabase")
            print("   - Tables needed: friendships, teams, notifications")
        
        if 'rls' in pattern_counts or 'permission' in pattern_counts:
            print("🔒 RLS POLICY ISSUE:")
            print("   - Row Level Security policies blocking access")
            print("   - Recommendation: Review and update RLS policies")
            print("   - Consider using service role key for admin operations")
        
        if 'foreign key' in pattern_counts or 'constraint' in pattern_counts:
            print("🔗 FOREIGN KEY CONSTRAINT ISSUE:")
            print("   - Foreign key violations detected")
            print("   - Recommendation: Clean up orphaned data")
            print("   - Ensure referential integrity")
        
        if 'authentication' in pattern_counts or 'authorization' in pattern_counts:
            print("🔐 AUTHENTICATION ISSUE:")
            print("   - Authentication/authorization failures")
            print("   - Recommendation: Check JWT tokens and auth headers")
            print("   - Verify user permissions")
        
        if 'connection' in pattern_counts or 'timeout' in pattern_counts:
            print("🌐 CONNECTION ISSUE:")
            print("   - Network or connection problems")
            print("   - Recommendation: Check service connectivity")
            print("   - Verify Next.js API is running on port 3001")
        
        # Specific API recommendations
        failing_apis = [key for key in pattern_analysis.keys() if any(api in key for api in ['friendships', 'teams', 'notifications'])]
        
        if failing_apis:
            print(f"\n🎯 SPECIFIC API FIXES NEEDED:")
            for api_error in failing_apis:
                if 'friendships' in api_error:
                    print("   - Friendships API: Check friendships table schema and RLS policies")
                elif 'teams' in api_error:
                    print("   - Teams API: Check teams table schema and team_members table")
                elif 'notifications' in api_error:
                    print("   - Notifications API: Check notifications table schema and indexes")

    def run_investigation(self):
        """Run complete investigation of failing APIs"""
        print("🚀 Starting Failing APIs Deep Investigation...")
        print("=" * 60)
        
        # Test working APIs first for baseline
        self.test_working_apis_baseline()
        
        # Deep dive into failing APIs
        self.test_failing_friendships_api()
        self.test_failing_teams_api()
        self.test_failing_notifications_api()
        
        # Analyze error patterns
        pattern_analysis = self.analyze_error_patterns()
        
        # Generate recommendations
        self.generate_recommendations(pattern_analysis)
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 INVESTIGATION SUMMARY:")
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print(f"\n🔍 Error Details Captured: {len(self.error_details)} API endpoints")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'error_details': self.error_details,
            'pattern_analysis': pattern_analysis
        }

if __name__ == "__main__":
    investigator = FailingAPIsInvestigator()
    results = investigator.run_investigation()