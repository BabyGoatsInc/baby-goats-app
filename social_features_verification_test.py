#!/usr/bin/env python3
"""
Baby Goats Social Features Verification Test
URGENT: VERIFY BABY GOATS SOCIAL FEATURES ARE NOW WORKING

**TESTING OBJECTIVE:** The user has confirmed that all required database tables are now created in Supabase 
(messages, friendships, notifications, leaderboards, leaderboard_entries, teams, team_members). 
Test to verify that all social features are now fully functional.

**PRIORITY TESTING:**

**1. SOCIAL FEATURES APIs (Should now work 100%)**
- Live Chat & Messaging APIs (/api/messages) - Should return data, not table errors
- Leaderboards & Rankings APIs (/api/leaderboards) - Should return data, not table errors  
- Friendship Management APIs (/api/friendships) - Should return data, not table errors
- Social Notifications APIs (/api/notifications) - Should return data, not table errors

**2. TEAM SYSTEM APIs (Should now work 100%)**
- Team Management APIs (/api/teams) - Should return data, not table errors
- Team Members APIs (/api/team-members) - Should return data, not table errors
- Team Challenges APIs (/api/team-challenges) - Should return data, not table errors

**3. VERIFY NO REGRESSION**
- Profiles API (/api/profiles) - Should still work perfectly
- Storage API (/api/storage) - Should still work perfectly
- Challenges API (/api/challenges) - Should still work perfectly

**EXPECTED RESULTS:**
- All APIs should now return 200 OK responses instead of "table not found" errors
- Social features should be 100% functional
- Backend should show 100% success rate or very close to it

**SUCCESS CRITERIA:**
- Confirm "Could not find table" errors are resolved
- Verify social and team APIs return proper data structures
- Validate that Baby Goats social platform is now fully operational

**CRITICAL:** This test will determine if the social platform is ready for production use!
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Configuration
BASE_URL = "https://youthgoat-social.preview.emergentagent.com/api"

class SocialFeaturesVerificationTest:
    def __init__(self):
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
        # Test data
        self.test_user_id = str(uuid.uuid4())
        self.test_friend_id = str(uuid.uuid4())
        self.test_team_id = str(uuid.uuid4())
        
        print("🚀 BABY GOATS SOCIAL FEATURES VERIFICATION TEST")
        print("=" * 60)
        print(f"Testing Backend URL: {BASE_URL}")
        print(f"Test User ID: {self.test_user_id}")
        print("=" * 60)

    def log_test(self, test_name, success, details, response_time=None):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
        
        result = {
            'test': test_name,
            'status': status,
            'success': success,
            'details': details,
            'response_time': response_time
        }
        self.test_results.append(result)
        
        time_info = f" ({response_time:.2f}s)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if not success:
            print(f"    Details: {details}")

    def test_api_endpoint(self, method, endpoint, data=None, expected_status=200, test_name=None):
        """Generic API endpoint tester"""
        if not test_name:
            test_name = f"{method} {endpoint}"
        
        url = f"{BASE_URL}{endpoint}"
        start_time = time.time()
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, timeout=10)
            
            response_time = time.time() - start_time
            
            # Check if we got the expected status
            if response.status_code == expected_status:
                try:
                    response_data = response.json()
                    # Check for "table not found" errors
                    if "Could not find table" in str(response_data) or "PGRST205" in str(response_data):
                        self.log_test(test_name, False, f"Database table still missing: {response_data}", response_time)
                        return False, response_data
                    else:
                        self.log_test(test_name, True, f"API working - Status {response.status_code}", response_time)
                        return True, response_data
                except:
                    self.log_test(test_name, True, f"API working - Status {response.status_code} (non-JSON response)", response_time)
                    return True, response.text
            else:
                try:
                    error_data = response.json()
                    self.log_test(test_name, False, f"Status {response.status_code}: {error_data}", response_time)
                    return False, error_data
                except:
                    self.log_test(test_name, False, f"Status {response.status_code}: {response.text}", response_time)
                    return False, response.text
                    
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test(test_name, False, f"Request failed: {str(e)}", response_time)
            return False, str(e)

    def test_social_messaging_apis(self):
        """Test Live Chat & Messaging APIs"""
        print("\n📱 TESTING SOCIAL MESSAGING APIs")
        print("-" * 40)
        
        # Test GET messages with user_id parameter
        self.test_api_endpoint("GET", f"/messages?user_id={self.test_user_id}", test_name="GET Messages API")
        
        # Test GET conversation between two users
        self.test_api_endpoint("GET", f"/messages?user_id={self.test_user_id}&friend_id={self.test_friend_id}", test_name="GET Conversation API")
        
        # Test POST message with correct field names
        message_data = {
            "sender_id": self.test_user_id,
            "receiver_id": self.test_friend_id,
            "content": "Hello from Baby Goats social test!",
            "message_type": "text"
        }
        self.test_api_endpoint("POST", "/messages", data=message_data, test_name="POST Message API")
        
        # Test PUT messages (mark as read) with correct parameters
        update_data = {
            "user_id": self.test_user_id,
            "friend_id": self.test_friend_id
        }
        self.test_api_endpoint("PUT", "/messages", data=update_data, test_name="PUT Messages API")

    def test_leaderboards_apis(self):
        """Test Leaderboards & Rankings APIs"""
        print("\n🏆 TESTING LEADERBOARDS APIs")
        print("-" * 40)
        
        # Test GET leaderboards
        self.test_api_endpoint("GET", "/leaderboards", test_name="GET Leaderboards API")
        
        # Test POST leaderboard entry
        leaderboard_data = {
            "user_id": self.test_user_id,
            "leaderboard_type": "weekly_challenges",
            "score": 150,
            "rank": 1
        }
        self.test_api_endpoint("POST", "/leaderboards", data=leaderboard_data, test_name="POST Leaderboard Entry API")
        
        # Test PUT leaderboard update
        update_data = {
            "user_id": self.test_user_id,
            "score": 200
        }
        self.test_api_endpoint("PUT", "/leaderboards", data=update_data, test_name="PUT Leaderboard Update API")

    def test_friendship_apis(self):
        """Test Friendship Management APIs"""
        print("\n👥 TESTING FRIENDSHIP APIs")
        print("-" * 40)
        
        # Test GET friendships
        self.test_api_endpoint("GET", "/friendships", test_name="GET Friendships API")
        
        # Test POST friendship request
        friendship_data = {
            "requester_id": self.test_user_id,
            "requested_id": self.test_friend_id,
            "status": "pending"
        }
        self.test_api_endpoint("POST", "/friendships", data=friendship_data, test_name="POST Friendship Request API")
        
        # Test PUT friendship update (accept)
        update_data = {
            "friendship_id": str(uuid.uuid4()),
            "status": "accepted"
        }
        self.test_api_endpoint("PUT", "/friendships", data=update_data, test_name="PUT Friendship Update API")
        
        # Test DELETE friendship
        self.test_api_endpoint("DELETE", f"/friendships?friendship_id={uuid.uuid4()}", test_name="DELETE Friendship API")

    def test_notifications_apis(self):
        """Test Social Notifications APIs"""
        print("\n🔔 TESTING NOTIFICATIONS APIs")
        print("-" * 40)
        
        # Test GET notifications
        self.test_api_endpoint("GET", "/notifications", test_name="GET Notifications API")
        
        # Test POST notification
        notification_data = {
            "user_id": self.test_user_id,
            "type": "friend_request",
            "title": "New Friend Request",
            "message": "Someone wants to be your friend!",
            "is_read": False
        }
        self.test_api_endpoint("POST", "/notifications", data=notification_data, test_name="POST Notification API")
        
        # Test PUT notification update
        update_data = {
            "notification_id": str(uuid.uuid4()),
            "is_read": True
        }
        self.test_api_endpoint("PUT", "/notifications", data=update_data, test_name="PUT Notification Update API")
        
        # Test DELETE notification
        self.test_api_endpoint("DELETE", f"/notifications?notification_id={uuid.uuid4()}", test_name="DELETE Notification API")

    def test_team_management_apis(self):
        """Test Team Management APIs"""
        print("\n⚽ TESTING TEAM MANAGEMENT APIs")
        print("-" * 40)
        
        # Test GET teams
        self.test_api_endpoint("GET", "/teams", test_name="GET Teams API")
        
        # Test POST team creation
        team_data = {
            "name": "Elite Champions",
            "description": "A team for elite athletes",
            "sport": "Soccer",
            "captain_id": self.test_user_id,
            "max_members": 20,
            "is_public": True
        }
        self.test_api_endpoint("POST", "/teams", data=team_data, test_name="POST Team Creation API")
        
        # Test PUT team update
        update_data = {
            "team_id": self.test_team_id,
            "description": "Updated team description"
        }
        self.test_api_endpoint("PUT", "/teams", data=update_data, test_name="PUT Team Update API")
        
        # Test DELETE team
        self.test_api_endpoint("DELETE", f"/teams?team_id={self.test_team_id}", test_name="DELETE Team API")

    def test_team_members_apis(self):
        """Test Team Members APIs"""
        print("\n👥 TESTING TEAM MEMBERS APIs")
        print("-" * 40)
        
        # Test GET team members
        self.test_api_endpoint("GET", "/team-members", test_name="GET Team Members API")
        
        # Test POST join team
        member_data = {
            "team_id": self.test_team_id,
            "user_id": self.test_user_id,
            "role": "member",
            "status": "active"
        }
        self.test_api_endpoint("POST", "/team-members", data=member_data, test_name="POST Join Team API")
        
        # Test PUT member role update
        update_data = {
            "team_id": self.test_team_id,
            "user_id": self.test_user_id,
            "role": "co_captain"
        }
        self.test_api_endpoint("PUT", "/team-members", data=update_data, test_name="PUT Member Role Update API")
        
        # Test DELETE leave team
        self.test_api_endpoint("DELETE", f"/team-members?team_id={self.test_team_id}&user_id={self.test_user_id}", test_name="DELETE Leave Team API")

    def test_team_challenges_apis(self):
        """Test Team Challenges APIs"""
        print("\n🏅 TESTING TEAM CHALLENGES APIs")
        print("-" * 40)
        
        # Test GET team challenges
        self.test_api_endpoint("GET", "/team-challenges", test_name="GET Team Challenges API")
        
        # Test POST team challenge creation
        challenge_data = {
            "name": "Team Sprint Challenge",
            "description": "Complete 100 sprints as a team",
            "challenge_type": "cumulative",
            "target_value": 100,
            "start_date": datetime.now().isoformat(),
            "end_date": datetime.now().isoformat(),
            "created_by": self.test_user_id
        }
        self.test_api_endpoint("POST", "/team-challenges", data=challenge_data, test_name="POST Team Challenge Creation API")
        
        # Test PUT team challenge progress
        progress_data = {
            "challenge_id": str(uuid.uuid4()),
            "team_id": self.test_team_id,
            "progress": 25
        }
        self.test_api_endpoint("PUT", "/team-challenges", data=progress_data, test_name="PUT Team Challenge Progress API")

    def test_regression_apis(self):
        """Test existing APIs to ensure no regression"""
        print("\n🔄 TESTING REGRESSION - EXISTING APIs")
        print("-" * 40)
        
        # Test Profiles API
        self.test_api_endpoint("GET", "/profiles", test_name="GET Profiles API (Regression)")
        
        # Test Storage API
        self.test_api_endpoint("GET", "/storage", test_name="GET Storage API (Regression)")
        
        # Test Challenges API
        self.test_api_endpoint("GET", "/challenges", test_name="GET Challenges API (Regression)")
        
        # Test Stats API
        self.test_api_endpoint("GET", "/stats", test_name="GET Stats API (Regression)")

    def run_all_tests(self):
        """Run all social features verification tests"""
        print("🎯 STARTING COMPREHENSIVE SOCIAL FEATURES VERIFICATION")
        print("=" * 60)
        
        # Test social features that should now work
        self.test_social_messaging_apis()
        self.test_leaderboards_apis()
        self.test_friendship_apis()
        self.test_notifications_apis()
        
        # Test team system that should now work
        self.test_team_management_apis()
        self.test_team_members_apis()
        self.test_team_challenges_apis()
        
        # Test regression
        self.test_regression_apis()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 60)
        print("🎯 BABY GOATS SOCIAL FEATURES VERIFICATION RESULTS")
        print("=" * 60)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"📊 OVERALL RESULTS:")
        print(f"   Total Tests: {self.total_tests}")
        print(f"   Passed: {self.passed_tests}")
        print(f"   Failed: {self.failed_tests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print(f"\n🎉 EXCELLENT! Social features are {success_rate:.1f}% functional!")
            print("✅ Baby Goats social platform is ready for production use!")
        elif success_rate >= 70:
            print(f"\n✅ GOOD! Social features are {success_rate:.1f}% functional!")
            print("⚠️ Minor issues remain but core functionality working")
        else:
            print(f"\n❌ ISSUES DETECTED! Only {success_rate:.1f}% of social features working")
            print("🚨 Database tables may still be missing or have configuration issues")
        
        # Categorize results
        social_tests = [r for r in self.test_results if any(keyword in r['test'].lower() for keyword in ['message', 'leaderboard', 'friendship', 'notification'])]
        team_tests = [r for r in self.test_results if any(keyword in r['test'].lower() for keyword in ['team', 'member', 'challenge'])]
        regression_tests = [r for r in self.test_results if 'regression' in r['test'].lower()]
        
        print(f"\n📱 SOCIAL FEATURES: {len([t for t in social_tests if t['success']])}/{len(social_tests)} working")
        print(f"⚽ TEAM SYSTEM: {len([t for t in team_tests if t['success']])}/{len(team_tests)} working")
        print(f"🔄 REGRESSION: {len([t for t in regression_tests if t['success']])}/{len(regression_tests)} working")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        print("\n" + "=" * 60)
        
        if "Could not find table" in str(self.test_results) or "PGRST205" in str(self.test_results):
            print("🚨 CRITICAL: Some database tables are still missing!")
            print("   Database schema deployment may not be complete")
        else:
            print("✅ No 'table not found' errors detected!")
            print("   Database schema appears to be properly deployed")

if __name__ == "__main__":
    tester = SocialFeaturesVerificationTest()
    tester.run_all_tests()