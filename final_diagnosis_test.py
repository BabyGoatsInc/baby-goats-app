#!/usr/bin/env python3
"""
BABY GOATS SOCIAL PLATFORM - FINAL COMPREHENSIVE DIAGNOSIS
Ultimate investigation to identify root cause of persistent 500 errors
Focus: Messages, Leaderboards, Teams, Friendships, Notifications APIs

**CRITICAL UPDATE:** User has now:
1. ✅ Created all social database tables (friendships, notifications, messages exist)
2. ✅ Created missing teams and team_members tables  
3. ✅ Applied Next.js 15 cookies API fixes to all 3 API files
4. ✅ Disabled RLS policies for testing
5. ✅ Confirmed tables exist in Supabase dashboard

**CURRENT STATUS:** 
- Messages API: 200 OK ✅ (Working)
- Leaderboards API: 200 OK ✅ (Working)  
- Teams API: 500 error ❌ (Still failing despite table creation)
- Friendships API: 500 error ❌ (Still failing despite table exists)
- Notifications API: 500 error ❌ (Still failing despite table exists)

**TESTING OBJECTIVE:** Final comprehensive diagnosis to identify the root cause of persistent 500 errors despite all database and code fixes being applied.
"""

import requests
import json
import uuid
from datetime import datetime
import time
import traceback

# Configuration - Final Diagnosis Testing
BASE_URL = "https://youthgoat-social.preview.emergentagent.com/api"

HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

class FinalDiagnosisTester:
    def __init__(self):
        self.results = []
        self.error_details = []
        
    def log_result(self, test_name, success, details="", response_data=None, status_code=None):
        """Log test result with detailed information"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat(),
            'status_code': status_code
        }
        if response_data:
            result['response'] = response_data
        self.results.append(result)
        
        status = "✅ WORKING" if success else "❌ FAILING"
        status_info = f" [HTTP {status_code}]" if status_code else ""
        print(f"{status}{status_info}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Error Response: {str(response_data)[:200]}")
        print()

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with detailed error capture"""
        url = f"{BASE_URL}{endpoint}"
        start_time = time.time()
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            end_time = time.time()
            response_time = end_time - start_time
            
            # Capture detailed error information
            if response.status_code >= 400:
                try:
                    error_data = response.json()
                except:
                    error_data = response.text
                    
                self.error_details.append({
                    'endpoint': endpoint,
                    'method': method,
                    'status_code': response.status_code,
                    'response_time': response_time,
                    'error_data': error_data,
                    'timestamp': datetime.now().isoformat()
                })
                
            return response, response_time
            
        except requests.exceptions.Timeout:
            end_time = time.time()
            response_time = end_time - start_time
            self.error_details.append({
                'endpoint': endpoint,
                'method': method,
                'error': 'TIMEOUT',
                'response_time': response_time,
                'timestamp': datetime.now().isoformat()
            })
            return None, response_time
        except Exception as e:
            self.error_details.append({
                'endpoint': endpoint,
                'method': method,
                'error': str(e),
                'traceback': traceback.format_exc(),
                'timestamp': datetime.now().isoformat()
            })
            return None, 0

    def test_working_apis(self):
        """Test APIs that should be working (Messages, Leaderboards)"""
        print("🔍 TESTING WORKING APIs (Messages, Leaderboards)")
        print("=" * 60)
        
        # Test Messages API
        response, response_time = self.make_request('GET', '/messages')
        if response:
            success = response.status_code == 200
            if success:
                try:
                    data = response.json()
                    self.log_result(
                        "Messages API - GET /messages",
                        True,
                        f"Working correctly - Response time: {response_time:.2f}s",
                        data,
                        response.status_code
                    )
                except:
                    self.log_result(
                        "Messages API - GET /messages",
                        True,
                        f"Working but non-JSON response - Response time: {response_time:.2f}s",
                        response.text,
                        response.status_code
                    )
            else:
                self.log_result(
                    "Messages API - GET /messages",
                    False,
                    f"HTTP {response.status_code} error - Response time: {response_time:.2f}s",
                    response.text,
                    response.status_code
                )
        else:
            self.log_result(
                "Messages API - GET /messages",
                False,
                "Connection failed or timeout"
            )
        
        # Test Leaderboards API  
        response, response_time = self.make_request('GET', '/leaderboards')
        if response:
            success = response.status_code == 200
            if success:
                try:
                    data = response.json()
                    self.log_result(
                        "Leaderboards API - GET /leaderboards",
                        True,
                        f"Working correctly - Response time: {response_time:.2f}s",
                        data,
                        response.status_code
                    )
                except:
                    self.log_result(
                        "Leaderboards API - GET /leaderboards",
                        True,
                        f"Working but non-JSON response - Response time: {response_time:.2f}s",
                        response.text,
                        response.status_code
                    )
            else:
                self.log_result(
                    "Leaderboards API - GET /leaderboards",
                    False,
                    f"HTTP {response.status_code} error - Response time: {response_time:.2f}s",
                    response.text,
                    response.status_code
                )
        else:
            self.log_result(
                "Leaderboards API - GET /leaderboards",
                False,
                "Connection failed or timeout"
            )
            
    def test_failing_apis(self):
        """Test APIs that are failing (Teams, Friendships, Notifications)"""
        print("\n🚨 TESTING FAILING APIs (Teams, Friendships, Notifications)")
        print("=" * 60)
        
        # Test Teams API with detailed error capture
        print("\n📋 TEAMS API DETAILED DIAGNOSIS:")
        response, response_time = self.make_request('GET', '/teams')
        if response:
            try:
                error_data = response.json()
                self.log_result(
                    "Teams API - GET /teams",
                    False,
                    f"HTTP {response.status_code} - JSON Error Response - Response time: {response_time:.2f}s",
                    error_data,
                    response.status_code
                )
            except:
                self.log_result(
                    "Teams API - GET /teams",
                    False,
                    f"HTTP {response.status_code} - Text Error Response - Response time: {response_time:.2f}s",
                    response.text,
                    response.status_code
                )
        else:
            self.log_result(
                "Teams API - GET /teams",
                False,
                "Connection failed or timeout"
            )
            
        # Test Friendships API with detailed error capture
        print("\n👥 FRIENDSHIPS API DETAILED DIAGNOSIS:")
        response, response_time = self.make_request('GET', '/friendships')
        if response:
            try:
                error_data = response.json()
                self.log_result(
                    "Friendships API - GET /friendships",
                    False,
                    f"HTTP {response.status_code} - JSON Error Response - Response time: {response_time:.2f}s",
                    error_data,
                    response.status_code
                )
            except:
                self.log_result(
                    "Friendships API - GET /friendships",
                    False,
                    f"HTTP {response.status_code} - Text Error Response - Response time: {response_time:.2f}s",
                    response.text,
                    response.status_code
                )
        else:
            self.log_result(
                "Friendships API - GET /friendships",
                False,
                "Connection failed or timeout"
            )
            
        # Test Notifications API with detailed error capture
        print("\n🔔 NOTIFICATIONS API DETAILED DIAGNOSIS:")
        response, response_time = self.make_request('GET', '/notifications')
        if response:
            try:
                error_data = response.json()
                self.log_result(
                    "Notifications API - GET /notifications",
                    False,
                    f"HTTP {response.status_code} - JSON Error Response - Response time: {response_time:.2f}s",
                    error_data,
                    response.status_code
                )
            except:
                self.log_result(
                    "Notifications API - GET /notifications",
                    False,
                    f"HTTP {response.status_code} - Text Error Response - Response time: {response_time:.2f}s",
                    response.text,
                    response.status_code
                )
        else:
            self.log_result(
                "Notifications API - GET /notifications",
                False,
                "Connection failed or timeout"
            )
            
    def test_database_connectivity(self):
        """Test database connectivity through working APIs"""
        print("\n💾 DATABASE CONNECTIVITY CHECK")
        print("=" * 60)
        
        # Test through profiles API (known working)
        response, response_time = self.make_request('GET', '/profiles')
        if response and response.status_code == 200:
            self.log_result(
                "Database Connectivity - Profiles API",
                True,
                f"Database accessible through profiles - Response time: {response_time:.2f}s",
                status_code=response.status_code
            )
        else:
            self.log_result(
                "Database Connectivity - Profiles API",
                False,
                f"Database connection issue through profiles - Status: {response.status_code if response else 'No response'}",
                status_code=response.status_code if response else None
            )
            
        # Test through challenges API (known working)
        response, response_time = self.make_request('GET', '/challenges')
        if response and response.status_code == 200:
            self.log_result(
                "Database Connectivity - Challenges API",
                True,
                f"Database accessible through challenges - Response time: {response_time:.2f}s",
                status_code=response.status_code
            )
        else:
            self.log_result(
                "Database Connectivity - Challenges API",
                False,
                f"Database connection issue through challenges - Status: {response.status_code if response else 'No response'}",
                status_code=response.status_code if response else None
            )
            
    def analyze_error_patterns(self):
        """Analyze error patterns to identify root cause"""
        print("\n🔍 ERROR PATTERN ANALYSIS")
        print("=" * 60)
        
        if not self.error_details:
            print("No errors captured for analysis")
            return
            
        # Group errors by type
        error_patterns = {}
        for error in self.error_details:
            error_key = f"HTTP {error.get('status_code', 'Unknown')}"
            if error_key not in error_patterns:
                error_patterns[error_key] = []
            error_patterns[error_key].append(error)
            
        print(f"Total errors captured: {len(self.error_details)}")
        print("\nError breakdown:")
        
        for error_type, errors in error_patterns.items():
            print(f"\n{error_type}: {len(errors)} occurrences")
            
            # Show sample error details
            if errors:
                sample_error = errors[0]
                print(f"  Sample endpoint: {sample_error.get('endpoint', 'Unknown')}")
                print(f"  Sample method: {sample_error.get('method', 'Unknown')}")
                
                if 'error_data' in sample_error:
                    error_data = sample_error['error_data']
                    if isinstance(error_data, dict):
                        print(f"  Error message: {error_data.get('error', 'No error message')}")
                    else:
                        print(f"  Error text: {str(error_data)[:100]}...")
                        
                # Check for specific error patterns
                error_text = str(sample_error.get('error_data', '')).lower()
                if 'cookies' in error_text:
                    print("  🚨 COOKIES API ISSUE DETECTED!")
                elif 'table' in error_text or 'relation' in error_text:
                    print("  🚨 DATABASE TABLE ISSUE DETECTED!")
                elif 'timeout' in error_text:
                    print("  🚨 TIMEOUT ISSUE DETECTED!")
                elif 'connection' in error_text:
                    print("  🚨 CONNECTION ISSUE DETECTED!")
                    
    def generate_final_diagnosis(self):
        """Generate comprehensive diagnosis report"""
        print("\n" + "=" * 80)
        print("🎯 FINAL DIAGNOSIS REPORT")
        print("=" * 80)
        
        total_tests = len(self.results)
        successful_tests = len([r for r in self.results if r['success']])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📊 OVERALL RESULTS:")
        print(f"   Total API Tests: {total_tests}")
        print(f"   Working APIs: {successful_tests}")
        print(f"   Failing APIs: {total_tests - successful_tests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        # Categorize results
        working_apis = [r for r in self.results if r['success']]
        failing_apis = [r for r in self.results if not r['success']]
        
        print(f"\n✅ WORKING APIs ({len(working_apis)}):")
        for api in working_apis:
            print(f"   - {api['test']}")
            
        print(f"\n❌ FAILING APIs ({len(failing_apis)}):")
        for api in failing_apis:
            status_info = f" [HTTP {api['status_code']}]" if api.get('status_code') else ""
            print(f"   - {api['test']}{status_info}")
            
        print(f"\n🔍 ROOT CAUSE ANALYSIS:")
        
        # Analyze specific patterns
        http_500_errors = [e for e in self.error_details if e.get('status_code') == 500]
        if http_500_errors:
            print(f"   - {len(http_500_errors)} HTTP 500 Internal Server Errors detected")
            print("   - This suggests server-side code issues, not database problems")
            
            # Check for specific error messages in 500 errors
            for error in http_500_errors[:3]:  # Check first 3 errors
                error_text = str(error.get('error_data', '')).lower()
                if 'cookies' in error_text:
                    print("   🚨 CRITICAL: Next.js 15 cookies API compatibility issue detected!")
                    print("   📋 SOLUTION: Apply cookies() API fixes to failing endpoints")
                elif 'internal server error' in error_text:
                    print("   🚨 CRITICAL: Generic server error - check API implementation")
                    
        database_errors = [e for e in self.error_details if 'table' in str(e.get('error_data', '')).lower()]
        if database_errors:
            print(f"   - {len(database_errors)} Database table errors detected")
            print("   - This suggests missing database tables despite user claims")
            
        print(f"\n💡 RECOMMENDED ACTIONS:")
        if success_rate < 50:
            print("   1. 🚨 URGENT: Verify Next.js 15 cookies API fixes are actually applied")
            print("   2. 🔍 Check server logs for detailed error messages")
            print("   3. 🛠️ Re-apply cookies API compatibility fixes to all failing endpoints")
            print("   4. 🧪 Test individual API files directly (not through proxy)")
        elif success_rate < 90:
            print("   1. 🔍 Focus on remaining failing APIs")
            print("   2. 🛠️ Apply targeted fixes based on error patterns")
            print("   3. 🧪 Verify database table accessibility")
        else:
            print("   ✅ System appears to be functioning correctly")
            
        print("\n🎯 FINAL CONCLUSION:")
        if success_rate < 50:
            print("   🚨 CRITICAL ISSUES DETECTED - Immediate action required")
            print("   📋 Primary suspect: Next.js 15 cookies API compatibility not properly applied")
        elif success_rate < 90:
            print("   ⚠️ PARTIAL FUNCTIONALITY - Some APIs need attention")
        else:
            print("   ✅ SYSTEM OPERATIONAL - Baby Goats platform ready for production")
            
        print("\n" + "=" * 80)

    def run_final_diagnosis(self):
        """Run complete diagnostic suite"""
        print("🎯 BABY GOATS SOCIAL PLATFORM - FINAL COMPREHENSIVE DIAGNOSIS")
        print("=" * 80)
        print("Investigating persistent 500 errors in social APIs")
        print("Focus: Teams, Friendships, Notifications vs Working APIs")
        print("=" * 80)
        
        # Run all diagnostic tests
        self.test_working_apis()
        self.test_failing_apis()
        self.test_database_connectivity()
        self.analyze_error_patterns()
        self.generate_final_diagnosis()

def main():
    """Main test execution"""
    tester = FinalDiagnosisTester()
    tester.run_final_diagnosis()

if __name__ == "__main__":
    main()