#!/usr/bin/env python3
"""
COMPREHENSIVE FINAL VERIFICATION: BABY GOATS SOCIAL PLATFORM

Testing all APIs to determine current status after database table creation.
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
TEST_TEAM_ID = str(uuid.uuid4())

class ComprehensiveTester:
    def __init__(self):
        self.results = []
        self.test_data = {}
        
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
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, headers=HEADERS, json=data, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=HEADERS, params=params, timeout=10)
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

    def test_team_system_apis(self):
        """Test Team System APIs - Priority 1"""
        print("🎯 TESTING TEAM SYSTEM APIs...")
        
        # Test 1: GET /api/teams
        response = self.make_request('GET', '/teams', params={'limit': 10})
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'teams' in data:
                        teams = data['teams']
                        self.log_result(
                            "Team Management - GET /api/teams",
                            True,
                            f"✅ SUCCESS! Teams API working, returned {len(teams)} teams"
                        )
                    else:
                        self.log_result(
                            "Team Management - GET /api/teams",
                            True,
                            f"✅ API RESPONDING! Response: {data}"
                        )
                except:
                    self.log_result(
                        "Team Management - GET /api/teams",
                        False,
                        f"❌ Invalid JSON response: {response.text[:200]}"
                    )
            elif response.status_code == 500:
                self.log_result(
                    "Team Management - GET /api/teams",
                    False,
                    f"❌ 500 ERROR - Database table issue: {response.text[:200]}"
                )
            else:
                try:
                    data = response.json()
                    if 'error' in data and 'fetch teams' in data['error']:
                        self.log_result(
                            "Team Management - GET /api/teams",
                            False,
                            f"❌ BACKEND ERROR: {data['error']} - Database tables may not exist"
                        )
                    else:
                        self.log_result(
                            "Team Management - GET /api/teams",
                            False,
                            f"❌ Unexpected response: {response.status_code} - {data}"
                        )
                except:
                    self.log_result(
                        "Team Management - GET /api/teams",
                        False,
                        f"❌ Status {response.status_code}: {response.text[:200]}"
                    )
        else:
            self.log_result(
                "Team Management - GET /api/teams",
                False,
                "❌ No response from server"
            )

        # Test 2: POST /api/teams
        team_data = {
            'name': 'Final Test Team',
            'sport': 'Soccer',
            'captain_id': TEST_USER_ID,
            'max_members': 15,
            'privacy_level': 'public'
        }
        
        response = self.make_request('POST', '/teams', data=team_data)
        
        if response:
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    self.log_result(
                        "Team Management - POST /api/teams",
                        True,
                        f"✅ SUCCESS! Team creation working: {data.get('name', 'Team created')}"
                    )
                except:
                    self.log_result(
                        "Team Management - POST /api/teams",
                        True,
                        "✅ SUCCESS! Team creation working"
                    )
            elif response.status_code == 500:
                self.log_result(
                    "Team Management - POST /api/teams",
                    False,
                    f"❌ 500 ERROR - Database table issue: {response.text[:200]}"
                )
            else:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result(
                            "Team Management - POST /api/teams",
                            False,
                            f"❌ BACKEND ERROR: {data['error']}"
                        )
                    else:
                        self.log_result(
                            "Team Management - POST /api/teams",
                            False,
                            f"❌ Status {response.status_code}: {data}"
                        )
                except:
                    self.log_result(
                        "Team Management - POST /api/teams",
                        False,
                        f"❌ Status {response.status_code}: {response.text[:200]}"
                    )
        else:
            self.log_result(
                "Team Management - POST /api/teams",
                False,
                "❌ No response from server"
            )

        # Test 3: GET /api/team-members
        response = self.make_request('GET', '/team-members', params={'team_id': TEST_TEAM_ID})
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'members' in data:
                        members = data['members']
                        self.log_result(
                            "Team Members - GET /api/team-members",
                            True,
                            f"✅ SUCCESS! Team members API working, returned {len(members)} members"
                        )
                    else:
                        self.log_result(
                            "Team Members - GET /api/team-members",
                            True,
                            f"✅ API RESPONDING! Response: {data}"
                        )
                except:
                    self.log_result(
                        "Team Members - GET /api/team-members",
                        False,
                        f"❌ Invalid JSON: {response.text[:200]}"
                    )
            else:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result(
                            "Team Members - GET /api/team-members",
                            False,
                            f"❌ BACKEND ERROR: {data['error']}"
                        )
                    else:
                        self.log_result(
                            "Team Members - GET /api/team-members",
                            False,
                            f"❌ Status {response.status_code}: {data}"
                        )
                except:
                    self.log_result(
                        "Team Members - GET /api/team-members",
                        False,
                        f"❌ Status {response.status_code}: {response.text[:200]}"
                    )
        else:
            self.log_result(
                "Team Members - GET /api/team-members",
                False,
                "❌ No response from server"
            )

        # Test 4: GET /api/team-challenges
        response = self.make_request('GET', '/team-challenges', params={'team_id': TEST_TEAM_ID})
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'challenges' in data:
                        challenges = data['challenges']
                        self.log_result(
                            "Team Challenges - GET /api/team-challenges",
                            True,
                            f"✅ SUCCESS! Team challenges API working, returned {len(challenges)} challenges"
                        )
                    else:
                        self.log_result(
                            "Team Challenges - GET /api/team-challenges",
                            True,
                            f"✅ API RESPONDING! Response: {data}"
                        )
                except:
                    self.log_result(
                        "Team Challenges - GET /api/team-challenges",
                        False,
                        f"❌ Invalid JSON: {response.text[:200]}"
                    )
            else:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result(
                            "Team Challenges - GET /api/team-challenges",
                            False,
                            f"❌ BACKEND ERROR: {data['error']}"
                        )
                    else:
                        self.log_result(
                            "Team Challenges - GET /api/team-challenges",
                            False,
                            f"❌ Status {response.status_code}: {data}"
                        )
                except:
                    self.log_result(
                        "Team Challenges - GET /api/team-challenges",
                        False,
                        f"❌ Status {response.status_code}: {response.text[:200]}"
                    )
        else:
            self.log_result(
                "Team Challenges - GET /api/team-challenges",
                False,
                "❌ No response from server"
            )

    def test_social_features_apis(self):
        """Test Social Features APIs - Priority 2"""
        print("🎯 TESTING SOCIAL FEATURES APIs...")
        
        # Test 1: GET /api/messages
        response = self.make_request('GET', '/messages', params={'user_id': TEST_USER_ID, 'limit': 10})
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'messages' in data or 'conversations' in data:
                        self.log_result(
                            "Live Chat - GET /api/messages",
                            True,
                            f"✅ IMPROVED! Messages API working: {data}"
                        )
                    else:
                        self.log_result(
                            "Live Chat - GET /api/messages",
                            True,
                            f"✅ API RESPONDING! Response: {data}"
                        )
                except:
                    self.log_result(
                        "Live Chat - GET /api/messages",
                        False,
                        f"❌ Invalid JSON: {response.text[:200]}"
                    )
            else:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result(
                            "Live Chat - GET /api/messages",
                            False,
                            f"❌ BACKEND ERROR: {data['error']}"
                        )
                    else:
                        self.log_result(
                            "Live Chat - GET /api/messages",
                            False,
                            f"❌ Status {response.status_code}: {data}"
                        )
                except:
                    self.log_result(
                        "Live Chat - GET /api/messages",
                        False,
                        f"❌ Status {response.status_code}: {response.text[:200]}"
                    )
        else:
            self.log_result(
                "Live Chat - GET /api/messages",
                False,
                "❌ No response from server"
            )

        # Test 2: GET /api/leaderboards
        response = self.make_request('GET', '/leaderboards', params={'type': 'global', 'limit': 10})
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'leaderboards' in data:
                        leaderboards = data['leaderboards']
                        self.log_result(
                            "Leaderboards - GET /api/leaderboards",
                            True,
                            f"✅ WORKING! Leaderboards API returned {len(leaderboards)} entries"
                        )
                    else:
                        self.log_result(
                            "Leaderboards - GET /api/leaderboards",
                            True,
                            f"✅ API RESPONDING! Response: {data}"
                        )
                except:
                    self.log_result(
                        "Leaderboards - GET /api/leaderboards",
                        False,
                        f"❌ Invalid JSON: {response.text[:200]}"
                    )
            else:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result(
                            "Leaderboards - GET /api/leaderboards",
                            False,
                            f"❌ BACKEND ERROR: {data['error']}"
                        )
                    else:
                        self.log_result(
                            "Leaderboards - GET /api/leaderboards",
                            False,
                            f"❌ Status {response.status_code}: {data}"
                        )
                except:
                    self.log_result(
                        "Leaderboards - GET /api/leaderboards",
                        False,
                        f"❌ Status {response.status_code}: {response.text[:200]}"
                    )
        else:
            self.log_result(
                "Leaderboards - GET /api/leaderboards",
                False,
                "❌ No response from server"
            )

        # Test 3: GET /api/friendships
        response = self.make_request('GET', '/friendships', params={'user_id': TEST_USER_ID})
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'friendships' in data:
                        friendships = data['friendships']
                        self.log_result(
                            "Friendships - GET /api/friendships",
                            True,
                            f"✅ IMPROVED! Friendships API working, returned {len(friendships)} friendships"
                        )
                    else:
                        self.log_result(
                            "Friendships - GET /api/friendships",
                            True,
                            f"✅ API RESPONDING! Response: {data}"
                        )
                except:
                    self.log_result(
                        "Friendships - GET /api/friendships",
                        False,
                        f"❌ Invalid JSON: {response.text[:200]}"
                    )
            else:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result(
                            "Friendships - GET /api/friendships",
                            False,
                            f"❌ BACKEND ERROR: {data['error']}"
                        )
                    else:
                        self.log_result(
                            "Friendships - GET /api/friendships",
                            False,
                            f"❌ Status {response.status_code}: {data}"
                        )
                except:
                    self.log_result(
                        "Friendships - GET /api/friendships",
                        False,
                        f"❌ Status {response.status_code}: {response.text[:200]}"
                    )
        else:
            self.log_result(
                "Friendships - GET /api/friendships",
                False,
                "❌ No response from server"
            )

        # Test 4: GET /api/notifications
        response = self.make_request('GET', '/notifications', params={'user_id': TEST_USER_ID, 'limit': 10})
        
        if response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'notifications' in data:
                        notifications = data['notifications']
                        self.log_result(
                            "Notifications - GET /api/notifications",
                            True,
                            f"✅ IMPROVED! Notifications API working, returned {len(notifications)} notifications"
                        )
                    else:
                        self.log_result(
                            "Notifications - GET /api/notifications",
                            True,
                            f"✅ API RESPONDING! Response: {data}"
                        )
                except:
                    self.log_result(
                        "Notifications - GET /api/notifications",
                        False,
                        f"❌ Invalid JSON: {response.text[:200]}"
                    )
            else:
                try:
                    data = response.json()
                    if 'error' in data:
                        self.log_result(
                            "Notifications - GET /api/notifications",
                            False,
                            f"❌ BACKEND ERROR: {data['error']}"
                        )
                    else:
                        self.log_result(
                            "Notifications - GET /api/notifications",
                            False,
                            f"❌ Status {response.status_code}: {data}"
                        )
                except:
                    self.log_result(
                        "Notifications - GET /api/notifications",
                        False,
                        f"❌ Status {response.status_code}: {response.text[:200]}"
                    )
        else:
            self.log_result(
                "Notifications - GET /api/notifications",
                False,
                "❌ No response from server"
            )

    def test_regression_apis(self):
        """Test Regression APIs - Priority 3"""
        print("🎯 TESTING REGRESSION APIs...")
        
        # Test 1: GET /api/profiles
        response = self.make_request('GET', '/profiles', params={'limit': 5})
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                profiles = data.get('profiles', [])
                self.log_result(
                    "Regression - GET /api/profiles",
                    True,
                    f"✅ STILL WORKING! Profiles API returned {len(profiles)} profiles"
                )
            except:
                self.log_result(
                    "Regression - GET /api/profiles",
                    False,
                    f"❌ Invalid JSON: {response.text[:200]}"
                )
        else:
            self.log_result(
                "Regression - GET /api/profiles",
                False,
                f"❌ REGRESSION! Profiles API failing: {response.status_code if response else 'No response'}"
            )

        # Test 2: GET /api/storage
        response = self.make_request('GET', '/storage', params={'action': 'check_bucket'})
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                bucket_exists = data.get('bucketExists', False)
                self.log_result(
                    "Regression - GET /api/storage",
                    True,
                    f"✅ STILL WORKING! Storage API working, bucket exists: {bucket_exists}"
                )
            except:
                self.log_result(
                    "Regression - GET /api/storage",
                    False,
                    f"❌ Invalid JSON: {response.text[:200]}"
                )
        else:
            self.log_result(
                "Regression - GET /api/storage",
                False,
                f"❌ REGRESSION! Storage API failing: {response.status_code if response else 'No response'}"
            )

        # Test 3: GET /api/challenges
        response = self.make_request('GET', '/challenges', params={'limit': 5})
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                challenges = data.get('challenges', [])
                self.log_result(
                    "Regression - GET /api/challenges",
                    True,
                    f"✅ STILL WORKING! Challenges API returned {len(challenges)} challenges"
                )
            except:
                self.log_result(
                    "Regression - GET /api/challenges",
                    False,
                    f"❌ Invalid JSON: {response.text[:200]}"
                )
        else:
            self.log_result(
                "Regression - GET /api/challenges",
                False,
                f"❌ REGRESSION! Challenges API failing: {response.status_code if response else 'No response'}"
            )

        # Test 4: GET /api/stats
        response = self.make_request('GET', '/stats', params={'user_id': TEST_USER_ID})
        
        if response and response.status_code == 200:
            self.log_result(
                "Regression - GET /api/stats",
                True,
                "✅ STILL WORKING! Stats API working"
            )
        else:
            self.log_result(
                "Regression - GET /api/stats",
                False,
                f"❌ REGRESSION! Stats API failing: {response.status_code if response else 'No response'}"
            )

    def generate_final_report(self):
        """Generate comprehensive final verification report"""
        print("\n" + "="*80)
        print("🎯 COMPREHENSIVE FINAL VERIFICATION REPORT")
        print("="*80)
        
        # Calculate success rates by category
        team_tests = [r for r in self.results if 'Team' in r['test']]
        social_tests = [r for r in self.results if any(x in r['test'] for x in ['Live Chat', 'Leaderboards', 'Friendships', 'Notifications'])]
        regression_tests = [r for r in self.results if 'Regression' in r['test']]
        
        team_success = sum(1 for r in team_tests if r['success']) / len(team_tests) * 100 if team_tests else 0
        social_success = sum(1 for r in social_tests if r['success']) / len(social_tests) * 100 if social_tests else 0
        regression_success = sum(1 for r in regression_tests if r['success']) / len(regression_tests) * 100 if regression_tests else 0
        
        total_success = sum(1 for r in self.results if r['success']) / len(self.results) * 100 if self.results else 0
        
        print(f"\n📊 SUCCESS RATES:")
        print(f"   🏆 TEAM SYSTEM APIs: {team_success:.1f}% ({sum(1 for r in team_tests if r['success'])}/{len(team_tests)})")
        print(f"   👥 SOCIAL FEATURES APIs: {social_success:.1f}% ({sum(1 for r in social_tests if r['success'])}/{len(social_tests)})")
        print(f"   🔄 REGRESSION TESTING: {regression_success:.1f}% ({sum(1 for r in regression_tests if r['success'])}/{len(regression_tests)})")
        print(f"   🎯 OVERALL SUCCESS RATE: {total_success:.1f}% ({sum(1 for r in self.results if r['success'])}/{len(self.results)})")
        
        # Critical findings
        print(f"\n🔍 CRITICAL FINDINGS:")
        
        if team_success >= 80:
            print("   ✅ TEAM SYSTEM: Database tables successfully created - APIs working!")
        elif team_success >= 50:
            print("   ⚠️ TEAM SYSTEM: Partial functionality - some database tables may be missing")
        else:
            print("   ❌ TEAM SYSTEM: Database tables not properly created - APIs failing")
        
        if social_success >= 60:
            print("   ✅ SOCIAL FEATURES: Significant improvements detected")
        elif social_success >= 25:
            print("   ⚠️ SOCIAL FEATURES: Some improvements - partial database setup")
        else:
            print("   ❌ SOCIAL FEATURES: Limited improvements - database setup incomplete")
        
        if regression_success >= 80:
            print("   ✅ REGRESSION: Existing functionality maintained")
        else:
            print("   ❌ REGRESSION: Some existing functionality broken")
        
        # Production readiness assessment
        print(f"\n🚀 PRODUCTION READINESS ASSESSMENT:")
        
        if total_success >= 80:
            print("   ✅ PRODUCTION READY: Baby Goats social platform is ready for deployment!")
        elif total_success >= 60:
            print("   ⚠️ MOSTLY READY: Platform mostly functional, minor issues to resolve")
        elif total_success >= 40:
            print("   ⚠️ PARTIAL READY: Some functionality working, database setup partially complete")
        else:
            print("   ❌ NOT READY: Significant issues remain, database setup incomplete")
        
        # Detailed results
        print(f"\n📋 DETAILED TEST RESULTS:")
        for result in self.results:
            status = "✅" if result['success'] else "❌"
            print(f"   {status} {result['test']}")
            if result['details']:
                print(f"      {result['details']}")
        
        print("\n" + "="*80)
        print("🎯 COMPREHENSIVE FINAL VERIFICATION COMPLETE")
        print("="*80)
        
        return {
            'total_success_rate': total_success,
            'team_success_rate': team_success,
            'social_success_rate': social_success,
            'regression_success_rate': regression_success,
            'production_ready': total_success >= 80
        }

def main():
    """Run comprehensive final verification testing"""
    print("🚀 STARTING COMPREHENSIVE FINAL VERIFICATION")
    print("="*80)
    
    tester = ComprehensiveTester()
    
    # Run all test suites
    tester.test_team_system_apis()
    tester.test_social_features_apis()
    tester.test_regression_apis()
    
    # Generate final report
    report = tester.generate_final_report()
    
    return report

if __name__ == "__main__":
    main()