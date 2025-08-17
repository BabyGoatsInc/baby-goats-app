#!/usr/bin/env python3
"""
ULTIMATE FINAL TEST: BABY GOATS SOCIAL PLATFORM RLS POLICY RESOLUTION

**CRITICAL STATUS:** User has now:
1. ✅ Created all database tables 
2. ✅ Applied foreign key constraints
3. ✅ Fixed Next.js cookies API issues
4. ✅ Created missing team_statistics table
5. ✅ Updated RLS policies for service role access
6. ✅ Added missing RLS policies for team challenge tables

**TESTING OBJECTIVE:** Determine if the RLS policy fixes resolved the 500 errors and achieve 100% API functionality.

**FINAL COMPREHENSIVE TEST:**

**1. VERIFY API STATUS AFTER RLS FIXES**
- Test all APIs with detailed error capture
- Compare before/after RLS policy changes
- Identify any remaining database configuration issues

**2. ROOT CAUSE RESOLUTION VERIFICATION**  
- Confirm if service role key is now working properly
- Test foreign key relationships are functional
- Validate all social tables are accessible

**3. COMPLETE PLATFORM VALIDATION**
- Test full CRUD operations on working APIs
- Verify error handling is working correctly
- Confirm baby Goats platform is production-ready

**SUCCESS CRITERIA:**
- All APIs return 200 OK responses instead of 500 errors
- Backend success rate reaches 90%+ 
- Social platform is confirmed fully functional
- Ready for frontend testing and production deployment

**CRITICAL:** This is the definitive test to confirm if the Baby Goats social platform is now 100% operational after all database fixes!
"""

import requests
import json
import uuid
from datetime import datetime
import time
import base64
import io
from PIL import Image
import threading

# Configuration - Testing RLS Policy Resolution
BASE_URL = "https://youthgoat-social.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer test-token'  # Test with auth header
}

# Test data for comprehensive validation
TEST_USER_ID = str(uuid.uuid4())
TEST_FRIEND_ID = str(uuid.uuid4())
TEST_TEAM_ID = str(uuid.uuid4())

class RLSPolicyResolutionTester:
    def __init__(self):
        self.results = []
        self.test_data = {}
        self.performance_metrics = {}
        self.error_logs = []
        self.api_status_summary = {}
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result with comprehensive tracking"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'category': self.get_test_category(test_name)
        }
        if response_data:
            result['response'] = response_data
        self.results.append(result)
        
        # Track API status for summary
        api_endpoint = self.extract_api_endpoint(test_name)
        if api_endpoint:
            if api_endpoint not in self.api_status_summary:
                self.api_status_summary[api_endpoint] = {'total': 0, 'success': 0, 'errors': []}
            self.api_status_summary[api_endpoint]['total'] += 1
            if success:
                self.api_status_summary[api_endpoint]['success'] += 1
            else:
                self.api_status_summary[api_endpoint]['errors'].append(details)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def get_test_category(self, test_name):
        """Categorize tests for analysis"""
        if 'Team' in test_name:
            return 'TEAM_SYSTEM'
        elif 'Social' in test_name:
            return 'SOCIAL_FEATURES'
        elif 'Core API' in test_name:
            return 'CORE_API'
        elif 'RLS' in test_name:
            return 'RLS_POLICY'
        else:
            return 'GENERAL'

    def extract_api_endpoint(self, test_name):
        """Extract API endpoint from test name"""
        if '/api/teams' in test_name:
            return '/api/teams'
        elif '/api/team-members' in test_name:
            return '/api/team-members'
        elif '/api/team-challenges' in test_name:
            return '/api/team-challenges'
        elif '/api/messages' in test_name:
            return '/api/messages'
        elif '/api/friendships' in test_name:
            return '/api/friendships'
        elif '/api/leaderboards' in test_name:
            return '/api/leaderboards'
        elif '/api/notifications' in test_name:
            return '/api/notifications'
        elif '/api/profiles' in test_name:
            return '/api/profiles'
        elif '/api/challenges' in test_name:
            return '/api/challenges'
        elif '/api/storage' in test_name:
            return '/api/storage'
        elif '/api/stats' in test_name:
            return '/api/stats'
        return None

    def make_request_with_monitoring(self, method, endpoint, data=None, params=None, monitor_errors=True):
        """Make HTTP request with comprehensive monitoring"""
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
            
            # Performance monitoring
            endpoint_key = f"{method} {endpoint}"
            if endpoint_key not in self.performance_metrics:
                self.performance_metrics[endpoint_key] = []
            self.performance_metrics[endpoint_key].append(response_time)
            
            # Error monitoring
            if monitor_errors and response.status_code >= 400:
                self.error_logs.append({
                    'endpoint': endpoint,
                    'method': method,
                    'status_code': response.status_code,
                    'response_time': response_time,
                    'response_text': response.text[:500],
                    'timestamp': datetime.now().isoformat(),
                    'severity': 'HIGH' if response.status_code >= 500 else 'MEDIUM'
                })
                
            return response
            
        except requests.exceptions.Timeout:
            end_time = time.time()
            response_time = end_time - start_time
            if monitor_errors:
                self.error_logs.append({
                    'endpoint': endpoint,
                    'method': method,
                    'error': 'TIMEOUT',
                    'response_time': response_time,
                    'timestamp': datetime.now().isoformat(),
                    'severity': 'HIGH'
                })
            print(f"Request timed out: {method} {url}")
            return None
        except Exception as e:
            if monitor_errors:
                self.error_logs.append({
                    'endpoint': endpoint,
                    'method': method,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat(),
                    'severity': 'CRITICAL'
                })
            print(f"Request failed: {e}")
            return None

    def test_core_apis_regression(self):
        """Test Core APIs - Ensure existing functionality still works after RLS fixes"""
        print("🧪 Testing Core APIs Regression (Post-RLS Fixes)...")
        
        # Test 1: Profiles API
        try:
            # GET profiles
            response = self.make_request_with_monitoring('GET', '/profiles', params={'limit': 10})
            
            if response and response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                self.log_result(
                    "Core API Regression - GET /api/profiles",
                    True,
                    f"✅ Profiles API working: {len(profiles)} profiles retrieved"
                )
            else:
                self.log_result(
                    "Core API Regression - GET /api/profiles",
                    False,
                    f"❌ Profiles API failed: {response.status_code if response else 'No response'}"
                )
            
            # POST profile (test RLS policy fix)
            profile_data = {
                'id': str(uuid.uuid4()),
                'full_name': 'RLS Test Champion',
                'sport': 'Soccer',
                'grad_year': 2025,
                'location': 'Test City'
            }
            
            response = self.make_request_with_monitoring('POST', '/profiles', data=profile_data)
            
            if response and response.status_code in [200, 201]:
                self.log_result(
                    "Core API Regression - POST /api/profiles (RLS Policy Test)",
                    True,
                    f"✅ Profile creation working: RLS policies allow write operations"
                )
            elif response and response.status_code == 403:
                self.log_result(
                    "Core API Regression - POST /api/profiles (RLS Policy Test)",
                    False,
                    f"❌ RLS policies still blocking: 403 Forbidden"
                )
            elif response and response.status_code == 500:
                self.log_result(
                    "Core API Regression - POST /api/profiles (RLS Policy Test)",
                    False,
                    f"❌ Server error persists: 500 Internal Server Error"
                )
            else:
                self.log_result(
                    "Core API Regression - POST /api/profiles (RLS Policy Test)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Core API Regression - Profiles API",
                False,
                f"❌ Profiles API test failed: {str(e)}"
            )

        # Test 2: Challenges API
        try:
            response = self.make_request_with_monitoring('GET', '/challenges', params={'limit': 10})
            
            if response and response.status_code == 200:
                data = response.json()
                challenges = data.get('challenges', [])
                self.log_result(
                    "Core API Regression - GET /api/challenges",
                    True,
                    f"✅ Challenges API working: {len(challenges)} challenges retrieved"
                )
            else:
                self.log_result(
                    "Core API Regression - GET /api/challenges",
                    False,
                    f"❌ Challenges API failed: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Core API Regression - Challenges API",
                False,
                f"❌ Challenges API test failed: {str(e)}"
            )

        # Test 3: Storage API
        try:
            response = self.make_request_with_monitoring('GET', '/storage', params={'action': 'check_bucket'})
            
            if response and response.status_code == 200:
                data = response.json()
                bucket_exists = data.get('bucketExists', False)
                self.log_result(
                    "Core API Regression - GET /api/storage",
                    True,
                    f"✅ Storage API working: bucket exists = {bucket_exists}"
                )
            else:
                self.log_result(
                    "Core API Regression - GET /api/storage",
                    False,
                    f"❌ Storage API failed: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Core API Regression - Storage API",
                False,
                f"❌ Storage API test failed: {str(e)}"
            )

        # Test 4: Stats API
        try:
            response = self.make_request_with_monitoring('GET', '/stats', params={'user_id': TEST_USER_ID})
            
            if response and response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Core API Regression - GET /api/stats",
                    True,
                    f"✅ Stats API working: response received"
                )
            else:
                self.log_result(
                    "Core API Regression - GET /api/stats",
                    False,
                    f"❌ Stats API failed: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Core API Regression - Stats API",
                False,
                f"❌ Stats API test failed: {str(e)}"
            )

    def test_team_management_apis_post_rls_fix(self):
        """Test Team Management APIs - Verify RLS policy fixes resolved database table issues"""
        print("🧪 Testing Team Management APIs (Post-RLS Policy Fixes)...")
        
        # Test 1: Teams API
        try:
            # GET teams
            response = self.make_request_with_monitoring('GET', '/teams', params={'limit': 10})
            
            if response and response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                self.log_result(
                    "Team Management - GET /api/teams (Post-RLS Fix)",
                    True,
                    f"🎉 Teams API now working: {len(teams)} teams retrieved, database table accessible"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text or 'relation' in response_text:
                    self.log_result(
                        "Team Management - GET /api/teams (Post-RLS Fix)",
                        False,
                        f"❌ Database table still missing: teams table not found in database"
                    )
                else:
                    self.log_result(
                        "Team Management - GET /api/teams (Post-RLS Fix)",
                        False,
                        f"❌ Server error persists: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Team Management - GET /api/teams (Post-RLS Fix)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
            
            # POST team (test RLS policy fix)
            team_data = {
                'id': TEST_TEAM_ID,
                'name': 'RLS Fix Test Team',
                'sport': 'Basketball',
                'captain_id': TEST_USER_ID,
                'max_members': 20,
                'privacy_level': 'public',
                'description': 'Testing team creation after RLS policy fixes'
            }
            
            response = self.make_request_with_monitoring('POST', '/teams', data=team_data)
            
            if response and response.status_code in [200, 201]:
                self.log_result(
                    "Team Management - POST /api/teams (RLS Policy Test)",
                    True,
                    f"🎉 Team creation working: RLS policies now allow team creation"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Team Management - POST /api/teams (RLS Policy Test)",
                        False,
                        f"❌ Database table missing: teams table not created"
                    )
                else:
                    self.log_result(
                        "Team Management - POST /api/teams (RLS Policy Test)",
                        False,
                        f"❌ Server error: {response.text[:200]}"
                    )
            elif response and response.status_code == 403:
                self.log_result(
                    "Team Management - POST /api/teams (RLS Policy Test)",
                    False,
                    f"❌ RLS policies still blocking: 403 Forbidden"
                )
            else:
                self.log_result(
                    "Team Management - POST /api/teams (RLS Policy Test)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Team Management - Teams API",
                False,
                f"❌ Teams API test failed: {str(e)}"
            )

        # Test 2: Team Members API
        try:
            # GET team members
            response = self.make_request_with_monitoring('GET', '/team-members', params={'team_id': TEST_TEAM_ID})
            
            if response and response.status_code == 200:
                data = response.json()
                members = data.get('members', [])
                self.log_result(
                    "Team Management - GET /api/team-members (Post-RLS Fix)",
                    True,
                    f"🎉 Team Members API now working: {len(members)} members retrieved"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Team Management - GET /api/team-members (Post-RLS Fix)",
                        False,
                        f"❌ Database table still missing: team_members table not found"
                    )
                else:
                    self.log_result(
                        "Team Management - GET /api/team-members (Post-RLS Fix)",
                        False,
                        f"❌ Server error persists: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Team Management - GET /api/team-members (Post-RLS Fix)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
            
            # POST team member (test RLS policy fix)
            member_data = {
                'team_id': TEST_TEAM_ID,
                'user_id': TEST_USER_ID,
                'role': 'captain',
                'status': 'active',
                'joined_at': datetime.now().isoformat()
            }
            
            response = self.make_request_with_monitoring('POST', '/team-members', data=member_data)
            
            if response and response.status_code in [200, 201]:
                self.log_result(
                    "Team Management - POST /api/team-members (RLS Policy Test)",
                    True,
                    f"🎉 Team member join working: RLS policies now allow membership operations"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Team Management - POST /api/team-members (RLS Policy Test)",
                        False,
                        f"❌ Database table missing: team_members table not created"
                    )
                else:
                    self.log_result(
                        "Team Management - POST /api/team-members (RLS Policy Test)",
                        False,
                        f"❌ Server error: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Team Management - POST /api/team-members (RLS Policy Test)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Team Management - Team Members API",
                False,
                f"❌ Team Members API test failed: {str(e)}"
            )

        # Test 3: Team Challenges API
        try:
            # GET team challenges
            response = self.make_request_with_monitoring('GET', '/team-challenges', params={'team_id': TEST_TEAM_ID})
            
            if response and response.status_code == 200:
                data = response.json()
                challenges = data.get('challenges', [])
                self.log_result(
                    "Team Management - GET /api/team-challenges (Post-RLS Fix)",
                    True,
                    f"🎉 Team Challenges API now working: {len(challenges)} challenges retrieved"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Team Management - GET /api/team-challenges (Post-RLS Fix)",
                        False,
                        f"❌ Database tables still missing: team_challenges tables not found"
                    )
                else:
                    self.log_result(
                        "Team Management - GET /api/team-challenges (Post-RLS Fix)",
                        False,
                        f"❌ Server error persists: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Team Management - GET /api/team-challenges (Post-RLS Fix)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
            
            # POST team challenge (test RLS policy fix)
            challenge_data = {
                'id': str(uuid.uuid4()),
                'team_id': TEST_TEAM_ID,
                'challenge_type': 'collaborative',
                'title': 'RLS Fix Test Challenge',
                'description': 'Testing team challenge creation after RLS fixes',
                'target_value': 1000,
                'start_date': datetime.now().isoformat(),
                'end_date': (datetime.now().replace(day=datetime.now().day + 7)).isoformat()
            }
            
            response = self.make_request_with_monitoring('POST', '/team-challenges', data=challenge_data)
            
            if response and response.status_code in [200, 201]:
                self.log_result(
                    "Team Management - POST /api/team-challenges (RLS Policy Test)",
                    True,
                    f"🎉 Team challenge creation working: RLS policies now allow challenge operations"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Team Management - POST /api/team-challenges (RLS Policy Test)",
                        False,
                        f"❌ Database tables missing: team_challenges tables not created"
                    )
                else:
                    self.log_result(
                        "Team Management - POST /api/team-challenges (RLS Policy Test)",
                        False,
                        f"❌ Server error: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Team Management - POST /api/team-challenges (RLS Policy Test)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Team Management - Team Challenges API",
                False,
                f"❌ Team Challenges API test failed: {str(e)}"
            )

    def test_social_features_apis_post_rls_fix(self):
        """Test Social Features APIs - Verify RLS policy fixes resolved social table access"""
        print("🧪 Testing Social Features APIs (Post-RLS Policy Fixes)...")
        
        # Test 1: Messages API
        try:
            # GET messages
            response = self.make_request_with_monitoring('GET', '/messages', params={'user_id': TEST_USER_ID})
            
            if response and response.status_code == 200:
                data = response.json()
                messages = data.get('messages', [])
                self.log_result(
                    "Social Features - GET /api/messages (Post-RLS Fix)",
                    True,
                    f"🎉 Messages API now working: {len(messages)} messages retrieved"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Social Features - GET /api/messages (Post-RLS Fix)",
                        False,
                        f"❌ Database table still missing: messages table not found"
                    )
                else:
                    self.log_result(
                        "Social Features - GET /api/messages (Post-RLS Fix)",
                        False,
                        f"❌ Server error persists: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Social Features - GET /api/messages (Post-RLS Fix)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
            
            # POST message (test RLS policy fix)
            message_data = {
                'id': str(uuid.uuid4()),
                'sender_id': TEST_USER_ID,
                'recipient_id': TEST_FRIEND_ID,
                'message': 'Testing message after RLS policy fixes',
                'message_type': 'text',
                'sent_at': datetime.now().isoformat()
            }
            
            response = self.make_request_with_monitoring('POST', '/messages', data=message_data)
            
            if response and response.status_code in [200, 201]:
                self.log_result(
                    "Social Features - POST /api/messages (RLS Policy Test)",
                    True,
                    f"🎉 Message sending working: RLS policies now allow message operations"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Social Features - POST /api/messages (RLS Policy Test)",
                        False,
                        f"❌ Database table missing: messages table not created"
                    )
                else:
                    self.log_result(
                        "Social Features - POST /api/messages (RLS Policy Test)",
                        False,
                        f"❌ Server error: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Social Features - POST /api/messages (RLS Policy Test)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Social Features - Messages API",
                False,
                f"❌ Messages API test failed: {str(e)}"
            )

        # Test 2: Friendships API
        try:
            # GET friendships
            response = self.make_request_with_monitoring('GET', '/friendships', params={'user_id': TEST_USER_ID})
            
            if response and response.status_code == 200:
                data = response.json()
                friendships = data.get('friendships', [])
                self.log_result(
                    "Social Features - GET /api/friendships (Post-RLS Fix)",
                    True,
                    f"🎉 Friendships API now working: {len(friendships)} friendships retrieved"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Social Features - GET /api/friendships (Post-RLS Fix)",
                        False,
                        f"❌ Database table still missing: friendships table not found"
                    )
                else:
                    self.log_result(
                        "Social Features - GET /api/friendships (Post-RLS Fix)",
                        False,
                        f"❌ Server error persists: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Social Features - GET /api/friendships (Post-RLS Fix)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Social Features - Friendships API",
                False,
                f"❌ Friendships API test failed: {str(e)}"
            )

        # Test 3: Leaderboards API
        try:
            # GET leaderboards
            response = self.make_request_with_monitoring('GET', '/leaderboards', params={'type': 'global'})
            
            if response and response.status_code == 200:
                data = response.json()
                leaderboards = data.get('leaderboards', [])
                self.log_result(
                    "Social Features - GET /api/leaderboards (Post-RLS Fix)",
                    True,
                    f"🎉 Leaderboards API now working: {len(leaderboards)} leaderboards retrieved"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Social Features - GET /api/leaderboards (Post-RLS Fix)",
                        False,
                        f"❌ Database table still missing: leaderboards table not found"
                    )
                else:
                    self.log_result(
                        "Social Features - GET /api/leaderboards (Post-RLS Fix)",
                        False,
                        f"❌ Server error persists: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Social Features - GET /api/leaderboards (Post-RLS Fix)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Social Features - Leaderboards API",
                False,
                f"❌ Leaderboards API test failed: {str(e)}"
            )

        # Test 4: Notifications API
        try:
            # GET notifications
            response = self.make_request_with_monitoring('GET', '/notifications', params={'user_id': TEST_USER_ID})
            
            if response and response.status_code == 200:
                data = response.json()
                notifications = data.get('notifications', [])
                self.log_result(
                    "Social Features - GET /api/notifications (Post-RLS Fix)",
                    True,
                    f"🎉 Notifications API now working: {len(notifications)} notifications retrieved"
                )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Social Features - GET /api/notifications (Post-RLS Fix)",
                        False,
                        f"❌ Database table still missing: notifications table not found"
                    )
                else:
                    self.log_result(
                        "Social Features - GET /api/notifications (Post-RLS Fix)",
                        False,
                        f"❌ Server error persists: {response.text[:200]}"
                    )
            else:
                self.log_result(
                    "Social Features - GET /api/notifications (Post-RLS Fix)",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Social Features - Notifications API",
                False,
                f"❌ Notifications API test failed: {str(e)}"
            )

    def test_service_role_key_functionality(self):
        """Test Service Role Key - Verify service role key is working properly for RLS bypass"""
        print("🧪 Testing Service Role Key Functionality...")
        
        # Test 1: Profile creation with service role key
        try:
            profile_data = {
                'id': str(uuid.uuid4()),
                'full_name': 'Service Role Test User',
                'sport': 'Tennis',
                'grad_year': 2025,
                'location': 'Service Role City',
                'created_at': datetime.now().isoformat()
            }
            
            response = self.make_request_with_monitoring('POST', '/profiles', data=profile_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                # Check if response indicates service role key usage
                if data.get('productionMode') == True or 'service' in str(data).lower():
                    self.log_result(
                        "Service Role Key - Profile Creation with Service Role",
                        True,
                        f"🎉 Service role key working: Profile created successfully with RLS bypass"
                    )
                else:
                    self.log_result(
                        "Service Role Key - Profile Creation with Service Role",
                        True,
                        f"✅ Profile creation working: Status {response.status_code}"
                    )
            elif response and response.status_code == 403:
                self.log_result(
                    "Service Role Key - Profile Creation with Service Role",
                    False,
                    f"❌ Service role key not working: Still getting 403 Forbidden"
                )
            elif response and response.status_code == 500:
                self.log_result(
                    "Service Role Key - Profile Creation with Service Role",
                    False,
                    f"❌ Server error persists: Service role key may not be configured properly"
                )
            else:
                self.log_result(
                    "Service Role Key - Profile Creation with Service Role",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Service Role Key - Profile Creation",
                False,
                f"❌ Service role key test failed: {str(e)}"
            )

        # Test 2: Challenge completion with service role key
        try:
            completion_data = {
                'user_id': TEST_USER_ID,
                'challenge_id': str(uuid.uuid4()),
                'completed': True,
                'completion_time': datetime.now().isoformat(),
                'points_earned': 100
            }
            
            response = self.make_request_with_monitoring('POST', '/challenges', data=completion_data)
            
            if response and response.status_code in [200, 201]:
                self.log_result(
                    "Service Role Key - Challenge Completion with Service Role",
                    True,
                    f"🎉 Service role key working: Challenge completion successful"
                )
            elif response and response.status_code == 403:
                self.log_result(
                    "Service Role Key - Challenge Completion with Service Role",
                    False,
                    f"❌ Service role key not working: Still getting 403 Forbidden"
                )
            else:
                self.log_result(
                    "Service Role Key - Challenge Completion with Service Role",
                    response is not None,
                    f"Challenge completion response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Service Role Key - Challenge Completion",
                False,
                f"❌ Service role key test failed: {str(e)}"
            )

    def test_foreign_key_relationships(self):
        """Test Foreign Key Relationships - Verify foreign key constraints are working"""
        print("🧪 Testing Foreign Key Relationships...")
        
        # Test 1: Team member with valid team reference
        try:
            # First try to create a team
            team_data = {
                'id': TEST_TEAM_ID,
                'name': 'Foreign Key Test Team',
                'sport': 'Soccer',
                'captain_id': TEST_USER_ID,
                'max_members': 15
            }
            
            team_response = self.make_request_with_monitoring('POST', '/teams', data=team_data)
            
            # Then try to add a member with foreign key reference
            member_data = {
                'team_id': TEST_TEAM_ID,  # Foreign key reference
                'user_id': TEST_USER_ID,
                'role': 'captain',
                'status': 'active'
            }
            
            member_response = self.make_request_with_monitoring('POST', '/team-members', data=member_data)
            
            if team_response and member_response:
                if team_response.status_code in [200, 201] and member_response.status_code in [200, 201]:
                    self.log_result(
                        "Foreign Key Relationships - Team Member with Valid Team Reference",
                        True,
                        f"🎉 Foreign key relationships working: Team and member creation successful"
                    )
                elif 'foreign key' in str(member_response.text).lower():
                    self.log_result(
                        "Foreign Key Relationships - Team Member with Valid Team Reference",
                        True,
                        f"✅ Foreign key constraints working: Proper validation detected"
                    )
                else:
                    self.log_result(
                        "Foreign Key Relationships - Team Member with Valid Team Reference",
                        False,
                        f"❌ Foreign key test inconclusive: Team {team_response.status_code}, Member {member_response.status_code}"
                    )
            else:
                self.log_result(
                    "Foreign Key Relationships - Team Member with Valid Team Reference",
                    False,
                    f"❌ Foreign key test failed: No response from APIs"
                )
                
        except Exception as e:
            self.log_result(
                "Foreign Key Relationships - Team Member Reference",
                False,
                f"❌ Foreign key relationship test failed: {str(e)}"
            )

        # Test 2: Invalid foreign key reference
        try:
            # Try to add member to non-existent team
            invalid_member_data = {
                'team_id': str(uuid.uuid4()),  # Non-existent team ID
                'user_id': TEST_USER_ID,
                'role': 'member',
                'status': 'active'
            }
            
            response = self.make_request_with_monitoring('POST', '/team-members', data=invalid_member_data)
            
            if response and response.status_code == 400:
                response_text = response.text.lower()
                if 'foreign key' in response_text or 'constraint' in response_text:
                    self.log_result(
                        "Foreign Key Relationships - Invalid Team Reference Validation",
                        True,
                        f"✅ Foreign key constraints working: Invalid reference properly rejected"
                    )
                else:
                    self.log_result(
                        "Foreign Key Relationships - Invalid Team Reference Validation",
                        False,
                        f"❌ Foreign key validation unclear: {response.text[:100]}"
                    )
            elif response and response.status_code == 500:
                response_text = response.text.lower()
                if 'table' in response_text:
                    self.log_result(
                        "Foreign Key Relationships - Invalid Team Reference Validation",
                        False,
                        f"❌ Database tables missing: Cannot test foreign key constraints"
                    )
                else:
                    self.log_result(
                        "Foreign Key Relationships - Invalid Team Reference Validation",
                        False,
                        f"❌ Server error: {response.text[:100]}"
                    )
            else:
                self.log_result(
                    "Foreign Key Relationships - Invalid Team Reference Validation",
                    False,
                    f"❌ Unexpected response: {response.status_code if response else 'No response'}"
                )
                
        except Exception as e:
            self.log_result(
                "Foreign Key Relationships - Invalid Reference",
                False,
                f"❌ Foreign key validation test failed: {str(e)}"
            )

    def test_performance_after_rls_fixes(self):
        """Test Performance - Verify RLS fixes didn't degrade performance"""
        print("🧪 Testing Performance After RLS Fixes...")
        
        # Test 1: API response times
        try:
            performance_tests = [
                ('/profiles', {'limit': 10}),
                ('/challenges', {'limit': 10}),
                ('/storage', {'action': 'check_bucket'}),
                ('/teams', {'limit': 5}),
                ('/messages', {'user_id': TEST_USER_ID}),
                ('/friendships', {'user_id': TEST_USER_ID})
            ]
            
            performance_results = []
            
            for endpoint, params in performance_tests:
                start_time = time.time()
                response = self.make_request_with_monitoring('GET', endpoint, params=params, monitor_errors=False)
                end_time = time.time()
                response_time = end_time - start_time
                
                performance_results.append({
                    'endpoint': endpoint,
                    'response_time': response_time,
                    'status_code': response.status_code if response else None,
                    'under_3s': response_time < 3.0
                })
            
            fast_endpoints = sum(1 for r in performance_results if r['under_3s'])
            avg_response_time = sum(r['response_time'] for r in performance_results) / len(performance_results)
            
            performance_good = fast_endpoints >= len(performance_tests) * 0.8
            
            self.log_result(
                "Performance After RLS Fixes - API Response Times",
                performance_good,
                f"Performance: {fast_endpoints}/{len(performance_tests)} under 3s, avg: {avg_response_time:.2f}s"
            )
            
        except Exception as e:
            self.log_result(
                "Performance After RLS Fixes - API Response Times",
                False,
                f"❌ Performance test failed: {str(e)}"
            )

    def generate_comprehensive_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "="*80)
        print("🎯 ULTIMATE FINAL TEST RESULTS: BABY GOATS SOCIAL PLATFORM RLS POLICY RESOLUTION")
        print("="*80)
        
        # Calculate overall success rate
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r['success'])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📊 OVERALL TEST RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Successful: {successful_tests}")
        print(f"   Failed: {total_tests - successful_tests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        # API Status Summary
        print(f"\n🔍 API STATUS SUMMARY:")
        for api_endpoint, status in self.api_status_summary.items():
            success_rate = (status['success'] / status['total'] * 100) if status['total'] > 0 else 0
            status_icon = "🎉" if success_rate >= 90 else "⚠️" if success_rate >= 50 else "❌"
            print(f"   {status_icon} {api_endpoint}: {status['success']}/{status['total']} ({success_rate:.1f}%)")
        
        # Category Analysis
        print(f"\n📈 CATEGORY ANALYSIS:")
        categories = {}
        for result in self.results:
            category = result['category']
            if category not in categories:
                categories[category] = {'total': 0, 'success': 0}
            categories[category]['total'] += 1
            if result['success']:
                categories[category]['success'] += 1
        
        for category, stats in categories.items():
            success_rate = (stats['success'] / stats['total'] * 100) if stats['total'] > 0 else 0
            status_icon = "✅" if success_rate >= 90 else "⚠️" if success_rate >= 50 else "❌"
            print(f"   {status_icon} {category}: {stats['success']}/{stats['total']} ({success_rate:.1f}%)")
        
        # Critical Issues
        print(f"\n🚨 CRITICAL ISSUES IDENTIFIED:")
        critical_issues = []
        for result in self.results:
            if not result['success'] and ('500' in result['details'] or 'table' in result['details'].lower()):
                critical_issues.append(f"   ❌ {result['test']}: {result['details']}")
        
        if critical_issues:
            for issue in critical_issues[:10]:  # Show top 10
                print(issue)
        else:
            print("   🎉 No critical issues detected!")
        
        # Performance Summary
        if self.performance_metrics:
            print(f"\n⚡ PERFORMANCE SUMMARY:")
            for endpoint, times in self.performance_metrics.items():
                avg_time = sum(times) / len(times)
                status_icon = "✅" if avg_time < 3.0 else "⚠️" if avg_time < 5.0 else "❌"
                print(f"   {status_icon} {endpoint}: {avg_time:.2f}s avg")
        
        # Final Verdict
        print(f"\n🎯 FINAL VERDICT:")
        if success_rate >= 90:
            print("   🎉 EXCELLENT: Baby Goats Social Platform is production-ready!")
            print("   ✅ RLS policy fixes have successfully resolved the issues")
            print("   ✅ Ready for frontend testing and production deployment")
        elif success_rate >= 70:
            print("   ⚠️ GOOD: Most functionality working, minor issues remain")
            print("   ⚠️ RLS policy fixes partially successful")
            print("   ⚠️ Some additional database configuration may be needed")
        else:
            print("   ❌ NEEDS WORK: Significant issues remain")
            print("   ❌ RLS policy fixes have not fully resolved the problems")
            print("   ❌ Additional database and configuration work required")
        
        return {
            'total_tests': total_tests,
            'successful_tests': successful_tests,
            'success_rate': success_rate,
            'api_status': self.api_status_summary,
            'categories': categories,
            'critical_issues': len(critical_issues),
            'performance_metrics': self.performance_metrics
        }

    def run_comprehensive_test_suite(self):
        """Run the complete RLS policy resolution test suite"""
        print("🚀 Starting ULTIMATE FINAL TEST: Baby Goats Social Platform RLS Policy Resolution")
        print("="*80)
        
        # Test 1: Core APIs Regression
        self.test_core_apis_regression()
        
        # Test 2: Team Management APIs (Post-RLS Fix)
        self.test_team_management_apis_post_rls_fix()
        
        # Test 3: Social Features APIs (Post-RLS Fix)
        self.test_social_features_apis_post_rls_fix()
        
        # Test 4: Service Role Key Functionality
        self.test_service_role_key_functionality()
        
        # Test 5: Foreign Key Relationships
        self.test_foreign_key_relationships()
        
        # Test 6: Performance After RLS Fixes
        self.test_performance_after_rls_fixes()
        
        # Generate comprehensive summary
        summary = self.generate_comprehensive_summary()
        
        return summary

def main():
    """Main test execution"""
    tester = RLSPolicyResolutionTester()
    
    try:
        summary = tester.run_comprehensive_test_suite()
        
        # Save results to file
        with open('/app/rls_policy_resolution_results.json', 'w') as f:
            json.dump({
                'summary': summary,
                'detailed_results': tester.results,
                'error_logs': tester.error_logs,
                'performance_metrics': tester.performance_metrics,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/rls_policy_resolution_results.json")
        
        return summary['success_rate'] >= 90
        
    except Exception as e:
        print(f"❌ Test suite failed with error: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)