#!/usr/bin/env python3
"""
FINAL RLS POLICY RESOLUTION TEST - BABY GOATS SOCIAL PLATFORM

**CRITICAL STATUS:** User has now:
1. ✅ Created all database tables 
2. ✅ Applied foreign key constraints
3. ✅ Fixed Next.js cookies API issues
4. ✅ Created missing team_statistics table
5. ✅ Updated RLS policies for service role access
6. ✅ Added missing RLS policies for team challenge tables

**TESTING OBJECTIVE:** Determine if the RLS policy fixes resolved the 500 errors and achieve 100% API functionality.

This test focuses on accurate API response analysis and proper error categorization.
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
TEST_TEAM_ID = str(uuid.uuid4())

class FinalRLSResolutionTester:
    def __init__(self):
        self.results = []
        self.api_status = {}
        
    def log_result(self, test_name, success, details="", status_code=None):
        """Log test result with proper categorization"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'status_code': status_code,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        # Track API status
        api_endpoint = self.extract_api_endpoint(test_name)
        if api_endpoint:
            if api_endpoint not in self.api_status:
                self.api_status[api_endpoint] = {'tests': 0, 'success': 0, 'status_codes': []}
            self.api_status[api_endpoint]['tests'] += 1
            self.api_status[api_endpoint]['status_codes'].append(status_code)
            if success:
                self.api_status[api_endpoint]['success'] += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if status_code:
            print(f"   Status Code: {status_code}")
        print()

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

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with proper error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
            
        except requests.exceptions.Timeout:
            print(f"Request timed out: {method} {url}")
            return None
        except Exception as e:
            print(f"Request failed: {e}")
            return None

    def test_core_apis_status(self):
        """Test Core APIs - Check if existing functionality still works"""
        print("🧪 Testing Core APIs Status After RLS Fixes...")
        
        # Test 1: Profiles API
        response = self.make_request('GET', '/profiles', params={'limit': 5})
        if response:
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                self.log_result(
                    "Core API Status - GET /api/profiles",
                    True,
                    f"✅ Profiles API working: {len(profiles)} profiles retrieved",
                    response.status_code
                )
            else:
                self.log_result(
                    "Core API Status - GET /api/profiles",
                    False,
                    f"❌ Profiles API failed: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Core API Status - GET /api/profiles",
                False,
                "❌ No response from Profiles API"
            )

        # Test 2: Challenges API
        response = self.make_request('GET', '/challenges', params={'limit': 5})
        if response:
            if response.status_code == 200:
                data = response.json()
                challenges = data.get('challenges', [])
                self.log_result(
                    "Core API Status - GET /api/challenges",
                    True,
                    f"✅ Challenges API working: {len(challenges)} challenges retrieved",
                    response.status_code
                )
            else:
                self.log_result(
                    "Core API Status - GET /api/challenges",
                    False,
                    f"❌ Challenges API failed: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Core API Status - GET /api/challenges",
                False,
                "❌ No response from Challenges API"
            )

        # Test 3: Storage API
        response = self.make_request('GET', '/storage', params={'action': 'check_bucket'})
        if response:
            if response.status_code == 200:
                data = response.json()
                bucket_exists = data.get('bucketExists', False)
                self.log_result(
                    "Core API Status - GET /api/storage",
                    True,
                    f"✅ Storage API working: bucket exists = {bucket_exists}",
                    response.status_code
                )
            else:
                self.log_result(
                    "Core API Status - GET /api/storage",
                    False,
                    f"❌ Storage API failed: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Core API Status - GET /api/storage",
                False,
                "❌ No response from Storage API"
            )

        # Test 4: Stats API
        response = self.make_request('GET', '/stats', params={'user_id': TEST_USER_ID})
        if response:
            if response.status_code == 200:
                self.log_result(
                    "Core API Status - GET /api/stats",
                    True,
                    f"✅ Stats API working: response received",
                    response.status_code
                )
            else:
                self.log_result(
                    "Core API Status - GET /api/stats",
                    False,
                    f"❌ Stats API failed: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Core API Status - GET /api/stats",
                False,
                "❌ No response from Stats API"
            )

    def test_team_management_apis_resolution(self):
        """Test Team Management APIs - Check if RLS fixes resolved database table issues"""
        print("🧪 Testing Team Management APIs Resolution...")
        
        # Test 1: Teams API
        response = self.make_request('GET', '/teams', params={'limit': 5})
        if response:
            if response.status_code == 200:
                data = response.json()
                teams = data.get('teams', [])
                self.log_result(
                    "Team Management Resolution - GET /api/teams",
                    True,
                    f"🎉 Teams API now working: {len(teams)} teams retrieved, database table accessible",
                    response.status_code
                )
            elif response.status_code == 500:
                error_text = response.text.lower()
                if 'table' in error_text or 'relation' in error_text:
                    self.log_result(
                        "Team Management Resolution - GET /api/teams",
                        False,
                        f"❌ Database table still missing: teams table not found",
                        response.status_code
                    )
                else:
                    self.log_result(
                        "Team Management Resolution - GET /api/teams",
                        False,
                        f"❌ Server error persists: {response.text[:200]}",
                        response.status_code
                    )
            else:
                self.log_result(
                    "Team Management Resolution - GET /api/teams",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Team Management Resolution - GET /api/teams",
                False,
                "❌ No response from Teams API"
            )

        # Test 2: Team Members API
        response = self.make_request('GET', '/team-members', params={'team_id': TEST_TEAM_ID})
        if response:
            if response.status_code == 200:
                data = response.json()
                members = data.get('members', [])
                self.log_result(
                    "Team Management Resolution - GET /api/team-members",
                    True,
                    f"🎉 Team Members API now working: {len(members)} members retrieved",
                    response.status_code
                )
            elif response.status_code == 500:
                error_text = response.text.lower()
                if 'table' in error_text or 'relation' in error_text:
                    self.log_result(
                        "Team Management Resolution - GET /api/team-members",
                        False,
                        f"❌ Database table still missing: team_members table not found",
                        response.status_code
                    )
                else:
                    self.log_result(
                        "Team Management Resolution - GET /api/team-members",
                        False,
                        f"❌ Server error persists: {response.text[:200]}",
                        response.status_code
                    )
            else:
                self.log_result(
                    "Team Management Resolution - GET /api/team-members",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Team Management Resolution - GET /api/team-members",
                False,
                "❌ No response from Team Members API"
            )

        # Test 3: Team Challenges API
        response = self.make_request('GET', '/team-challenges', params={'team_id': TEST_TEAM_ID})
        if response:
            if response.status_code == 200:
                data = response.json()
                challenges = data.get('challenges', [])
                self.log_result(
                    "Team Management Resolution - GET /api/team-challenges",
                    True,
                    f"🎉 Team Challenges API now working: {len(challenges)} challenges retrieved",
                    response.status_code
                )
            elif response.status_code == 500:
                error_text = response.text.lower()
                if 'table' in error_text or 'relation' in error_text:
                    self.log_result(
                        "Team Management Resolution - GET /api/team-challenges",
                        False,
                        f"❌ Database tables still missing: team_challenges tables not found",
                        response.status_code
                    )
                else:
                    self.log_result(
                        "Team Management Resolution - GET /api/team-challenges",
                        False,
                        f"❌ Server error persists: {response.text[:200]}",
                        response.status_code
                    )
            else:
                self.log_result(
                    "Team Management Resolution - GET /api/team-challenges",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Team Management Resolution - GET /api/team-challenges",
                False,
                "❌ No response from Team Challenges API"
            )

    def test_social_features_apis_resolution(self):
        """Test Social Features APIs - Check if RLS fixes resolved social table access"""
        print("🧪 Testing Social Features APIs Resolution...")
        
        # Test 1: Messages API
        response = self.make_request('GET', '/messages', params={'user_id': TEST_USER_ID})
        if response:
            if response.status_code == 200:
                data = response.json()
                messages = data.get('messages', [])
                self.log_result(
                    "Social Features Resolution - GET /api/messages",
                    True,
                    f"🎉 Messages API now working: {len(messages)} messages retrieved",
                    response.status_code
                )
            elif response.status_code == 500:
                error_text = response.text.lower()
                if 'table' in error_text or 'relation' in error_text:
                    self.log_result(
                        "Social Features Resolution - GET /api/messages",
                        False,
                        f"❌ Database table still missing: messages table not found",
                        response.status_code
                    )
                else:
                    self.log_result(
                        "Social Features Resolution - GET /api/messages",
                        False,
                        f"❌ Server error persists: {response.text[:200]}",
                        response.status_code
                    )
            else:
                self.log_result(
                    "Social Features Resolution - GET /api/messages",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Social Features Resolution - GET /api/messages",
                False,
                "❌ No response from Messages API"
            )

        # Test 2: Friendships API
        response = self.make_request('GET', '/friendships', params={'user_id': TEST_USER_ID})
        if response:
            if response.status_code == 200:
                data = response.json()
                friendships = data.get('friendships', [])
                self.log_result(
                    "Social Features Resolution - GET /api/friendships",
                    True,
                    f"🎉 Friendships API now working: {len(friendships)} friendships retrieved",
                    response.status_code
                )
            elif response.status_code == 500:
                error_text = response.text.lower()
                if 'table' in error_text or 'relation' in error_text:
                    self.log_result(
                        "Social Features Resolution - GET /api/friendships",
                        False,
                        f"❌ Database table still missing: friendships table not found",
                        response.status_code
                    )
                else:
                    self.log_result(
                        "Social Features Resolution - GET /api/friendships",
                        False,
                        f"❌ Server error persists: {response.text[:200]}",
                        response.status_code
                    )
            else:
                self.log_result(
                    "Social Features Resolution - GET /api/friendships",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Social Features Resolution - GET /api/friendships",
                False,
                "❌ No response from Friendships API"
            )

        # Test 3: Leaderboards API
        response = self.make_request('GET', '/leaderboards', params={'type': 'global'})
        if response:
            if response.status_code == 200:
                data = response.json()
                leaderboards = data.get('leaderboards', [])
                self.log_result(
                    "Social Features Resolution - GET /api/leaderboards",
                    True,
                    f"🎉 Leaderboards API now working: {len(leaderboards)} leaderboards retrieved",
                    response.status_code
                )
            elif response.status_code == 500:
                error_text = response.text.lower()
                if 'table' in error_text or 'relation' in error_text:
                    self.log_result(
                        "Social Features Resolution - GET /api/leaderboards",
                        False,
                        f"❌ Database table still missing: leaderboards table not found",
                        response.status_code
                    )
                else:
                    self.log_result(
                        "Social Features Resolution - GET /api/leaderboards",
                        False,
                        f"❌ Server error persists: {response.text[:200]}",
                        response.status_code
                    )
            else:
                self.log_result(
                    "Social Features Resolution - GET /api/leaderboards",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Social Features Resolution - GET /api/leaderboards",
                False,
                "❌ No response from Leaderboards API"
            )

        # Test 4: Notifications API
        response = self.make_request('GET', '/notifications', params={'user_id': TEST_USER_ID})
        if response:
            if response.status_code == 200:
                data = response.json()
                notifications = data.get('notifications', [])
                self.log_result(
                    "Social Features Resolution - GET /api/notifications",
                    True,
                    f"🎉 Notifications API now working: {len(notifications)} notifications retrieved",
                    response.status_code
                )
            elif response.status_code == 500:
                error_text = response.text.lower()
                if 'table' in error_text or 'relation' in error_text:
                    self.log_result(
                        "Social Features Resolution - GET /api/notifications",
                        False,
                        f"❌ Database table still missing: notifications table not found",
                        response.status_code
                    )
                else:
                    self.log_result(
                        "Social Features Resolution - GET /api/notifications",
                        False,
                        f"❌ Server error persists: {response.text[:200]}",
                        response.status_code
                    )
            else:
                self.log_result(
                    "Social Features Resolution - GET /api/notifications",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "Social Features Resolution - GET /api/notifications",
                False,
                "❌ No response from Notifications API"
            )

    def test_rls_policy_write_operations(self):
        """Test RLS Policy Write Operations - Check if service role key allows write operations"""
        print("🧪 Testing RLS Policy Write Operations...")
        
        # Test 1: Profile creation (should work with service role key)
        profile_data = {
            'id': str(uuid.uuid4()),
            'full_name': 'RLS Test User',
            'sport': 'Soccer',
            'grad_year': 2025,
            'location': 'Test City'
        }
        
        response = self.make_request('POST', '/profiles', data=profile_data)
        if response:
            if response.status_code in [200, 201]:
                self.log_result(
                    "RLS Policy Write Operations - POST /api/profiles",
                    True,
                    f"🎉 Profile creation working: RLS policies allow write operations",
                    response.status_code
                )
            elif response.status_code == 403:
                self.log_result(
                    "RLS Policy Write Operations - POST /api/profiles",
                    False,
                    f"❌ RLS policies still blocking: 403 Forbidden",
                    response.status_code
                )
            elif response.status_code == 500:
                self.log_result(
                    "RLS Policy Write Operations - POST /api/profiles",
                    False,
                    f"❌ Server error persists: {response.text[:200]}",
                    response.status_code
                )
            else:
                self.log_result(
                    "RLS Policy Write Operations - POST /api/profiles",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "RLS Policy Write Operations - POST /api/profiles",
                False,
                "❌ No response from Profiles API"
            )

        # Test 2: Challenge completion (should work with service role key)
        completion_data = {
            'user_id': TEST_USER_ID,
            'challenge_id': str(uuid.uuid4()),
            'completed': True,
            'completion_time': datetime.now().isoformat()
        }
        
        response = self.make_request('POST', '/challenges', data=completion_data)
        if response:
            if response.status_code in [200, 201]:
                self.log_result(
                    "RLS Policy Write Operations - POST /api/challenges",
                    True,
                    f"🎉 Challenge completion working: RLS policies allow write operations",
                    response.status_code
                )
            elif response.status_code == 403:
                self.log_result(
                    "RLS Policy Write Operations - POST /api/challenges",
                    False,
                    f"❌ RLS policies still blocking: 403 Forbidden",
                    response.status_code
                )
            elif response.status_code == 500:
                self.log_result(
                    "RLS Policy Write Operations - POST /api/challenges",
                    False,
                    f"❌ Server error persists: {response.text[:200]}",
                    response.status_code
                )
            else:
                self.log_result(
                    "RLS Policy Write Operations - POST /api/challenges",
                    False,
                    f"❌ Unexpected response: {response.text[:200]}",
                    response.status_code
                )
        else:
            self.log_result(
                "RLS Policy Write Operations - POST /api/challenges",
                False,
                "❌ No response from Challenges API"
            )

    def generate_final_summary(self):
        """Generate final comprehensive summary"""
        print("\n" + "="*80)
        print("🎯 FINAL RLS POLICY RESOLUTION TEST RESULTS")
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
        working_apis = 0
        total_apis = len(self.api_status)
        
        for api_endpoint, status in self.api_status.items():
            success_rate = (status['success'] / status['tests'] * 100) if status['tests'] > 0 else 0
            status_codes = list(set(status['status_codes']))
            
            if success_rate >= 90:
                status_icon = "🎉"
                working_apis += 1
            elif success_rate >= 50:
                status_icon = "⚠️"
            else:
                status_icon = "❌"
            
            print(f"   {status_icon} {api_endpoint}: {status['success']}/{status['tests']} ({success_rate:.1f}%) - Status codes: {status_codes}")
        
        # Critical Issues Analysis
        print(f"\n🚨 CRITICAL ISSUES ANALYSIS:")
        database_table_issues = []
        rls_policy_issues = []
        server_errors = []
        
        for result in self.results:
            if not result['success']:
                if result['status_code'] == 500:
                    if 'table' in result['details'].lower() or 'relation' in result['details'].lower():
                        database_table_issues.append(result['test'])
                    else:
                        server_errors.append(result['test'])
                elif result['status_code'] == 403:
                    rls_policy_issues.append(result['test'])
        
        if database_table_issues:
            print(f"   ❌ DATABASE TABLE ISSUES ({len(database_table_issues)}):")
            for issue in database_table_issues[:5]:
                print(f"      - {issue}")
        
        if rls_policy_issues:
            print(f"   ❌ RLS POLICY ISSUES ({len(rls_policy_issues)}):")
            for issue in rls_policy_issues[:5]:
                print(f"      - {issue}")
        
        if server_errors:
            print(f"   ❌ SERVER ERRORS ({len(server_errors)}):")
            for issue in server_errors[:5]:
                print(f"      - {issue}")
        
        if not database_table_issues and not rls_policy_issues and not server_errors:
            print("   🎉 No critical issues detected!")
        
        # Final Verdict
        print(f"\n🎯 FINAL VERDICT:")
        if success_rate >= 90 and working_apis >= total_apis * 0.9:
            print("   🎉 EXCELLENT: Baby Goats Social Platform is production-ready!")
            print("   ✅ RLS policy fixes have successfully resolved the issues")
            print("   ✅ Ready for frontend testing and production deployment")
            verdict = "PRODUCTION_READY"
        elif success_rate >= 70 and working_apis >= total_apis * 0.7:
            print("   ⚠️ GOOD: Most functionality working, minor issues remain")
            print("   ⚠️ RLS policy fixes partially successful")
            print("   ⚠️ Some additional database configuration may be needed")
            verdict = "MOSTLY_WORKING"
        else:
            print("   ❌ NEEDS WORK: Significant issues remain")
            print("   ❌ RLS policy fixes have not fully resolved the problems")
            print("   ❌ Additional database and configuration work required")
            verdict = "NEEDS_WORK"
        
        # Specific Recommendations
        print(f"\n💡 SPECIFIC RECOMMENDATIONS:")
        if database_table_issues:
            print("   🔧 Create missing database tables in Supabase:")
            missing_tables = set()
            for issue in database_table_issues:
                if 'teams' in issue.lower():
                    missing_tables.add('teams')
                if 'team-members' in issue.lower():
                    missing_tables.add('team_members')
                if 'team-challenges' in issue.lower():
                    missing_tables.add('team_challenges, team_challenge_participations, team_challenge_contributions')
                if 'messages' in issue.lower():
                    missing_tables.add('messages')
                if 'friendships' in issue.lower():
                    missing_tables.add('friendships')
                if 'notifications' in issue.lower():
                    missing_tables.add('notifications')
            
            for table in missing_tables:
                print(f"      - {table}")
        
        if rls_policy_issues:
            print("   🔧 Update RLS policies to allow service role key access")
            print("   🔧 Verify SUPABASE_SERVICE_ROLE_KEY is properly configured")
        
        if working_apis >= total_apis * 0.7:
            print("   ✅ Core functionality is working well")
            print("   ✅ Focus on resolving remaining database table issues")
        
        return {
            'success_rate': success_rate,
            'working_apis': working_apis,
            'total_apis': total_apis,
            'verdict': verdict,
            'database_table_issues': len(database_table_issues),
            'rls_policy_issues': len(rls_policy_issues),
            'server_errors': len(server_errors)
        }

    def run_final_test_suite(self):
        """Run the final RLS policy resolution test suite"""
        print("🚀 Starting FINAL RLS POLICY RESOLUTION TEST")
        print("="*80)
        
        # Test 1: Core APIs Status
        self.test_core_apis_status()
        
        # Test 2: Team Management APIs Resolution
        self.test_team_management_apis_resolution()
        
        # Test 3: Social Features APIs Resolution
        self.test_social_features_apis_resolution()
        
        # Test 4: RLS Policy Write Operations
        self.test_rls_policy_write_operations()
        
        # Generate final summary
        summary = self.generate_final_summary()
        
        return summary

def main():
    """Main test execution"""
    tester = FinalRLSResolutionTester()
    
    try:
        summary = tester.run_final_test_suite()
        
        # Save results to file
        with open('/app/final_rls_resolution_results.json', 'w') as f:
            json.dump({
                'summary': summary,
                'detailed_results': tester.results,
                'api_status': tester.api_status,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/final_rls_resolution_results.json")
        
        return summary['verdict'] == "PRODUCTION_READY"
        
    except Exception as e:
        print(f"❌ Test suite failed with error: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)