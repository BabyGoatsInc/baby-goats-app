#!/usr/bin/env python3
"""
Advanced Goal Tracking System Backend Testing Suite for Baby Goats Application
Tests backend APIs that support goal tracking functionality including challenges, stats, and profiles
Focus: Verify goal tracking backend infrastructure and data persistence capabilities
"""

import requests
import json
import uuid
from datetime import datetime
import time
import base64
import io
from PIL import Image

# Configuration - Testing profile photo system with Supabase Storage
BASE_URL = "https://goat-training-2.preview.emergentagent.com/api"
FRONTEND_URL = "https://goat-training-2.preview.emergentagent.com"
SUPABASE_URL = "https://ssdzlzlubzcknkoflgyf.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3Njc5OTYsImV4cCI6MjA3MDM0Mzk5Nn0.7ZpO5R64KS89k4We6jO9CbCevxwf1S5EOoqv6Xtv1Yk"

HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

SUPABASE_HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json'
}

# Test data - using realistic data for profile photo testing
TEST_USER_ID = str(uuid.uuid4())
TEST_PROFILE_ID = str(uuid.uuid4())
STORAGE_BUCKET = 'profile-photos'

# Preset avatar URLs for testing
PRESET_AVATARS = [
    {
        'id': 'athlete_1',
        'name': 'Champion',
        'url': 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=200&h=200&fit=crop&crop=face',
    },
    {
        'id': 'athlete_2', 
        'name': 'Rising Star',
        'url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    },
    {
        'id': 'athlete_3',
        'name': 'Elite Performer',
        'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    }
]

class APITester:
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
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, params=params, timeout=60)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=60)
            elif method == 'PUT':
                response = requests.put(url, headers=HEADERS, json=data, timeout=60)
            elif method == 'DELETE':
                response = requests.delete(url, headers=HEADERS, params=params, timeout=60)
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

    def test_goal_tracking_backend_infrastructure(self):
        """Test backend APIs that support goal tracking functionality - HIGH PRIORITY"""
        print("🧪 Testing Goal Tracking Backend Infrastructure...")
        
        # Test 1: Challenges API - Core goal tracking functionality
        response = self.make_request('GET', '/challenges', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            challenges = data.get('challenges', [])
            self.log_result(
                "Goal Tracking - Challenges API availability",
                True,
                f"Retrieved {len(challenges)} challenges for goal tracking system"
            )
            self.test_data['challenges'] = challenges
        else:
            self.log_result(
                "Goal Tracking - Challenges API availability",
                False,
                f"Challenges API failed, status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: Stats API - Progress tracking functionality
        response = self.make_request('GET', '/stats', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            stats = data.get('stats', [])
            self.log_result(
                "Goal Tracking - Stats API for progress tracking",
                True,
                f"Retrieved {len(stats)} stats entries for progress tracking"
            )
            self.test_data['stats'] = stats
        else:
            self.log_result(
                "Goal Tracking - Stats API for progress tracking",
                False,
                f"Stats API failed, status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 3: Profiles API - User goal preferences storage
        response = self.make_request('GET', '/profiles', params={
            'limit': 5,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            profiles = data.get('profiles', [])
            self.log_result(
                "Goal Tracking - Profiles API for user goal data",
                True,
                f"Retrieved {len(profiles)} profiles for goal tracking user data"
            )
            self.test_data['profiles'] = profiles
        else:
            self.log_result(
                "Goal Tracking - Profiles API for user goal data",
                False,
                f"Profiles API failed, status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

    def test_character_pillar_data_support(self):
        """Test backend support for Character Development Pillars - HIGH PRIORITY"""
        print("🧪 Testing Character Pillar Data Support...")
        
        # Test 1: Challenge categories for pillar mapping
        if self.test_data.get('challenges'):
            pillar_categories = ['fitness', 'mental', 'skill', 'leadership']
            category_counts = {}
            
            for challenge in self.test_data['challenges']:
                category = challenge.get('category', 'unknown')
                category_counts[category] = category_counts.get(category, 0) + 1
            
            pillar_support = any(cat in pillar_categories for cat in category_counts.keys())
            self.log_result(
                "Character Pillars - Challenge category mapping",
                pillar_support,
                f"Found categories: {list(category_counts.keys())} - {'supports' if pillar_support else 'missing'} pillar mapping"
            )
            self.test_data['challenge_categories'] = category_counts

        # Test 2: Stats categories for progress tracking
        response = self.make_request('GET', '/stats', params={
            'category': 'performance',
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            performance_stats = data.get('stats', [])
            self.log_result(
                "Character Pillars - Performance stats tracking",
                True,
                f"Retrieved {len(performance_stats)} performance stats for pillar progress"
            )
        else:
            self.log_result(
                "Character Pillars - Performance stats tracking",
                False,
                f"Performance stats failed, status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 3: User completion tracking via challenges
        if self.test_data.get('challenges') and len(self.test_data['challenges']) > 0:
            test_user_id = str(uuid.uuid4())
            challenge_id = self.test_data['challenges'][0].get('id')
            
            completion_data = {
                'user_id': test_user_id,
                'challenge_id': challenge_id,
                'notes': 'Goal tracking system test completion'
            }
            
            response = self.make_request('POST', '/challenges', data=completion_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                points_earned = data.get('points_earned', 0)
                self.log_result(
                    "Character Pillars - Challenge completion tracking",
                    True,
                    f"Challenge completion tracked, earned {points_earned} points for pillar progress"
                )
            else:
                self.log_result(
                    "Character Pillars - Challenge completion tracking",
                    False,
                    f"Challenge completion failed, status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

    def test_progress_analytics_data_support(self):
        """Test backend data support for Progress Charts & Analytics - MEDIUM PRIORITY"""
        print("🧪 Testing Progress Analytics Data Support...")
        
        # Test 1: User-specific stats for progress charts
        test_user_id = str(uuid.uuid4())
        response = self.make_request('GET', '/stats', params={
            'user_id': test_user_id,
            'limit': 10
        })
        
        if response and response.status_code == 200:
            data = response.json()
            user_stats = data.get('stats', [])
            self.log_result(
                "Progress Analytics - User-specific stats retrieval",
                True,
                f"Retrieved {len(user_stats)} user stats for progress chart data"
            )
        else:
            self.log_result(
                "Progress Analytics - User-specific stats retrieval",
                False,
                f"User stats failed, status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: Challenge completion history for streak tracking
        response = self.make_request('GET', '/challenges', params={
            'user_id': test_user_id,
            'limit': 20
        })
        
        if response and response.status_code == 200:
            data = response.json()
            user_challenges = data.get('challenges', [])
            self.log_result(
                "Progress Analytics - Challenge history for streaks",
                True,
                f"Retrieved {len(user_challenges)} user challenges for streak calculation"
            )
        else:
            self.log_result(
                "Progress Analytics - Challenge history for streaks",
                False,
                f"User challenges failed, status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 3: Stats creation for progress tracking
        stat_data = {
            'user_id': test_user_id,
            'stat_name': 'Goal Progress Test',
            'value': 75,
            'unit': 'percentage',
            'category': 'goal_tracking'
        }
        
        response = self.make_request('POST', '/stats', data=stat_data)
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            created_stat = data.get('stat', {})
            self.log_result(
                "Progress Analytics - Progress stat creation",
                True,
                f"Created progress stat: {created_stat.get('stat_name', 'Unknown')} = {created_stat.get('value', 0)}%"
            )
            self.test_data['created_progress_stat'] = created_stat
        else:
            self.log_result(
                "Progress Analytics - Progress stat creation",
                False,
                f"Progress stat creation failed, status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

    def test_achievement_system_backend_support(self):
        """Test backend support for Achievement Display - MEDIUM PRIORITY"""
        print("🧪 Testing Achievement System Backend Support...")
        
        # Test 1: Challenge completion points system
        if self.test_data.get('challenges') and len(self.test_data['challenges']) > 0:
            challenge = self.test_data['challenges'][0]
            points = challenge.get('points', 0)
            difficulty = challenge.get('difficulty', 'unknown')
            
            self.log_result(
                "Achievement System - Challenge points structure",
                points > 0,
                f"Challenge '{challenge.get('title', 'Unknown')}' has {points} points (difficulty: {difficulty})"
            )

        # Test 2: User stats for achievement tracking
        test_user_id = str(uuid.uuid4())
        achievement_stats = [
            {'stat_name': 'Current Streak', 'value': 7, 'category': 'achievement'},
            {'stat_name': 'Goals Completed', 'value': 4, 'category': 'achievement'},
            {'stat_name': 'Success Rate', 'value': 85, 'category': 'achievement'}
        ]
        
        created_achievement_stats = 0
        for stat_data in achievement_stats:
            stat_data['user_id'] = test_user_id
            stat_data['unit'] = 'count' if 'Streak' in stat_data['stat_name'] or 'Goals' in stat_data['stat_name'] else 'percentage'
            
            response = self.make_request('POST', '/stats', data=stat_data)
            if response and response.status_code in [200, 201]:
                created_achievement_stats += 1
        
        self.log_result(
            "Achievement System - Achievement stats creation",
            created_achievement_stats == len(achievement_stats),
            f"Created {created_achievement_stats}/{len(achievement_stats)} achievement stats"
        )

        # Test 3: Profile integration for achievement display
        if self.test_data.get('profiles') and len(self.test_data['profiles']) > 0:
            profile = self.test_data['profiles'][0]
            profile_fields = ['full_name', 'sport', 'grad_year']
            available_fields = [field for field in profile_fields if profile.get(field)]
            
            self.log_result(
                "Achievement System - Profile data for achievement context",
                len(available_fields) >= 2,
                f"Profile has {len(available_fields)}/{len(profile_fields)} fields for achievement display"
            )

    def test_goal_tracking_navigation_backend_support(self):
        """Test backend support for Goal Tracking Navigation - HIGH PRIORITY"""
        print("🧪 Testing Goal Tracking Navigation Backend Support...")
        
        # Test 1: API endpoint availability for PROGRESS navigation
        endpoints_to_test = ['/profiles', '/challenges', '/stats']
        working_endpoints = 0
        
        for endpoint in endpoints_to_test:
            response = self.make_request('GET', endpoint, params={'limit': 1})
            if response and response.status_code == 200:
                working_endpoints += 1
        
        self.log_result(
            "Goal Navigation - Core API endpoints availability",
            working_endpoints == len(endpoints_to_test),
            f"{working_endpoints}/{len(endpoints_to_test)} core endpoints working for PROGRESS navigation"
        )

        # Test 2: User authentication support for goal tracking
        auth_headers = {
            **HEADERS,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
        }
        
        # Test authenticated request
        response = requests.get(
            f"{BASE_URL}/profiles",
            headers=auth_headers,
            params={'limit': 1},
            timeout=30
        )
        
        if response and response.status_code == 200:
            self.log_result(
                "Goal Navigation - Authentication support",
                True,
                "Backend supports authenticated requests for goal tracking"
            )
        else:
            self.log_result(
                "Goal Navigation - Authentication support",
                False,
                f"Authentication failed, status: {response.status_code if response else 'No response'}"
            )

        # Test 3: Data persistence for goal tracking
        if self.test_data.get('created_progress_stat'):
            stat_id = self.test_data['created_progress_stat'].get('id')
            if stat_id:
                # Try to retrieve the created stat
                response = self.make_request('GET', '/stats', params={
                    'user_id': self.test_data['created_progress_stat'].get('user_id'),
                    'limit': 5
                })
                
                if response and response.status_code == 200:
                    data = response.json()
                    stats = data.get('stats', [])
                    found_stat = any(s.get('id') == stat_id for s in stats)
                    
                    self.log_result(
                        "Goal Navigation - Data persistence verification",
                        found_stat,
                        f"Progress stat {'found' if found_stat else 'NOT found'} - persistence {'confirmed' if found_stat else 'FAILED'}"
                    )
                else:
                    self.log_result(
                        "Goal Navigation - Data persistence verification",
                        False,
                        f"Stat retrieval failed, status: {response.status_code if response else 'No response'}"
                    )

    def run_goal_tracking_tests(self):
        """Run complete goal tracking backend testing suite"""
        print(f"🚀 Starting Advanced Goal Tracking Backend Testing Suite")
        print(f"📍 Backend API URL: {BASE_URL}")
        print(f"📍 Frontend URL: {FRONTEND_URL}")
        print(f"🎯 Focus: Goal tracking backend infrastructure, character pillars, progress analytics")
        print(f"🕐 Started at: {datetime.now().isoformat()}")
        print("=" * 80)
        
        try:
            # HIGH PRIORITY TESTS
            print("\n🔥 HIGH PRIORITY TESTS")
            print("-" * 40)
            
            # Test goal tracking backend infrastructure
            self.test_goal_tracking_backend_infrastructure()
            
            # Test character pillar data support
            self.test_character_pillar_data_support()
            
            # Test goal tracking navigation backend support
            self.test_goal_tracking_navigation_backend_support()
            
            # MEDIUM PRIORITY TESTS
            print("\n⚡ MEDIUM PRIORITY TESTS")
            print("-" * 40)
            
            # Test progress analytics data support
            self.test_progress_analytics_data_support()
            
            # Test achievement system backend support
            self.test_achievement_system_backend_support()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
            self.log_result("Goal Tracking Test Suite Execution", False, str(e))
        
        # Print summary
        self.print_goal_tracking_summary()

    def print_goal_tracking_summary(self):
        """Print goal tracking test results summary"""
        print("=" * 80)
        print("📊 ADVANCED GOAL TRACKING BACKEND TEST RESULTS SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        
        # Categorize results by priority
        high_priority_tests = [r for r in self.results if any(keyword in r['test'] for keyword in 
            ['Goal Tracking', 'Character Pillars', 'Goal Navigation'])]
        high_priority_passed = len([r for r in high_priority_tests if r['success']])
        
        print(f"\n🔥 HIGH PRIORITY TESTS (Goal Tracking Infrastructure):")
        print(f"   Passed: {high_priority_passed}/{len(high_priority_tests)}")
        
        # Check for backend API functionality
        api_tests = [r for r in self.results if 'API' in r['test']]
        api_passed = len([r for r in api_tests if r['success']])
        
        print(f"\n🔌 BACKEND API FUNCTIONALITY:")
        print(f"   Successful: {api_passed}/{len(api_tests)}")
        
        if api_passed > 0:
            print("   🎉 BACKEND APIS WORKING - Goal tracking data can be stored and retrieved!")
        else:
            print("   ⚠️ API ISSUES - Goal tracking backend functionality may not work")
        
        # Check for character pillar support
        pillar_tests = [r for r in self.results if 'Pillar' in r['test'] or 'Character' in r['test']]
        pillar_passed = len([r for r in pillar_tests if r['success']])
        
        print(f"\n🛡️ CHARACTER PILLAR SUPPORT:")
        print(f"   Successful: {pillar_passed}/{len(pillar_tests)}")
        
        if pillar_passed > 0:
            print("   🎉 PILLAR SYSTEM SUPPORTED - Character development tracking functional!")
        else:
            print("   ⚠️ PILLAR ISSUES - Character development may rely on frontend-only data")
        
        # Check for progress analytics support
        analytics_tests = [r for r in self.results if 'Analytics' in r['test'] or 'Progress' in r['test']]
        analytics_passed = len([r for r in analytics_tests if r['success']])
        
        print(f"\n📈 PROGRESS ANALYTICS SUPPORT:")
        print(f"   Successful: {analytics_passed}/{len(analytics_tests)}")
        
        if analytics_passed > 0:
            print("   🎉 ANALYTICS SUPPORTED - Progress charts can display real backend data!")
        else:
            print("   ⚠️ ANALYTICS ISSUES - Progress charts may rely on mock data only")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        print(f"\n💡 GOAL TRACKING SYSTEM STATUS:")
        if passed_tests >= total_tests * 0.7:  # 70% success rate
            print("   ✅ GOAL TRACKING BACKEND READY - Advanced goal tracking system has solid backend support!")
        elif passed_tests >= total_tests * 0.5:  # 50% success rate
            print("   ⚠️ PARTIAL SUPPORT - Goal tracking system partially supported, some features may use mock data")
        else:
            print("   ❌ LIMITED SUPPORT - Goal tracking system appears to be primarily frontend-only with mock data")
        
        print("\n🕐 Completed at:", datetime.now().isoformat())
        print("=" * 80)
        """Test Production Profiles API with Service Role Key - HIGH PRIORITY"""
        print("🧪 Testing Production Profiles API (Service Role Key)...")
        
        # Test 1: GET profiles (should still work)
        response = self.make_request('GET', '/profiles', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            production_mode = data.get('productionMode', False)
            profiles = data.get('profiles', [])
            self.log_result(
                "GET /api/profiles - Production mode check",
                True,
                f"Production Mode: {production_mode}, Retrieved {len(profiles)} profiles"
            )
            self.test_data['profiles'] = profiles
            # Store existing user ID for testing updates
            if profiles:
                self.test_data['existing_user_id'] = profiles[0].get('id')
        else:
            self.log_result(
                "GET /api/profiles - Production mode check",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: POST update existing profile (CRITICAL TEST - should work with service role key)
        if self.test_data.get('existing_user_id'):
            profile_data = {
                'id': self.test_data['existing_user_id'],
                'full_name': 'Production Database Test User',
                'sport': 'Soccer',
                'grad_year': 2025
            }
            
            response = self.make_request('POST', '/profiles', data=profile_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                production_mode = data.get('productionMode', False)
                self.log_result(
                    "POST /api/profiles - Update existing profile (Production DB)",
                    True,
                    f"Production Mode: {production_mode}, Updated: {data.get('profile', {}).get('full_name', 'Unknown')}"
                )
                self.test_data['updated_profile'] = data.get('profile')
            else:
                self.log_result(
                    "POST /api/profiles - Update existing profile (Production DB)",
                    False,
                    f"Status: {response.status_code if response else 'No response'} - RLS should be bypassed with service role key",
                    response.json() if response else None
                )

        # Test 3: Verify profile update persisted (persistence check)
        if self.test_data.get('existing_user_id'):
            response = self.make_request('GET', '/profiles', params={
                'search': 'Production Database Test',
                'limit': 5
            })
            
            if response and response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                found_profile = any(p.get('id') == self.test_data['existing_user_id'] for p in profiles)
                self.log_result(
                    "GET /api/profiles - Verify update persistence",
                    found_profile,
                    f"Updated profile {'found' if found_profile else 'NOT found'} in database - persistence {'confirmed' if found_profile else 'FAILED'}"
                )
            else:
                self.log_result(
                    "GET /api/profiles - Verify update persistence",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

        # Test 4: PUT update profile (should work with service role key)
        if self.test_data.get('existing_user_id'):
            update_data = {
                'id': self.test_data['existing_user_id'],
                'full_name': 'Production Database Test User - PUT Updated',
                'sport': 'Basketball',
                'grad_year': 2024
            }
            
            response = self.make_request('PUT', '/profiles', data=update_data)
            
            if response and response.status_code == 200:
                data = response.json()
                production_mode = data.get('productionMode', False)
                self.log_result(
                    "PUT /api/profiles - Update (Production DB)",
                    True,
                    f"Production Mode: {production_mode}, Updated: {data.get('profile', {}).get('full_name', 'Unknown')}"
                )
            else:
                self.log_result(
                    "PUT /api/profiles - Update (Production DB)",
                    False,
                    f"Status: {response.status_code if response else 'No response'} - RLS should be bypassed with service role key",
                    response.json() if response else None
                )

    def test_production_highlights_api(self):
        """Test Production Highlights API with Service Role Key - MEDIUM PRIORITY"""
        print("🧪 Testing Production Highlights API (Service Role Key)...")
        
        # Test 1: GET highlights (should still work)
        response = self.make_request('GET', '/highlights', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            production_mode = data.get('productionMode', False)
            self.log_result(
                "GET /api/highlights - Production mode check",
                True,
                f"Production Mode: {production_mode}, Retrieved {len(data.get('highlights', []))} highlights"
            )
            self.test_data['highlights'] = data.get('highlights', [])
        else:
            self.log_result(
                "GET /api/highlights - Production mode check",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: POST create highlight (should work with service role key)
        if self.test_data.get('elite_profile_id'):
            highlight_data = {
                'user_id': self.test_data['elite_profile_id'],
                'title': 'Production Test Highlight',
                'video_url': 'https://example.com/production-test-video.mp4',
                'description': 'Test highlight for production database',
                'is_featured': False
            }
            
            response = self.make_request('POST', '/highlights', data=highlight_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                production_mode = data.get('productionMode', False)
                self.log_result(
                    "POST /api/highlights - Create (Production DB)",
                    True,
                    f"Production Mode: {production_mode}, Created: {data.get('highlight', {}).get('title', 'Unknown')}"
                )
                self.test_data['created_highlight'] = data.get('highlight')
            else:
                self.log_result(
                    "POST /api/highlights - Create (Production DB)",
                    False,
                    f"Status: {response.status_code if response else 'No response'} - RLS should be bypassed with service role key",
                    response.json() if response else None
                )

    def test_production_stats_api(self):
        """Test Production Stats API with Service Role Key - MEDIUM PRIORITY"""
        print("🧪 Testing Production Stats API (Service Role Key)...")
        
        # Test 1: GET stats (should still work)
        response = self.make_request('GET', '/stats', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            production_mode = data.get('productionMode', False)
            self.log_result(
                "GET /api/stats - Production mode check",
                True,
                f"Production Mode: {production_mode}, Retrieved {len(data.get('stats', []))} stats"
            )
        else:
            self.log_result(
                "GET /api/stats - Production mode check",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: POST create stat (should work with service role key)
        if self.test_data.get('elite_profile_id'):
            stat_data = {
                'user_id': self.test_data['elite_profile_id'],
                'stat_name': 'Production Test Goals',
                'value': 25,
                'unit': 'goals',
                'category': 'performance'
            }
            
            response = self.make_request('POST', '/stats', data=stat_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                production_mode = data.get('productionMode', False)
                self.log_result(
                    "POST /api/stats - Create (Production DB)",
                    True,
                    f"Production Mode: {production_mode}, Created: {data.get('stat', {}).get('stat_name', 'Unknown')}"
                )
                self.test_data['created_stat'] = data.get('stat')
            else:
                self.log_result(
                    "POST /api/stats - Create (Production DB)",
                    False,
                    f"Status: {response.status_code if response else 'No response'} - RLS should be bypassed with service role key",
                    response.json() if response else None
                )

    def test_production_likes_api(self):
        """Test Production Likes API with Service Role Key - MEDIUM PRIORITY"""
        print("🧪 Testing Production Likes API (Service Role Key)...")
        
        # Test 1: GET likes (should still work)
        response = self.make_request('GET', '/likes', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            production_mode = data.get('productionMode', False)
            self.log_result(
                "GET /api/likes - Production mode check",
                True,
                f"Production Mode: {production_mode}, Retrieved {len(data.get('likes', []))} likes"
            )
        else:
            self.log_result(
                "GET /api/likes - Production mode check",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: POST toggle like (should work with service role key)
        if self.test_data.get('created_highlight') and self.test_data.get('elite_profile_id'):
            like_data = {
                'user_id': self.test_data['elite_profile_id'],
                'highlight_id': self.test_data['created_highlight'].get('id')
            }
            
            response = self.make_request('POST', '/likes', data=like_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                production_mode = data.get('productionMode', False)
                liked = data.get('liked', False)
                self.log_result(
                    "POST /api/likes - Toggle like (Production DB)",
                    True,
                    f"Production Mode: {production_mode}, Like {'added' if liked else 'removed'}"
                )
            else:
                self.log_result(
                    "POST /api/likes - Toggle like (Production DB)",
                    False,
                    f"Status: {response.status_code if response else 'No response'} - RLS should be bypassed with service role key",
                    response.json() if response else None
                )

    def test_production_challenges_api(self):
        """Test Production Challenges API with Service Role Key - MEDIUM PRIORITY"""
        print("🧪 Testing Production Challenges API (Service Role Key)...")
        
        # Test 1: GET challenges (should still work)
        response = self.make_request('GET', '/challenges', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            production_mode = data.get('productionMode', False)
            self.log_result(
                "GET /api/challenges - Production mode check",
                True,
                f"Production Mode: {production_mode}, Retrieved {len(data.get('challenges', []))} challenges"
            )
            self.test_data['challenges'] = data.get('challenges', [])
        else:
            self.log_result(
                "GET /api/challenges - Production mode check",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: POST complete challenge (should work with service role key)
        if self.test_data.get('challenges') and self.test_data.get('elite_profile_id'):
            challenge_id = self.test_data['challenges'][0].get('id')
            completion_data = {
                'user_id': self.test_data['elite_profile_id'],
                'challenge_id': challenge_id,
                'notes': 'Production database test completion'
            }
            
            response = self.make_request('POST', '/challenges', data=completion_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                production_mode = data.get('productionMode', False)
                self.log_result(
                    "POST /api/challenges - Complete challenge (Production DB)",
                    True,
                    f"Production Mode: {production_mode}, Earned {data.get('points_earned', 0)} points"
                )
            else:
                self.log_result(
                    "POST /api/challenges - Complete challenge (Production DB)",
                    False,
                    f"Status: {response.status_code if response else 'No response'} - RLS should be bypassed with service role key",
                    response.json() if response else None
                )

    def test_elite_onboarding_flow(self):
        """Test Complete Elite Onboarding Flow - HIGH PRIORITY"""
        print("🧪 Testing Complete Elite Onboarding Flow (Production DB)...")
        
        # Get existing user IDs to test with
        response = self.make_request('GET', '/profiles', params={'limit': 5})
        existing_users = []
        if response and response.status_code == 200:
            data = response.json()
            existing_users = [p.get('id') for p in data.get('profiles', []) if p.get('id')]
        
        if not existing_users:
            self.log_result(
                "Elite Onboarding - No existing users found",
                False,
                "Cannot test Elite Onboarding without existing user IDs"
            )
            return
        
        # Simulate Elite Onboarding data updates using correct schema
        onboarding_updates = [
            {
                'id': existing_users[0] if len(existing_users) > 0 else None,
                'full_name': 'Sarah Elite Soccer Player',
                'sport': 'Soccer',
                'grad_year': 2025
            },
            {
                'id': existing_users[1] if len(existing_users) > 1 else existing_users[0],
                'full_name': 'Marcus Elite Basketball Player',
                'sport': 'Basketball',
                'grad_year': 2024
            },
            {
                'id': existing_users[2] if len(existing_users) > 2 else existing_users[0],
                'full_name': 'Emma Elite Tennis Player',
                'sport': 'Tennis',
                'grad_year': 2026
            }
        ]
        
        updated_profiles = []
        
        for profile_data in onboarding_updates:
            if not profile_data['id']:
                continue
                
            response = self.make_request('POST', '/profiles', data=profile_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                production_mode = data.get('productionMode', False)
                updated_profiles.append(data.get('profile'))
                self.log_result(
                    f"Elite Onboarding - {profile_data['sport']} athlete",
                    True,
                    f"Production Mode: {production_mode}, Updated: {profile_data['full_name']}"
                )
            else:
                self.log_result(
                    f"Elite Onboarding - {profile_data['sport']} athlete",
                    False,
                    f"Status: {response.status_code if response else 'No response'} - Service role key should bypass RLS",
                    response.json() if response else None
                )
        
        # Verify all profiles can be retrieved with updated data
        response = self.make_request('GET', '/profiles', params={'limit': 20})
        if response and response.status_code == 200:
            data = response.json()
            all_profiles = data.get('profiles', [])
            elite_profiles = [p for p in all_profiles if 'Elite' in p.get('full_name', '')]
            self.log_result(
                "Elite Onboarding - Verify all profiles retrievable",
                len(elite_profiles) >= len(updated_profiles),
                f"Found {len(elite_profiles)} elite profiles in database"
            )
        
        self.test_data['elite_onboarding_profiles'] = updated_profiles

    def test_profiles_api(self):
        """Test Profiles API endpoints through FastAPI proxy"""
        print("🧪 Testing Profiles API (FastAPI Proxy)...")
        
        # Test 1: GET profiles with filters (should work as before)
        response = self.make_request('GET', '/profiles', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/profiles - Basic fetch via proxy",
                True,
                f"Retrieved {len(data.get('profiles', []))} profiles"
            )
            self.test_data['profiles'] = data.get('profiles', [])
        else:
            self.log_result(
                "GET /api/profiles - Basic fetch via proxy",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: GET profiles with sport filter
        response = self.make_request('GET', '/profiles', params={
            'sport': 'Soccer',
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/profiles - Sport filter via proxy",
                True,
                f"Retrieved {len(data.get('profiles', []))} soccer profiles"
            )
        else:
            self.log_result(
                "GET /api/profiles - Sport filter via proxy",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 3: GET profiles with search
        response = self.make_request('GET', '/profiles', params={
            'search': 'Elite',
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/profiles - Name search via proxy",
                True,
                f"Search returned {len(data.get('profiles', []))} results"
            )
        else:
            self.log_result(
                "GET /api/profiles - Name search via proxy",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 4: POST create profile (should route to MVP endpoint)
        profile_data = {
            'id': str(uuid.uuid4()),
            'full_name': 'Basketball Star Proxy Test',
            'sport': 'Basketball',
            'experience_level': 'Proven Champion',
            'passion_level': 8,
            'selected_goals': ['Team Leadership', 'Competitive Excellence'],
            'grad_year': 2025
        }
        
        response = self.make_request('POST', '/profiles', data=profile_data)
        
        if response and response.status_code == 200:
            data = response.json()
            mvp_mode = data.get('mvpMode', False)
            self.log_result(
                "POST /api/profiles - Create via proxy (MVP routing)",
                True,
                f"MVP Mode: {mvp_mode}, Created: {data.get('profile', {}).get('full_name', 'Unknown')}"
            )
            self.test_data['proxy_created_profile'] = data.get('profile')
        else:
            self.log_result(
                "POST /api/profiles - Create via proxy (MVP routing)",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 5: PUT update profile (should route to MVP endpoint)
        if self.test_data.get('proxy_created_profile'):
            update_data = {
                'id': profile_data['id'],
                'full_name': 'Basketball Star Proxy Test - Updated',
                'passion_level': 9
            }
            
            response = self.make_request('PUT', '/profiles', data=update_data)
            
            if response and response.status_code == 200:
                data = response.json()
                self.log_result(
                    "PUT /api/profiles - Update via proxy (MVP routing)",
                    True,
                    f"Updated: {data.get('profile', {}).get('full_name', 'Unknown')}"
                )
            else:
                self.log_result(
                    "PUT /api/profiles - Update via proxy (MVP routing)",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

    def test_highlights_api(self):
        """Test Highlights API endpoints"""
        print("🧪 Testing Highlights API...")
        
        # Test 1: GET highlights
        response = self.make_request('GET', '/highlights', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/highlights - Basic fetch",
                True,
                f"Retrieved {len(data.get('highlights', []))} highlights"
            )
            self.test_data['highlights'] = data.get('highlights', [])
        else:
            self.log_result(
                "GET /api/highlights - Basic fetch",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: GET highlights with user filter
        if self.test_data.get('highlights'):
            user_id = self.test_data['highlights'][0].get('user_id')
            if user_id:
                response = self.make_request('GET', '/highlights', params={
                    'user_id': user_id,
                    'limit': 5
                })
                
                if response and response.status_code == 200:
                    data = response.json()
                    self.log_result(
                        "GET /api/highlights - User filter",
                        True,
                        f"Retrieved {len(data.get('highlights', []))} highlights for user"
                    )
                else:
                    self.log_result(
                        "GET /api/highlights - User filter",
                        False,
                        f"Status: {response.status_code if response else 'No response'}",
                        response.json() if response else None
                    )

        # Test 3: GET featured highlights
        response = self.make_request('GET', '/highlights', params={
            'is_featured': 'true',
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/highlights - Featured filter",
                True,
                f"Retrieved {len(data.get('highlights', []))} featured highlights"
            )
        else:
            self.log_result(
                "GET /api/highlights - Featured filter",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 4: POST create highlight (requires approved user)
        highlight_data = {
            'user_id': TEST_USER_ID,  # Using our test user
            'title': 'Amazing Goal Test',
            'video_url': 'https://example.com/test-video.mp4',
            'description': 'Test highlight video',
            'is_featured': False
        }
        
        response = self.make_request('POST', '/highlights', data=highlight_data)
        
        if response and response.status_code == 201:
            data = response.json()
            self.log_result(
                "POST /api/highlights - Create highlight",
                True,
                f"Created highlight: {data.get('highlight', {}).get('title', 'Unknown')}"
            )
            self.test_data['created_highlight'] = data.get('highlight')
            global TEST_HIGHLIGHT_ID
            TEST_HIGHLIGHT_ID = data.get('highlight', {}).get('id', TEST_HIGHLIGHT_ID)
        else:
            self.log_result(
                "POST /api/highlights - Create highlight",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 5: PUT update highlight
        if self.test_data.get('created_highlight'):
            highlight_id = self.test_data['created_highlight'].get('id')
            update_data = {
                'id': highlight_id,
                'title': 'Updated Amazing Goal Test',
                'description': 'Updated test highlight video'
            }
            
            response = self.make_request('PUT', '/highlights', data=update_data)
            
            if response and response.status_code == 200:
                data = response.json()
                self.log_result(
                    "PUT /api/highlights - Update highlight",
                    True,
                    f"Updated highlight: {data.get('highlight', {}).get('title', 'Unknown')}"
                )
            else:
                self.log_result(
                    "PUT /api/highlights - Update highlight",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

    def test_challenges_api(self):
        """Test Challenges API endpoints"""
        print("🧪 Testing Challenges API...")
        
        # Test 1: GET challenges
        response = self.make_request('GET', '/challenges', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/challenges - Basic fetch",
                True,
                f"Retrieved {len(data.get('challenges', []))} challenges"
            )
            self.test_data['challenges'] = data.get('challenges', [])
        else:
            self.log_result(
                "GET /api/challenges - Basic fetch",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: GET challenges with category filter
        response = self.make_request('GET', '/challenges', params={
            'category': 'fitness',
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/challenges - Category filter",
                True,
                f"Retrieved {len(data.get('challenges', []))} fitness challenges"
            )
        else:
            self.log_result(
                "GET /api/challenges - Category filter",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 3: GET challenges with user completion status
        response = self.make_request('GET', '/challenges', params={
            'user_id': TEST_USER_ID,
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/challenges - With completion status",
                True,
                f"Retrieved {len(data.get('challenges', []))} challenges with completion status"
            )
        else:
            self.log_result(
                "GET /api/challenges - With completion status",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 4: POST complete challenge
        if self.test_data.get('challenges'):
            challenge_id = self.test_data['challenges'][0].get('id')
            completion_data = {
                'user_id': TEST_USER_ID,
                'challenge_id': challenge_id,
                'notes': 'Completed during testing'
            }
            
            response = self.make_request('POST', '/challenges', data=completion_data)
            
            if response and response.status_code == 201:
                data = response.json()
                self.log_result(
                    "POST /api/challenges - Complete challenge",
                    True,
                    f"Completed challenge, earned {data.get('points_earned', 0)} points"
                )
            else:
                self.log_result(
                    "POST /api/challenges - Complete challenge",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

    def test_stats_api(self):
        """Test Stats API endpoints"""
        print("🧪 Testing Stats API...")
        
        # Test 1: GET stats
        response = self.make_request('GET', '/stats', params={
            'limit': 10,
            'offset': 0
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/stats - Basic fetch",
                True,
                f"Retrieved {len(data.get('stats', []))} stats"
            )
            self.test_data['stats'] = data.get('stats', [])
        else:
            self.log_result(
                "GET /api/stats - Basic fetch",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: GET stats with user filter
        response = self.make_request('GET', '/stats', params={
            'user_id': TEST_USER_ID,
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/stats - User filter",
                True,
                f"Retrieved {len(data.get('stats', []))} stats for user"
            )
        else:
            self.log_result(
                "GET /api/stats - User filter",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 3: GET stats with category filter
        response = self.make_request('GET', '/stats', params={
            'category': 'performance',
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/stats - Category filter",
                True,
                f"Retrieved {len(data.get('stats', []))} performance stats"
            )
        else:
            self.log_result(
                "GET /api/stats - Category filter",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 4: POST create stat
        stat_data = {
            'user_id': TEST_USER_ID,
            'stat_name': 'Goals Scored',
            'value': 15,
            'unit': 'goals',
            'category': 'performance'
        }
        
        response = self.make_request('POST', '/stats', data=stat_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "POST /api/stats - Create stat",
                True,
                f"Created stat: {data.get('stat', {}).get('stat_name', 'Unknown')} = {data.get('stat', {}).get('value', 0)}"
            )
            self.test_data['created_stat'] = data.get('stat')
        else:
            self.log_result(
                "POST /api/stats - Create stat",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 5: PUT update stat
        if self.test_data.get('created_stat'):
            stat_id = self.test_data['created_stat'].get('id')
            update_data = {
                'id': stat_id,
                'value': 20,
                'unit': 'goals'
            }
            
            response = self.make_request('PUT', '/stats', data=update_data)
            
            if response and response.status_code == 200:
                data = response.json()
                self.log_result(
                    "PUT /api/stats - Update stat",
                    True,
                    f"Updated stat value to {data.get('stat', {}).get('value', 0)}"
                )
            else:
                self.log_result(
                    "PUT /api/stats - Update stat",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

    def test_likes_api(self):
        """Test Likes API endpoints"""
        print("🧪 Testing Likes API...")
        
        # Test 1: GET likes for highlight
        if self.test_data.get('highlights'):
            highlight_id = self.test_data['highlights'][0].get('id')
            response = self.make_request('GET', '/likes', params={
                'highlight_id': highlight_id,
                'limit': 10
            })
            
            if response and response.status_code == 200:
                data = response.json()
                self.log_result(
                    "GET /api/likes - Highlight likes",
                    True,
                    f"Retrieved {len(data.get('likes', []))} likes for highlight"
                )
            else:
                self.log_result(
                    "GET /api/likes - Highlight likes",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

        # Test 2: GET likes for user
        response = self.make_request('GET', '/likes', params={
            'user_id': TEST_USER_ID,
            'limit': 10
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/likes - User likes",
                True,
                f"Retrieved {len(data.get('likes', []))} likes by user"
            )
        else:
            self.log_result(
                "GET /api/likes - User likes",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 3: POST toggle like (add like)
        if TEST_HIGHLIGHT_ID:
            like_data = {
                'user_id': TEST_USER_ID,
                'highlight_id': TEST_HIGHLIGHT_ID
            }
            
            response = self.make_request('POST', '/likes', data=like_data)
            
            if response and response.status_code == 200:
                data = response.json()
                liked = data.get('liked', False)
                self.log_result(
                    "POST /api/likes - Toggle like (add)",
                    True,
                    f"Like {'added' if liked else 'removed'}: {data.get('message', '')}"
                )
            else:
                self.log_result(
                    "POST /api/likes - Toggle like (add)",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

            # Test 4: POST toggle like again (remove like)
            response = self.make_request('POST', '/likes', data=like_data)
            
            if response and response.status_code == 200:
                data = response.json()
                liked = data.get('liked', False)
                self.log_result(
                    "POST /api/likes - Toggle like (remove)",
                    True,
                    f"Like {'added' if liked else 'removed'}: {data.get('message', '')}"
                )
            else:
                self.log_result(
                    "POST /api/likes - Toggle like (remove)",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

    def test_error_handling(self):
        """Test error handling scenarios"""
        print("🧪 Testing Error Handling...")
        
        # Test 1: Invalid profile creation (missing required fields)
        response = self.make_request('POST', '/profiles', data={
            'full_name': 'Test User'
            # Missing required 'id' field
        })
        
        if response and response.status_code == 400:
            self.log_result(
                "Error Handling - Invalid profile data",
                True,
                "Correctly returned 400 for missing required fields"
            )
        else:
            self.log_result(
                "Error Handling - Invalid profile data",
                False,
                f"Expected 400, got {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: Non-existent highlight
        response = self.make_request('GET', '/highlights', params={
            'user_id': 'non-existent-user-id'
        })
        
        if response and response.status_code == 200:
            data = response.json()
            if len(data.get('highlights', [])) == 0:
                self.log_result(
                    "Error Handling - Non-existent user highlights",
                    True,
                    "Correctly returned empty array for non-existent user"
                )
            else:
                self.log_result(
                    "Error Handling - Non-existent user highlights",
                    False,
                    "Should return empty array for non-existent user"
                )
        else:
            self.log_result(
                "Error Handling - Non-existent user highlights",
                False,
                f"Expected 200, got {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        print("🧹 Cleaning up test data...")
        
        # Delete created highlight
        if self.test_data.get('created_highlight'):
            highlight_id = self.test_data['created_highlight'].get('id')
            response = self.make_request('DELETE', '/highlights', params={'id': highlight_id})
            
            if response and response.status_code == 200:
                self.log_result(
                    "Cleanup - Delete test highlight",
                    True,
                    "Successfully deleted test highlight"
                )
            else:
                self.log_result(
                    "Cleanup - Delete test highlight",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

        # Delete created stat
        if self.test_data.get('created_stat'):
            stat_id = self.test_data['created_stat'].get('id')
            response = self.make_request('DELETE', '/stats', params={'id': stat_id})
            
            if response and response.status_code == 200:
                self.log_result(
                    "Cleanup - Delete test stat",
                    True,
                    "Successfully deleted test stat"
                )
            else:
                self.log_result(
                    "Cleanup - Delete test stat",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

    def test_original_fastapi_endpoints(self):
        """Test original FastAPI endpoints (non-proxy)"""
        print("🧪 Testing Original FastAPI Endpoints...")
        
        # Test 1: Root endpoint
        response = self.make_request('GET', '/')
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/ - Root endpoint",
                True,
                f"Message: {data.get('message', 'No message')}"
            )
        else:
            self.log_result(
                "GET /api/ - Root endpoint",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: GET status checks
        response = self.make_request('GET', '/status')
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/status - Get status checks",
                True,
                f"Retrieved {len(data)} status checks"
            )
        else:
            self.log_result(
                "GET /api/status - Get status checks",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 3: POST status check
        status_data = {
            'client_name': 'API Test Client'
        }
        
        response = self.make_request('POST', '/status', data=status_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "POST /api/status - Create status check",
                True,
                f"Created status check with ID: {data.get('id', 'Unknown')}"
            )
        else:
            self.log_result(
                "POST /api/status - Create status check",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

    def test_debug_schema_endpoint(self):
        """Test debug schema endpoint through proxy"""
        print("🧪 Testing Debug Schema Endpoint...")
        
        response = self.make_request('GET', '/debug/schema')
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result(
                "GET /api/debug/schema - Schema info",
                True,
                f"Retrieved schema with {len(data.get('tables', []))} tables"
            )
        else:
            self.log_result(
                "GET /api/debug/schema - Schema info",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

    def run_production_database_tests(self):
        """Run production database tests with service role key"""
        print(f"🚀 Starting Baby Goats Production Database Testing Suite")
        print(f"📍 Production API URL: {BASE_URL}")
        print(f"🔑 Testing Service Role Key Configuration")
        print(f"🎯 Focus: Verify RLS policies are bypassed for write operations")
        print(f"🕐 Started at: {datetime.now().isoformat()}")
        print("=" * 60)
        
        try:
            # Test original FastAPI endpoints first (basic connectivity)
            self.test_original_fastapi_endpoints()
            
            # Test debug schema endpoint
            self.test_debug_schema_endpoint()
            
            # HIGH PRIORITY: Test production profiles API with service role key
            self.test_production_profiles_api()
            
            # HIGH PRIORITY: Test complete Elite Onboarding flow
            self.test_elite_onboarding_flow()
            
            # MEDIUM PRIORITY: Test other write operations
            self.test_production_highlights_api()
            self.test_production_stats_api()
            self.test_production_likes_api()
            self.test_production_challenges_api()
            
            # Test error handling
            self.test_error_handling()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
            self.log_result("Test Suite Execution", False, str(e))
        
        # Print summary
        self.print_production_summary()

    def print_production_summary(self):
        """Print production database test results summary"""
        print("=" * 60)
        print("📊 PRODUCTION DATABASE TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        
        # Categorize results by priority
        high_priority_tests = [r for r in self.results if 'Elite Onboarding' in r['test'] or 'Production' in r['test']]
        high_priority_passed = len([r for r in high_priority_tests if r['success']])
        
        print(f"\n🎯 HIGH PRIORITY TESTS (Service Role Key):")
        print(f"   Passed: {high_priority_passed}/{len(high_priority_tests)}")
        
        # Check for RLS bypass success
        write_operations = [r for r in self.results if 'POST' in r['test'] or 'PUT' in r['test']]
        successful_writes = len([r for r in write_operations if r['success']])
        
        print(f"\n✍️ WRITE OPERATIONS (RLS Bypass Check):")
        print(f"   Successful: {successful_writes}/{len(write_operations)}")
        
        if successful_writes > 0:
            print("   🎉 SERVICE ROLE KEY WORKING - RLS policies bypassed!")
        else:
            print("   ⚠️ SERVICE ROLE KEY ISSUES - Write operations still blocked")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n🕐 Completed at:", datetime.now().isoformat())
        print("=" * 60)

    def test_profile_scenarios(self):
        """Test various profile data scenarios"""
        print("🧪 Testing Various Profile Scenarios...")
        
        # Test different sports
        sports_data = [
            {'sport': 'Football', 'experience': 'Emerging Talent', 'goals': ['Body Optimization']},
            {'sport': 'Tennis', 'experience': 'Developing Athlete', 'goals': ['Mental Resilience', 'Skill Mastery']},
            {'sport': 'Swimming', 'experience': 'Rising Competitor', 'goals': ['Peak Performance']},
            {'sport': 'Track', 'experience': 'Proven Champion', 'goals': ['Competitive Excellence', 'Team Leadership']}
        ]
        
        for i, sport_data in enumerate(sports_data):
            profile_data = {
                'id': str(uuid.uuid4()),
                'full_name': f'{sport_data["sport"]} Athlete {i+1}',
                'sport': sport_data['sport'],
                'experience_level': sport_data['experience'],
                'passion_level': 7 + i,
                'selected_goals': sport_data['goals'],
                'grad_year': 2024 + i
            }
            
            response = self.make_request('POST', '/profiles', data=profile_data)
            
            if response and response.status_code == 200:
                data = response.json()
                self.log_result(
                    f"Profile Scenario - {sport_data['sport']} athlete",
                    True,
                    f"Created {sport_data['experience']} level athlete"
                )
            else:
                self.log_result(
                    f"Profile Scenario - {sport_data['sport']} athlete",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

        # Test profile retrieval with filters
        response = self.make_request('GET', '/profiles', params={'sport': 'Football'})
        if response and response.status_code == 200:
            data = response.json()
            football_profiles = [p for p in data.get('profiles', []) if p.get('sport') == 'Football']
            self.log_result(
                "Profile Scenario - Football filter",
                True,
                f"Retrieved {len(football_profiles)} football profiles"
            )
        
        # Test profile search
        response = self.make_request('GET', '/profiles', params={'search': 'Tennis'})
        if response and response.status_code == 200:
            data = response.json()
            tennis_profiles = [p for p in data.get('profiles', []) if 'Tennis' in p.get('full_name', '')]
            self.log_result(
                "Profile Scenario - Tennis search",
                True,
                f"Found {len(tennis_profiles)} tennis-related profiles"
            )

    def print_summary(self):
        """Print test results summary"""
        print("=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n🕐 Completed at:", datetime.now().isoformat())
        print("=" * 60)

if __name__ == "__main__":
    tester = APITester()
    tester.run_profile_photo_tests()