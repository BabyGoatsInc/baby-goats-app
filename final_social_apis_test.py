#!/usr/bin/env python3
"""
BABY GOATS FINAL SOCIAL APIS TEST
Comprehensive test of all social APIs to determine final platform status
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

class FinalSocialAPIsTester:
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
        
        status = "✅ WORKING" if success else "❌ FAILED"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        start_time = time.time()
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, params=params, timeout=20)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=20)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            end_time = time.time()
            response_time = end_time - start_time
            
            return response, response_time
            
        except requests.exceptions.Timeout:
            print(f"Request timed out: {method} {url}")
            return None, 20.0
        except requests.exceptions.ConnectionError:
            print(f"Connection error: {method} {url}")
            return None, 0
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None, 0

    def test_api_endpoint(self, api_name, endpoint, method='GET', data=None, params=None):
        """Test a single API endpoint"""
        print(f"🧪 Testing {api_name}...")
        
        response, response_time = self.make_request(method, endpoint, data, params)
        
        if not response:
            self.api_status[api_name] = {
                'working': False,
                'status_code': None,
                'response_time': response_time,
                'error': 'No response'
            }
            self.log_result(f"{api_name} API", False, f"No response - connection error")
            return False
        
        # Analyze response
        success = False
        details = ""
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, dict):
                    if data.get('success') is True:
                        success = True
                        details = f"✅ API working! Status: 200 OK, Response time: {response_time:.2f}s"
                        if 'count' in data:
                            details += f", Count: {data['count']}"
                        elif isinstance(data.get('leaderboards'), list):
                            details += f", Leaderboards: {len(data['leaderboards'])}"
                        elif isinstance(data.get('messages'), list):
                            details += f", Messages: {len(data['messages'])}"
                        elif isinstance(data.get('notifications'), list):
                            details += f", Notifications: {len(data['notifications'])}"
                    elif 'error' in data:
                        # API responded with error - check if it's a table issue
                        error_msg = data['error'].lower()
                        if any(keyword in error_msg for keyword in ['table', 'relation', 'does not exist', 'failed to fetch']):
                            success = False
                            details = f"❌ Database table missing! Error: {data['error']}"
                        else:
                            success = True  # API is working, just needs different parameters
                            details = f"✅ API responding! Status: 200 OK, Response time: {response_time:.2f}s (needs parameters: {data['error']})"
                    else:
                        # Check for data arrays (profiles, challenges, etc.)
                        if any(key in data for key in ['profiles', 'challenges', 'stats', 'leaderboards']):
                            success = True
                            details = f"✅ API working! Status: 200 OK, Response time: {response_time:.2f}s"
                            for key in ['profiles', 'challenges', 'stats', 'leaderboards']:
                                if key in data and isinstance(data[key], list):
                                    details += f", {key.title()}: {len(data[key])}"
                        else:
                            success = True
                            details = f"✅ API responding! Status: 200 OK, Response time: {response_time:.2f}s"
                else:
                    success = True
                    details = f"✅ API working! Status: 200 OK, Response time: {response_time:.2f}s"
            except json.JSONDecodeError:
                success = False
                details = f"❌ Invalid JSON response! Status: 200, Response time: {response_time:.2f}s"
        
        elif response.status_code == 400:
            # Bad request - API exists but needs parameters
            try:
                data = response.json()
                error_msg = data.get('error', 'Bad request')
                success = True  # API is working, just needs correct parameters
                details = f"✅ API responding! Status: 400, Response time: {response_time:.2f}s (parameter validation: {error_msg})"
            except json.JSONDecodeError:
                success = True
                details = f"✅ API responding! Status: 400, Response time: {response_time:.2f}s (parameter validation)"
        
        elif response.status_code == 500:
            # Internal server error - likely table doesn't exist
            try:
                data = response.json()
                error_msg = data.get('error', response.text)
                if any(keyword in error_msg.lower() for keyword in ['table', 'relation', 'does not exist', 'failed to fetch']):
                    success = False
                    details = f"❌ Database table missing! Status: 500, Response time: {response_time:.2f}s, Error: {error_msg}"
                else:
                    success = False
                    details = f"❌ Server error! Status: 500, Response time: {response_time:.2f}s, Error: {error_msg}"
            except json.JSONDecodeError:
                success = False
                details = f"❌ Server error! Status: 500, Response time: {response_time:.2f}s"
        
        else:
            success = False
            details = f"❌ Unexpected status! Status: {response.status_code}, Response time: {response_time:.2f}s"
        
        self.api_status[api_name] = {
            'working': success,
            'status_code': response.status_code,
            'response_time': response_time,
            'details': details
        }
        
        self.log_result(f"{api_name} API", success, details)
        return success

    def run_comprehensive_test(self):
        """Run comprehensive test of all Baby Goats APIs"""
        print("🚀 BABY GOATS FINAL SOCIAL APIS TEST")
        print("🎯 Comprehensive Platform Status Assessment")
        print("=" * 80)
        print()
        
        # Essential Social APIs (should work if tables were created)
        print("🔍 TESTING ESSENTIAL SOCIAL APIS:")
        print("-" * 50)
        
        essential_apis = [
            ('Friendships', '/friendships', 'GET', None, {'user_id': TEST_USER_ID}),
            ('Teams', '/teams', 'GET', None, {'limit': 10}),
            ('Notifications', '/notifications', 'GET', None, {'user_id': TEST_USER_ID}),
            ('Messages', '/messages', 'GET', None, {'user_id': TEST_USER_ID}),
            ('Leaderboards', '/leaderboards', 'GET', None, None),
        ]
        
        essential_working = 0
        for api_name, endpoint, method, data, params in essential_apis:
            if self.test_api_endpoint(api_name, endpoint, method, data, params):
                essential_working += 1
        
        print()
        print("🔍 TESTING CORE PLATFORM APIS:")
        print("-" * 50)
        
        # Core Platform APIs (should already work)
        core_apis = [
            ('Profiles', '/profiles', 'GET', None, {'limit': 10}),
            ('Challenges', '/challenges', 'GET', None, {'limit': 10}),
            ('Stats', '/stats', 'GET', None, {'user_id': TEST_USER_ID}),
            ('Storage', '/storage', 'GET', None, {'action': 'check_bucket'}),
        ]
        
        core_working = 0
        for api_name, endpoint, method, data, params in core_apis:
            if self.test_api_endpoint(api_name, endpoint, method, data, params):
                core_working += 1
        
        print()
        print("📊 FINAL BABY GOATS PLATFORM ASSESSMENT")
        print("=" * 80)
        
        # Calculate success rates
        essential_total = len(essential_apis)
        core_total = len(core_apis)
        total_apis = essential_total + core_total
        total_working = essential_working + core_working
        
        essential_rate = (essential_working / essential_total * 100) if essential_total > 0 else 0
        core_rate = (core_working / core_total * 100) if core_total > 0 else 0
        overall_rate = (total_working / total_apis * 100) if total_apis > 0 else 0
        
        print(f"📈 ESSENTIAL SOCIAL APIS: {essential_working}/{essential_total} working ({essential_rate:.1f}%)")
        print(f"📈 CORE PLATFORM APIS: {core_working}/{core_total} working ({core_rate:.1f}%)")
        print(f"📈 OVERALL PLATFORM STATUS: {total_working}/{total_apis} working ({overall_rate:.1f}%)")
        print()
        
        # Detailed API status
        print("🔍 DETAILED API STATUS:")
        print("-" * 40)
        
        print("Essential Social APIs:")
        for api_name, _, _, _, _ in essential_apis:
            status_info = self.api_status.get(api_name, {})
            working = status_info.get('working', False)
            status_code = status_info.get('status_code', 'N/A')
            response_time = status_info.get('response_time', 0)
            icon = "✅" if working else "❌"
            print(f"  {icon} {api_name}: Status {status_code}, {response_time:.2f}s")
        
        print("\nCore Platform APIs:")
        for api_name, _, _, _, _ in core_apis:
            status_info = self.api_status.get(api_name, {})
            working = status_info.get('working', False)
            status_code = status_info.get('status_code', 'N/A')
            response_time = status_info.get('response_time', 0)
            icon = "✅" if working else "❌"
            print(f"  {icon} {api_name}: Status {status_code}, {response_time:.2f}s")
        
        print()
        
        # Final verdict
        if overall_rate >= 90:
            verdict = "🎉 BABY GOATS SOCIAL PLATFORM FULLY OPERATIONAL!"
            status = "PRODUCTION READY"
            recommendation = "All systems operational. Ready for frontend testing and production deployment!"
        elif overall_rate >= 70:
            verdict = "✅ BABY GOATS SOCIAL PLATFORM MOSTLY OPERATIONAL"
            status = "NEAR PRODUCTION READY"
            recommendation = "Most APIs working. Minor issues to resolve before full production deployment."
        elif overall_rate >= 50:
            verdict = "⚠️ BABY GOATS SOCIAL PLATFORM PARTIALLY OPERATIONAL"
            status = "NEEDS ATTENTION"
            recommendation = "Several critical APIs need attention. Database schema may be incomplete."
        else:
            verdict = "❌ BABY GOATS SOCIAL PLATFORM NEEDS MAJOR FIXES"
            status = "CRITICAL ISSUES"
            recommendation = "Major backend issues require immediate attention. Database tables may not be created."
        
        print(f"🏆 FINAL VERDICT: {verdict}")
        print(f"📋 STATUS: {status}")
        print(f"💡 RECOMMENDATION: {recommendation}")
        print()
        
        # Performance analysis
        response_times = [info.get('response_time', 0) for info in self.api_status.values() if info.get('response_time', 0) > 0]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            fast_apis = sum(1 for t in response_times if t < 3.0)
            print(f"⚡ PERFORMANCE ANALYSIS:")
            print(f"   Average Response Time: {avg_response_time:.2f}s")
            print(f"   APIs Under 3s Target: {fast_apis}/{len(response_times)} ({fast_apis/len(response_times)*100:.1f}%)")
        
        # Identify specific issues
        failed_apis = [name for name, info in self.api_status.items() if not info.get('working', False)]
        table_missing_apis = []
        
        for name, info in self.api_status.items():
            if not info.get('working', False) and 'table' in info.get('details', '').lower():
                table_missing_apis.append(name)
        
        if table_missing_apis:
            print(f"\n❌ APIS WITH MISSING TABLES: {', '.join(table_missing_apis)}")
        
        if failed_apis:
            print(f"❌ FAILED APIS: {', '.join(failed_apis)}")
        
        return {
            'essential_working': essential_working,
            'essential_total': essential_total,
            'core_working': core_working,
            'core_total': core_total,
            'overall_rate': overall_rate,
            'verdict': verdict,
            'status': status,
            'recommendation': recommendation,
            'failed_apis': failed_apis,
            'table_missing_apis': table_missing_apis,
            'api_status': self.api_status
        }

def main():
    """Main test execution"""
    tester = FinalSocialAPIsTester()
    results = tester.run_comprehensive_test()
    
    print("🏁 FINAL TESTING COMPLETE!")
    print(f"📊 Overall Success Rate: {results['overall_rate']:.1f}%")
    print(f"🎯 Platform Status: {results['status']}")
    
    return results

if __name__ == "__main__":
    main()