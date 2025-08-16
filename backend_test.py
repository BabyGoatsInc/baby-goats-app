#!/usr/bin/env python3
"""
Backend API Testing Suite for Baby Goats Application - Production Database with Service Role Key
Tests production database functionality after implementing service role key configuration
Focus: Verify write operations work directly with Supabase database (bypassing RLS)
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Configuration - Testing production database with service role key
BASE_URL = "https://goat-training-2.preview.emergentagent.com/api"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Test data - using realistic data for Baby Goats app
TEST_USER_ID = str(uuid.uuid4())
TEST_HIGHLIGHT_ID = str(uuid.uuid4())
TEST_CHALLENGE_ID = str(uuid.uuid4())
TEST_STAT_ID = str(uuid.uuid4())

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
                response = requests.get(url, headers=HEADERS, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=HEADERS, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=HEADERS, params=params, timeout=30)
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

    def test_production_profiles_api(self):
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
            self.log_result(
                "GET /api/profiles - Production mode check",
                True,
                f"Production Mode: {production_mode}, Retrieved {len(data.get('profiles', []))} profiles"
            )
            self.test_data['profiles'] = data.get('profiles', [])
        else:
            self.log_result(
                "GET /api/profiles - Production mode check",
                False,
                f"Status: {response.status_code if response else 'No response'}",
                response.json() if response else None
            )

        # Test 2: POST create profile with Elite Onboarding data (CRITICAL TEST)
        elite_profile_data = {
            'id': str(uuid.uuid4()),
            'full_name': 'Elite Production Test Athlete',
            'sport': 'Soccer',
            'experience_level': 'Rising Competitor',
            'passion_level': 9,
            'selected_goals': ['Skill Mastery', 'Mental Resilience', 'Peak Performance'],
            'grad_year': 2026
        }
        
        response = self.make_request('POST', '/profiles', data=elite_profile_data)
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            production_mode = data.get('productionMode', False)
            self.log_result(
                "POST /api/profiles - Elite Onboarding (Production DB)",
                True,
                f"Production Mode: {production_mode}, Created: {data.get('profile', {}).get('full_name', 'Unknown')}"
            )
            self.test_data['elite_profile'] = data.get('profile')
            self.test_data['elite_profile_id'] = elite_profile_data['id']
        else:
            self.log_result(
                "POST /api/profiles - Elite Onboarding (Production DB)",
                False,
                f"Status: {response.status_code if response else 'No response'} - RLS should be bypassed with service role key",
                response.json() if response else None
            )

        # Test 3: Verify profile appears in GET results (persistence check)
        if self.test_data.get('elite_profile_id'):
            response = self.make_request('GET', '/profiles', params={
                'search': 'Elite Production Test',
                'limit': 5
            })
            
            if response and response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                found_profile = any(p.get('id') == self.test_data['elite_profile_id'] for p in profiles)
                self.log_result(
                    "GET /api/profiles - Verify persistence",
                    found_profile,
                    f"Profile {'found' if found_profile else 'NOT found'} in database - persistence {'confirmed' if found_profile else 'FAILED'}"
                )
            else:
                self.log_result(
                    "GET /api/profiles - Verify persistence",
                    False,
                    f"Status: {response.status_code if response else 'No response'}",
                    response.json() if response else None
                )

        # Test 4: PUT update profile (should work with service role key)
        if self.test_data.get('elite_profile_id'):
            update_data = {
                'id': self.test_data['elite_profile_id'],
                'full_name': 'Elite Production Test Athlete - Updated',
                'passion_level': 10,
                'selected_goals': ['Skill Mastery', 'Mental Resilience', 'Peak Performance', 'Competitive Excellence']
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
        
        # Simulate complete Elite Onboarding data
        onboarding_profiles = [
            {
                'id': str(uuid.uuid4()),
                'full_name': 'Sarah Elite Soccer Player',
                'sport': 'Soccer',
                'experience_level': 'Rising Competitor',
                'passion_level': 9,
                'selected_goals': ['Skill Mastery', 'Mental Resilience', 'Peak Performance'],
                'grad_year': 2025
            },
            {
                'id': str(uuid.uuid4()),
                'full_name': 'Marcus Elite Basketball Player',
                'sport': 'Basketball',
                'experience_level': 'Proven Champion',
                'passion_level': 10,
                'selected_goals': ['Team Leadership', 'Competitive Excellence', 'Body Optimization'],
                'grad_year': 2024
            },
            {
                'id': str(uuid.uuid4()),
                'full_name': 'Emma Elite Tennis Player',
                'sport': 'Tennis',
                'experience_level': 'Developing Athlete',
                'passion_level': 8,
                'selected_goals': ['Mental Resilience', 'Skill Mastery'],
                'grad_year': 2026
            }
        ]
        
        created_profiles = []
        
        for profile_data in onboarding_profiles:
            response = self.make_request('POST', '/profiles', data=profile_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                production_mode = data.get('productionMode', False)
                created_profiles.append(data.get('profile'))
                self.log_result(
                    f"Elite Onboarding - {profile_data['sport']} athlete",
                    True,
                    f"Production Mode: {production_mode}, Created: {profile_data['full_name']}"
                )
            else:
                self.log_result(
                    f"Elite Onboarding - {profile_data['sport']} athlete",
                    False,
                    f"Status: {response.status_code if response else 'No response'} - Service role key should bypass RLS",
                    response.json() if response else None
                )
        
        # Verify all profiles can be retrieved
        response = self.make_request('GET', '/profiles', params={'limit': 20})
        if response and response.status_code == 200:
            data = response.json()
            all_profiles = data.get('profiles', [])
            elite_profiles = [p for p in all_profiles if 'Elite' in p.get('full_name', '')]
            self.log_result(
                "Elite Onboarding - Verify all profiles retrievable",
                len(elite_profiles) >= len(created_profiles),
                f"Found {len(elite_profiles)} elite profiles in database"
            )
        
        self.test_data['elite_onboarding_profiles'] = created_profiles

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
    tester.run_all_tests()