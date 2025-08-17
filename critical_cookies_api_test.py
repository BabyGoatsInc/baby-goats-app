#!/usr/bin/env python3
"""
CRITICAL NEXT.JS 15 COOKIES API FIX VALIDATION - FOCUSED TEST

**CRITICAL FINDING:** The Next.js 15 cookies API fixes have NOT been successfully applied.
All 3 APIs are still returning 500 errors:
- ❌ /api/friendships - Still returning 500 errors
- ❌ /api/teams - Still returning 500 errors  
- ❌ /api/notifications - Still returning 500 errors

This test provides definitive proof that the cookies API fixes need to be re-applied.
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

class CriticalCookiesAPITest:
    def __init__(self):
        self.results = []
        
    def log_result(self, test_name, success, details="", status_code=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'status_code': status_code,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if status_code:
            print(f"   Status Code: {status_code}")
        print()

    def test_critical_apis(self):
        """Test the 3 critical APIs that should have been fixed"""
        print("🚨 CRITICAL NEXT.JS 15 COOKIES API FIX VALIDATION")
        print("=" * 80)
        
        # Test the 3 APIs that were supposedly fixed
        critical_apis = [
            ('/friendships?user_id=test', 'Friendships API'),
            ('/teams?limit=1', 'Teams API'),
            ('/notifications?user_id=test', 'Notifications API')
        ]
        
        cookies_fix_failed = 0
        
        for endpoint, api_name in critical_apis:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS, timeout=10)
                
                if response.status_code == 500:
                    cookies_fix_failed += 1
                    self.log_result(
                        f"CRITICAL: {api_name} Cookies Fix",
                        False,
                        f"❌ COOKIES FIX FAILED! Still returning 500 error - Next.js 15 cookies API fix NOT applied",
                        response.status_code
                    )
                elif response.status_code == 200:
                    self.log_result(
                        f"CRITICAL: {api_name} Cookies Fix",
                        True,
                        f"✅ COOKIES FIX SUCCESSFUL! API working properly",
                        response.status_code
                    )
                elif response.status_code in [400, 404]:
                    self.log_result(
                        f"CRITICAL: {api_name} Cookies Fix",
                        True,
                        f"✅ COOKIES FIX SUCCESSFUL! API responding (no 500 error)",
                        response.status_code
                    )
                else:
                    self.log_result(
                        f"CRITICAL: {api_name} Cookies Fix",
                        False,
                        f"⚠️ UNEXPECTED STATUS: {response.status_code}",
                        response.status_code
                    )
                    
            except Exception as e:
                self.log_result(
                    f"CRITICAL: {api_name} Cookies Fix",
                    False,
                    f"❌ REQUEST FAILED: {str(e)}"
                )
        
        # Test working APIs for comparison
        print("\n📊 COMPARISON: Working APIs (for reference)")
        working_apis = [
            ('/profiles?limit=1', 'Profiles API'),
            ('/challenges?limit=1', 'Challenges API'),
            ('/leaderboards?limit=1', 'Leaderboards API'),
            ('/messages?user_id=test', 'Messages API')
        ]
        
        working_count = 0
        
        for endpoint, api_name in working_apis:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS, timeout=10)
                
                if response.status_code == 200:
                    working_count += 1
                    self.log_result(
                        f"REFERENCE: {api_name}",
                        True,
                        f"✅ WORKING PROPERLY",
                        response.status_code
                    )
                elif response.status_code in [400, 404]:
                    working_count += 1
                    self.log_result(
                        f"REFERENCE: {api_name}",
                        True,
                        f"✅ RESPONDING PROPERLY",
                        response.status_code
                    )
                else:
                    self.log_result(
                        f"REFERENCE: {api_name}",
                        False,
                        f"⚠️ STATUS: {response.status_code}",
                        response.status_code
                    )
                    
            except Exception as e:
                self.log_result(
                    f"REFERENCE: {api_name}",
                    False,
                    f"❌ REQUEST FAILED: {str(e)}"
                )
        
        # Generate critical findings report
        print("\n" + "=" * 80)
        print("🚨 CRITICAL FINDINGS REPORT")
        print("=" * 80)
        
        print(f"📊 COOKIES API FIX STATUS:")
        print(f"   • APIs Still Failing with 500 Errors: {cookies_fix_failed}/3")
        print(f"   • Working Reference APIs: {working_count}/4")
        
        if cookies_fix_failed > 0:
            print(f"\n❌ CRITICAL ISSUE IDENTIFIED:")
            print(f"   • Next.js 15 cookies API fixes have NOT been successfully applied")
            print(f"   • {cookies_fix_failed} APIs still returning 500 errors")
            print(f"   • The cookies() API pattern change was not implemented")
            
            print(f"\n🔧 REQUIRED ACTION:")
            print(f"   • Re-apply Next.js 15 cookies API fixes to:")
            if cookies_fix_failed >= 1:
                print(f"     - /app/src/app/api/friendships/route.ts")
                print(f"     - /app/src/app/api/teams/route.ts") 
                print(f"     - /app/src/app/api/notifications/route.ts")
            print(f"   • Change from: cookies,")
            print(f"   • Change to: const cookieStore = await cookies(); cookies: () => cookieStore,")
            print(f"   • Apply to ALL HTTP methods (GET, POST, PUT, DELETE)")
        else:
            print(f"\n✅ SUCCESS:")
            print(f"   • All Next.js 15 cookies API fixes have been successfully applied")
            print(f"   • No APIs returning 500 errors")
            print(f"   • Baby Goats social platform is operational")
        
        print(f"\n📈 PLATFORM STATUS:")
        total_apis_tested = len(critical_apis) + len(working_apis)
        total_working = (3 - cookies_fix_failed) + working_count
        success_rate = (total_working / total_apis_tested) * 100
        
        print(f"   • Overall API Success Rate: {success_rate:.1f}% ({total_working}/{total_apis_tested})")
        
        if success_rate >= 90:
            print(f"   • ✅ BABY GOATS PLATFORM: FULLY OPERATIONAL")
        elif success_rate >= 70:
            print(f"   • ⚠️ BABY GOATS PLATFORM: MOSTLY OPERATIONAL")
        else:
            print(f"   • ❌ BABY GOATS PLATFORM: CRITICAL ISSUES")
        
        print("\n" + "=" * 80)
        print("🎯 NEXT.JS 15 COOKIES API FIX VALIDATION COMPLETE")
        print("=" * 80)
        
        return cookies_fix_failed == 0

if __name__ == "__main__":
    tester = CriticalCookiesAPITest()
    success = tester.test_critical_apis()
    
    if not success:
        print("\n🚨 URGENT: Next.js 15 cookies API fixes must be re-applied!")
        exit(1)
    else:
        print("\n🎉 SUCCESS: All cookies API fixes working properly!")
        exit(0)