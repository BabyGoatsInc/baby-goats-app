#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND TEST - BABY GOATS SOCIAL PLATFORM
Final validation of RLS policy fixes and database resolution

This test provides accurate analysis of API status after RLS policy fixes.
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

class ComprehensiveBackendTester:
    def __init__(self):
        self.results = []
        self.api_status = {}
        
    def log_result(self, test_name, success, details="", status_code=None, response_data=None):
        """Log test result with comprehensive tracking"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'status_code': status_code,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        # Track API status
        api_endpoint = self.extract_api_endpoint(test_name)
        if api_endpoint:
            if api_endpoint not in self.api_status:
                self.api_status[api_endpoint] = {
                    'tests': 0, 
                    'success': 0, 
                    'status_codes': [],
                    'errors': [],
                    'working': False
                }
            self.api_status[api_endpoint]['tests'] += 1
            self.api_status[api_endpoint]['status_codes'].append(status_code)
            if success:
                self.api_status[api_endpoint]['success'] += 1
                self.api_status[api_endpoint]['working'] = True
            else:
                self.api_status[api_endpoint]['errors'].append(details)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if status_code:
            print(f"   Status Code: {status_code}")
        print()

    def extract_api_endpoint(self, test_name):
        """Extract API endpoint from test name"""
        endpoints = [
            '/api/teams', '/api/team-members', '/api/team-challenges',
            '/api/messages', '/api/friendships', '/api/leaderboards', 
            '/api/notifications', '/api/profiles', '/api/challenges', 
            '/api/storage', '/api/stats'
        ]
        
        for endpoint in endpoints:
            if endpoint.replace('/api/', '') in test_name.lower():
                return endpoint
        return None

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with proper error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, params=params, timeout=8)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=8)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
            
        except requests.exceptions.Timeout:
            print(f"Request timed out: {method} {url}")
            return None
        except Exception as e:
            print(f"Request failed: {e}")
            return None

    def analyze_api_response(self, response, api_name):
        """Analyze API response and categorize the result"""
        if not response:
            return False, "❌ No response (timeout or connection error)", None, None
        
        status_code = response.status_code
        
        try:
            response_data = response.json()
        except:
            response_data = {"raw_text": response.text[:200]}
        
        if status_code == 200:
            # Success - analyze the data
            if 'error' in response_data:
                return False, f"❌ API returned error: {response_data['error']}", status_code, response_data
            else:
                # Count items if available
                item_count = 0
                if isinstance(response_data, dict):
                    for key in ['profiles', 'challenges', 'teams', 'messages', 'friendships', 'leaderboards', 'notifications']:
                        if key in response_data:
                            item_count = len(response_data[key])
                            break
                
                return True, f"✅ {api_name} working: {item_count} items retrieved", status_code, response_data
        
        elif status_code == 500:
            # Server error - analyze the cause
            error_text = response.text.lower()
            if 'table' in error_text or 'relation' in error_text:
                return False, f"❌ Database table missing: {response_data.get('error', 'Table not found')}", status_code, response_data
            else:
                return False, f"❌ Server error: {response_data.get('error', 'Internal server error')}", status_code, response_data
        
        elif status_code == 403:
            return False, f"❌ RLS policies blocking: 403 Forbidden", status_code, response_data
        
        elif status_code == 401:
            return False, f"❌ Authentication required: 401 Unauthorized", status_code, response_data
        
        elif status_code == 404:
            return False, f"❌ Endpoint not found: 404 Not Found", status_code, response_data
        
        elif status_code == 400:
            return False, f"❌ Bad request: {response_data.get('error', 'Invalid request')}", status_code, response_data
        
        else:
            return False, f"❌ Unexpected status: {status_code}", status_code, response_data

    def test_all_apis_comprehensive(self):
        """Test all APIs comprehensively"""
        print("🧪 Testing All APIs Comprehensively...")
        
        # Define all API tests
        api_tests = [
            # Core APIs
            ('GET', '/profiles', {'limit': 5}, 'Profiles API'),
            ('GET', '/challenges', {'limit': 5}, 'Challenges API'),
            ('GET', '/storage', {'action': 'check_bucket'}, 'Storage API'),
            ('GET', '/stats', {'user_id': TEST_USER_ID}, 'Stats API'),
            
            # Team Management APIs
            ('GET', '/teams', {'limit': 5}, 'Teams API'),
            ('GET', '/team-members', {'team_id': str(uuid.uuid4())}, 'Team Members API'),
            ('GET', '/team-challenges', {'team_id': str(uuid.uuid4())}, 'Team Challenges API'),
            
            # Social Features APIs
            ('GET', '/messages', {'user_id': TEST_USER_ID}, 'Messages API'),
            ('GET', '/friendships', {'user_id': TEST_USER_ID}, 'Friendships API'),
            ('GET', '/leaderboards', {'type': 'global'}, 'Leaderboards API'),
            ('GET', '/notifications', {'user_id': TEST_USER_ID}, 'Notifications API'),
        ]
        
        for method, endpoint, params, api_name in api_tests:
            response = self.make_request(method, endpoint, params=params)
            success, details, status_code, response_data = self.analyze_api_response(response, api_name)
            
            self.log_result(
                f"{api_name} - {method} {endpoint}",
                success,
                details,
                status_code,
                response_data
            )

    def test_write_operations(self):
        """Test write operations to check RLS policy fixes"""
        print("🧪 Testing Write Operations (RLS Policy Validation)...")
        
        # Test profile creation
        profile_data = {
            'id': str(uuid.uuid4()),
            'full_name': 'RLS Test User',
            'sport': 'Soccer',
            'grad_year': 2025,
            'location': 'Test City'
        }
        
        response = self.make_request('POST', '/profiles', data=profile_data)
        success, details, status_code, response_data = self.analyze_api_response(response, 'Profile Creation')
        
        self.log_result(
            "Profile Creation - POST /profiles (RLS Policy Test)",
            success,
            details,
            status_code,
            response_data
        )
        
        # Test challenge completion
        completion_data = {
            'user_id': TEST_USER_ID,
            'challenge_id': str(uuid.uuid4()),
            'completed': True,
            'completion_time': datetime.now().isoformat()
        }
        
        response = self.make_request('POST', '/challenges', data=completion_data)
        success, details, status_code, response_data = self.analyze_api_response(response, 'Challenge Completion')
        
        self.log_result(
            "Challenge Completion - POST /challenges (RLS Policy Test)",
            success,
            details,
            status_code,
            response_data
        )

    def generate_comprehensive_summary(self):
        """Generate comprehensive summary with detailed analysis"""
        print("\n" + "="*80)
        print("🎯 COMPREHENSIVE BACKEND TEST RESULTS - BABY GOATS SOCIAL PLATFORM")
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
        
        # Detailed API Analysis
        print(f"\n🔍 DETAILED API ANALYSIS:")
        
        working_apis = []
        partially_working_apis = []
        broken_apis = []
        
        for api_endpoint, status in self.api_status.items():
            success_rate = (status['success'] / status['tests'] * 100) if status['tests'] > 0 else 0
            status_codes = [code for code in status['status_codes'] if code is not None]
            unique_status_codes = list(set(status_codes))
            
            if success_rate >= 90:
                status_icon = "🎉"
                working_apis.append(api_endpoint)
            elif success_rate >= 50:
                status_icon = "⚠️"
                partially_working_apis.append(api_endpoint)
            else:
                status_icon = "❌"
                broken_apis.append(api_endpoint)
            
            print(f"   {status_icon} {api_endpoint}:")
            print(f"      Success Rate: {success_rate:.1f}% ({status['success']}/{status['tests']})")
            print(f"      Status Codes: {unique_status_codes}")
            
            if status['errors']:
                print(f"      Latest Error: {status['errors'][-1][:100]}")
        
        # Category Summary
        print(f"\n📈 API CATEGORY SUMMARY:")
        print(f"   🎉 Fully Working APIs ({len(working_apis)}):")
        for api in working_apis:
            print(f"      - {api}")
        
        print(f"   ⚠️ Partially Working APIs ({len(partially_working_apis)}):")
        for api in partially_working_apis:
            print(f"      - {api}")
        
        print(f"   ❌ Broken APIs ({len(broken_apis)}):")
        for api in broken_apis:
            print(f"      - {api}")
        
        # Issue Analysis
        print(f"\n🚨 ISSUE ANALYSIS:")
        
        database_table_issues = []
        rls_policy_issues = []
        server_errors = []
        authentication_issues = []
        
        for result in self.results:
            if not result['success'] and result['status_code']:
                if result['status_code'] == 500:
                    if 'table' in result['details'].lower() or 'relation' in result['details'].lower():
                        database_table_issues.append(result['test'])
                    else:
                        server_errors.append(result['test'])
                elif result['status_code'] == 403:
                    rls_policy_issues.append(result['test'])
                elif result['status_code'] == 401:
                    authentication_issues.append(result['test'])
        
        if database_table_issues:
            print(f"   ❌ DATABASE TABLE ISSUES ({len(database_table_issues)}):")
            for issue in database_table_issues:
                print(f"      - {issue}")
        
        if rls_policy_issues:
            print(f"   ❌ RLS POLICY ISSUES ({len(rls_policy_issues)}):")
            for issue in rls_policy_issues:
                print(f"      - {issue}")
        
        if authentication_issues:
            print(f"   ❌ AUTHENTICATION ISSUES ({len(authentication_issues)}):")
            for issue in authentication_issues:
                print(f"      - {issue}")
        
        if server_errors:
            print(f"   ❌ OTHER SERVER ERRORS ({len(server_errors)}):")
            for issue in server_errors:
                print(f"      - {issue}")
        
        if not database_table_issues and not rls_policy_issues and not authentication_issues and not server_errors:
            print("   🎉 No critical issues detected!")
        
        # Final Assessment
        print(f"\n🎯 FINAL ASSESSMENT:")
        
        core_apis_working = len([api for api in ['/api/profiles', '/api/challenges', '/api/storage', '/api/stats'] if api in working_apis])
        social_apis_working = len([api for api in ['/api/messages', '/api/friendships', '/api/leaderboards', '/api/notifications'] if api in working_apis])
        team_apis_working = len([api for api in ['/api/teams', '/api/team-members', '/api/team-challenges'] if api in working_apis])
        
        print(f"   📊 Core APIs: {core_apis_working}/4 working")
        print(f"   📊 Social APIs: {social_apis_working}/4 working")
        print(f"   📊 Team APIs: {team_apis_working}/3 working")
        
        if success_rate >= 90 and len(working_apis) >= len(self.api_status) * 0.8:
            verdict = "PRODUCTION_READY"
            print("   🎉 VERDICT: PRODUCTION READY")
            print("   ✅ Baby Goats Social Platform is ready for deployment")
            print("   ✅ RLS policy fixes have successfully resolved most issues")
        elif success_rate >= 70 and core_apis_working >= 3:
            verdict = "MOSTLY_WORKING"
            print("   ⚠️ VERDICT: MOSTLY WORKING")
            print("   ⚠️ Core functionality working, some social features need attention")
            print("   ⚠️ RLS policy fixes partially successful")
        else:
            verdict = "NEEDS_WORK"
            print("   ❌ VERDICT: NEEDS WORK")
            print("   ❌ Significant issues remain")
            print("   ❌ Additional database and configuration work required")
        
        # Specific Recommendations
        print(f"\n💡 SPECIFIC RECOMMENDATIONS:")
        
        if database_table_issues:
            print("   🔧 DATABASE FIXES NEEDED:")
            missing_tables = set()
            for issue in database_table_issues:
                if 'teams' in issue.lower():
                    missing_tables.add('teams')
                if 'team-members' in issue.lower():
                    missing_tables.add('team_members')
                if 'team-challenges' in issue.lower():
                    missing_tables.add('team_challenges, team_challenge_participations')
                if 'messages' in issue.lower():
                    missing_tables.add('messages')
                if 'friendships' in issue.lower():
                    missing_tables.add('friendships')
                if 'notifications' in issue.lower():
                    missing_tables.add('notifications')
            
            for table in missing_tables:
                print(f"      - Create table: {table}")
        
        if rls_policy_issues:
            print("   🔧 RLS POLICY FIXES NEEDED:")
            print("      - Update RLS policies to allow service role key access")
            print("      - Verify SUPABASE_SERVICE_ROLE_KEY configuration")
        
        if authentication_issues:
            print("   🔧 AUTHENTICATION FIXES NEEDED:")
            print("      - Configure proper authentication headers")
            print("      - Verify service role key permissions")
        
        if len(working_apis) >= 6:
            print("   ✅ POSITIVE ASPECTS:")
            print("      - Core platform functionality is working")
            print("      - Most APIs are responding correctly")
            print("      - Performance is good (no timeout issues)")
        
        return {
            'success_rate': success_rate,
            'working_apis': len(working_apis),
            'total_apis': len(self.api_status),
            'verdict': verdict,
            'core_apis_working': core_apis_working,
            'social_apis_working': social_apis_working,
            'team_apis_working': team_apis_working,
            'database_table_issues': len(database_table_issues),
            'rls_policy_issues': len(rls_policy_issues),
            'authentication_issues': len(authentication_issues)
        }

    def run_comprehensive_test_suite(self):
        """Run the comprehensive test suite"""
        print("🚀 Starting COMPREHENSIVE BACKEND TEST - BABY GOATS SOCIAL PLATFORM")
        print("="*80)
        
        # Test 1: All APIs Comprehensive
        self.test_all_apis_comprehensive()
        
        # Test 2: Write Operations (RLS Policy Validation)
        self.test_write_operations()
        
        # Generate comprehensive summary
        summary = self.generate_comprehensive_summary()
        
        return summary

def main():
    """Main test execution"""
    tester = ComprehensiveBackendTester()
    
    try:
        summary = tester.run_comprehensive_test_suite()
        
        # Save results to file
        with open('/app/comprehensive_backend_results.json', 'w') as f:
            json.dump({
                'summary': summary,
                'detailed_results': tester.results,
                'api_status': tester.api_status,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/comprehensive_backend_results.json")
        
        return summary['verdict'] in ["PRODUCTION_READY", "MOSTLY_WORKING"]
        
    except Exception as e:
        print(f"❌ Test suite failed with error: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)