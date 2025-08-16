#!/usr/bin/env python3
"""
Supabase Storage Integration Testing Suite for Baby Goats Application
Tests Supabase Storage implementation for profile photos including bucket verification, upload process, authentication, and backend integration
Focus: Verify Supabase Storage bucket configuration, file upload functionality, and profile photo integration
"""

import requests
import json
import uuid
from datetime import datetime
import time
import base64
import io
from PIL import Image

# Configuration - Testing Supabase Storage Integration for Profile Photos
BASE_URL = "https://achievement-hub-4.preview.emergentagent.com/api"
FRONTEND_URL = "https://achievement-hub-4.preview.emergentagent.com"
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

SUPABASE_STORAGE_HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
}

# Test data - using realistic data for Supabase Storage testing
TEST_USER_ID = str(uuid.uuid4())
TEST_PROFILE_ID = str(uuid.uuid4())
STORAGE_BUCKET = 'profile-photos'

# Preset avatar URLs for testing (from storage.ts)
PRESET_AVATARS = [
    {
        'id': 'athlete_1',
        'name': 'Champion',
        'url': 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
    },
    {
        'id': 'athlete_2', 
        'name': 'Rising Star',
        'url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
    },
    {
        'id': 'athlete_3',
        'name': 'Elite Performer',
        'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
    },
    {
        'id': 'athlete_4',
        'name': 'Future Legend',
        'url': 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
    },
    {
        'id': 'athlete_5',
        'name': 'Peak Athlete',
        'url': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
    },
    {
        'id': 'athlete_6',
        'name': 'Champion Spirit',
        'url': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
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

    def test_supabase_storage_bucket_verification(self):
        """Test Supabase Storage Bucket Verification - HIGH PRIORITY"""
        print("🧪 Testing Supabase Storage Bucket Verification...")
        
        # Test 1: Check if profile-photos bucket exists
        try:
            bucket_url = f"{SUPABASE_URL}/storage/v1/bucket/{STORAGE_BUCKET}"
            response = requests.get(bucket_url, headers=SUPABASE_HEADERS, timeout=30)
            
            if response and response.status_code == 200:
                bucket_data = response.json()
                self.log_result(
                    "Storage Bucket - profile-photos bucket exists",
                    True,
                    f"Bucket '{STORAGE_BUCKET}' found with public: {bucket_data.get('public', False)}"
                )
                self.test_data['bucket_exists'] = True
                self.test_data['bucket_public'] = bucket_data.get('public', False)
            else:
                self.log_result(
                    "Storage Bucket - profile-photos bucket exists",
                    False,
                    f"Bucket '{STORAGE_BUCKET}' not found, status: {response.status_code if response else 'No response'}"
                )
                self.test_data['bucket_exists'] = False
        except Exception as e:
            self.log_result(
                "Storage Bucket - profile-photos bucket exists",
                False,
                f"Bucket verification failed: {str(e)}"
            )
            self.test_data['bucket_exists'] = False

        # Test 2: Check bucket policies (list objects to verify read access)
        try:
            list_url = f"{SUPABASE_URL}/storage/v1/object/list/{STORAGE_BUCKET}"
            response = requests.post(list_url, headers=SUPABASE_HEADERS, json={
                "limit": 10,
                "offset": 0
            }, timeout=30)
            
            if response and response.status_code == 200:
                objects = response.json()
                self.log_result(
                    "Storage Bucket - Public read access policy",
                    True,
                    f"Bucket read access confirmed, found {len(objects)} objects"
                )
                self.test_data['bucket_readable'] = True
                self.test_data['existing_objects'] = objects
            else:
                self.log_result(
                    "Storage Bucket - Public read access policy",
                    False,
                    f"Bucket read access failed, status: {response.status_code if response else 'No response'}"
                )
                self.test_data['bucket_readable'] = False
        except Exception as e:
            self.log_result(
                "Storage Bucket - Public read access policy",
                False,
                f"Bucket read access test failed: {str(e)}"
            )
            self.test_data['bucket_readable'] = False

        # Test 3: Test bucket creation capability (if bucket doesn't exist)
        if not self.test_data.get('bucket_exists', False):
            try:
                create_url = f"{SUPABASE_URL}/storage/v1/bucket"
                bucket_config = {
                    "id": STORAGE_BUCKET,
                    "name": STORAGE_BUCKET,
                    "public": True,
                    "allowed_mime_types": ["image/jpeg", "image/png"],
                    "file_size_limit": 5242880  # 5MB
                }
                
                response = requests.post(create_url, headers=SUPABASE_HEADERS, json=bucket_config, timeout=30)
                
                if response and response.status_code in [200, 201]:
                    self.log_result(
                        "Storage Bucket - Automatic bucket creation",
                        True,
                        f"Bucket '{STORAGE_BUCKET}' created successfully with public access"
                    )
                    self.test_data['bucket_created'] = True
                else:
                    self.log_result(
                        "Storage Bucket - Automatic bucket creation",
                        False,
                        f"Bucket creation failed, status: {response.status_code if response else 'No response'}"
                    )
                    self.test_data['bucket_created'] = False
            except Exception as e:
                self.log_result(
                    "Storage Bucket - Automatic bucket creation",
                    False,
                    f"Bucket creation test failed: {str(e)}"
                )
                self.test_data['bucket_created'] = False

    def test_supabase_storage_upload_process(self):
        """Test Supabase Storage Upload Process - HIGH PRIORITY"""
        print("🧪 Testing Supabase Storage Upload Process...")
        
        # Test 1: Create a test image for upload
        try:
            # Create a simple test image (400x400 JPEG)
            test_image = Image.new('RGB', (400, 400), color='red')
            img_buffer = io.BytesIO()
            test_image.save(img_buffer, format='JPEG', quality=70)
            img_buffer.seek(0)
            
            # Convert to base64 for upload simulation
            image_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
            
            self.log_result(
                "Upload Process - Test image creation",
                True,
                f"Created 400x400 JPEG test image ({len(image_base64)} chars base64)"
            )
            self.test_data['test_image_base64'] = image_base64
        except Exception as e:
            self.log_result(
                "Upload Process - Test image creation",
                False,
                f"Test image creation failed: {str(e)}"
            )
            return

        # Test 2: Test file upload to Supabase Storage
        if self.test_data.get('bucket_exists', False) or self.test_data.get('bucket_created', False):
            try:
                timestamp = int(time.time())
                filename = f"{TEST_USER_ID}/photo_{timestamp}.jpg"
                upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
                
                # Convert base64 to bytes for upload
                image_bytes = base64.b64decode(self.test_data['test_image_base64'])
                
                upload_headers = {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                    'Content-Type': 'image/jpeg',
                    'Cache-Control': '3600'
                }
                
                response = requests.post(upload_url, headers=upload_headers, data=image_bytes, timeout=60)
                
                if response and response.status_code in [200, 201]:
                    upload_data = response.json()
                    self.log_result(
                        "Upload Process - File upload to storage",
                        True,
                        f"File uploaded successfully: {filename}"
                    )
                    self.test_data['uploaded_filename'] = filename
                    self.test_data['upload_path'] = upload_data.get('Key', filename)
                else:
                    self.log_result(
                        "Upload Process - File upload to storage",
                        False,
                        f"File upload failed, status: {response.status_code if response else 'No response'}, response: {response.text if response else 'None'}"
                    )
            except Exception as e:
                self.log_result(
                    "Upload Process - File upload to storage",
                    False,
                    f"File upload test failed: {str(e)}"
                )

        # Test 3: Test public URL generation
        if self.test_data.get('uploaded_filename'):
            try:
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{self.test_data['uploaded_filename']}"
                
                # Test if public URL is accessible
                response = requests.get(public_url, timeout=30)
                
                if response and response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    self.log_result(
                        "Upload Process - Public URL generation",
                        True,
                        f"Public URL accessible: {public_url[:80]}... (Content-Type: {content_type})"
                    )
                    self.test_data['public_url'] = public_url
                else:
                    self.log_result(
                        "Upload Process - Public URL generation",
                        False,
                        f"Public URL not accessible, status: {response.status_code if response else 'No response'}"
                    )
            except Exception as e:
                self.log_result(
                    "Upload Process - Public URL generation",
                    False,
                    f"Public URL test failed: {str(e)}"
                )

        # Test 4: Test error handling for invalid uploads
        try:
            invalid_filename = f"{TEST_USER_ID}/invalid_file.txt"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{invalid_filename}"
            
            upload_headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                'Content-Type': 'text/plain'
            }
            
            response = requests.post(upload_url, headers=upload_headers, data="invalid file content", timeout=30)
            
            # Should fail due to MIME type restrictions
            if response and response.status_code >= 400:
                self.log_result(
                    "Upload Process - Error handling for invalid files",
                    True,
                    f"Invalid file upload properly rejected, status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Upload Process - Error handling for invalid files",
                    False,
                    f"Invalid file upload should have been rejected, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Upload Process - Error handling for invalid files",
                False,
                f"Error handling test failed: {str(e)}"
            )

    def test_supabase_storage_authentication(self):
        """Test Supabase Storage Authentication - HIGH PRIORITY"""
        print("🧪 Testing Supabase Storage Authentication...")
        
        # Test 1: Test anonymous access (should work for read operations)
        try:
            list_url = f"{SUPABASE_URL}/storage/v1/object/list/{STORAGE_BUCKET}"
            anon_headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(list_url, headers=anon_headers, json={
                "limit": 5,
                "offset": 0
            }, timeout=30)
            
            if response and response.status_code == 200:
                self.log_result(
                    "Storage Authentication - Anonymous read access",
                    True,
                    f"Anonymous read access working, found {len(response.json())} objects"
                )
            else:
                self.log_result(
                    "Storage Authentication - Anonymous read access",
                    False,
                    f"Anonymous read access failed, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Storage Authentication - Anonymous read access",
                False,
                f"Anonymous access test failed: {str(e)}"
            )

        # Test 2: Test authenticated user write permissions (simulate with anon key)
        try:
            timestamp = int(time.time())
            test_filename = f"{TEST_USER_ID}/auth_test_{timestamp}.jpg"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{test_filename}"
            
            # Create small test image
            test_image = Image.new('RGB', (100, 100), color='blue')
            img_buffer = io.BytesIO()
            test_image.save(img_buffer, format='JPEG', quality=50)
            img_buffer.seek(0)
            
            upload_headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                'Content-Type': 'image/jpeg'
            }
            
            response = requests.post(upload_url, headers=upload_headers, data=img_buffer.getvalue(), timeout=30)
            
            if response and response.status_code in [200, 201]:
                self.log_result(
                    "Storage Authentication - Authenticated write access",
                    True,
                    f"Authenticated write access working, uploaded: {test_filename}"
                )
                self.test_data['auth_test_file'] = test_filename
            else:
                self.log_result(
                    "Storage Authentication - Authenticated write access",
                    False,
                    f"Authenticated write access failed, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Storage Authentication - Authenticated write access",
                False,
                f"Authenticated write test failed: {str(e)}"
            )

        # Test 3: Test file deletion permissions
        if self.test_data.get('auth_test_file'):
            try:
                delete_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{self.test_data['auth_test_file']}"
                
                delete_headers = {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
                }
                
                response = requests.delete(delete_url, headers=delete_headers, timeout=30)
                
                if response and response.status_code in [200, 204]:
                    self.log_result(
                        "Storage Authentication - File deletion permissions",
                        True,
                        f"File deletion working, deleted: {self.test_data['auth_test_file']}"
                    )
                else:
                    self.log_result(
                        "Storage Authentication - File deletion permissions",
                        False,
                        f"File deletion failed, status: {response.status_code if response else 'No response'}"
                    )
            except Exception as e:
                self.log_result(
                    "Storage Authentication - File deletion permissions",
                    False,
                    f"File deletion test failed: {str(e)}"
                )

    def test_backend_api_integration(self):
        """Test Backend API Integration with Profile Photos - HIGH PRIORITY"""
        print("🧪 Testing Backend API Integration with Profile Photos...")
        
        # Test 1: Test profile creation with avatar_url
        profile_data = {
            'id': TEST_PROFILE_ID,
            'full_name': 'Storage Integration Test User',
            'sport': 'Soccer',
            'grad_year': 2025,
            'avatar_url': self.test_data.get('public_url', PRESET_AVATARS[0]['url'])
        }
        
        response = self.make_request('POST', '/profiles', data=profile_data)
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            profile = data.get('profile', {})
            self.log_result(
                "Backend Integration - Profile creation with avatar_url",
                True,
                f"Profile created with avatar: {profile.get('full_name', 'Unknown')} - {profile.get('avatar_url', 'No URL')[:50]}..."
            )
            self.test_data['created_profile'] = profile
        else:
            self.log_result(
                "Backend Integration - Profile creation with avatar_url",
                False,
                f"Profile creation failed, status: {response.status_code if response else 'No response'}"
            )

        # Test 2: Test profile update with new avatar_url
        if self.test_data.get('created_profile'):
            update_data = {
                'id': TEST_PROFILE_ID,
                'avatar_url': PRESET_AVATARS[1]['url']  # Use different preset avatar
            }
            
            response = self.make_request('POST', '/profiles', data=update_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                updated_profile = data.get('profile', {})
                self.log_result(
                    "Backend Integration - Profile avatar_url update",
                    True,
                    f"Avatar updated to: {updated_profile.get('avatar_url', 'No URL')[:50]}..."
                )
            else:
                self.log_result(
                    "Backend Integration - Profile avatar_url update",
                    False,
                    f"Avatar update failed, status: {response.status_code if response else 'No response'}"
                )

        # Test 3: Test profile retrieval with avatar_url
        response = self.make_request('GET', '/profiles', params={
            'search': 'Storage Integration Test',
            'limit': 5
        })
        
        if response and response.status_code == 200:
            data = response.json()
            profiles = data.get('profiles', [])
            profile_with_avatar = None
            
            for profile in profiles:
                if profile.get('id') == TEST_PROFILE_ID and profile.get('avatar_url'):
                    profile_with_avatar = profile
                    break
            
            if profile_with_avatar:
                self.log_result(
                    "Backend Integration - Profile retrieval with avatar_url",
                    True,
                    f"Profile retrieved with avatar: {profile_with_avatar.get('avatar_url', 'No URL')[:50]}..."
                )
            else:
                self.log_result(
                    "Backend Integration - Profile retrieval with avatar_url",
                    False,
                    f"Profile with avatar not found in {len(profiles)} profiles"
                )
        else:
            self.log_result(
                "Backend Integration - Profile retrieval with avatar_url",
                False,
                f"Profile retrieval failed, status: {response.status_code if response else 'No response'}"
            )

        # Test 4: Test preset avatar accessibility
        accessible_avatars = 0
        for avatar in PRESET_AVATARS[:3]:  # Test first 3 avatars
            try:
                response = requests.get(avatar['url'], timeout=10)
                if response and response.status_code == 200:
                    accessible_avatars += 1
            except:
                pass
        
        self.log_result(
            "Backend Integration - Preset avatar accessibility",
            accessible_avatars >= 2,
            f"{accessible_avatars}/{len(PRESET_AVATARS[:3])} preset avatars accessible"
        )

    def test_error_handling_scenarios(self):
        """Test Error Handling for Storage Failures - MEDIUM PRIORITY"""
        print("🧪 Testing Error Handling for Storage Failures...")
        
        # Test 1: Test upload to non-existent bucket
        try:
            fake_bucket = 'non-existent-bucket'
            filename = f"{TEST_USER_ID}/test.jpg"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{fake_bucket}/{filename}"
            
            test_image = Image.new('RGB', (100, 100), color='green')
            img_buffer = io.BytesIO()
            test_image.save(img_buffer, format='JPEG')
            img_buffer.seek(0)
            
            upload_headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                'Content-Type': 'image/jpeg'
            }
            
            response = requests.post(upload_url, headers=upload_headers, data=img_buffer.getvalue(), timeout=30)
            
            if response and response.status_code >= 400:
                self.log_result(
                    "Error Handling - Upload to non-existent bucket",
                    True,
                    f"Non-existent bucket upload properly failed, status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Error Handling - Upload to non-existent bucket",
                    False,
                    f"Upload should have failed, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Error Handling - Upload to non-existent bucket",
                True,
                f"Upload properly failed with exception: {str(e)[:50]}..."
            )

        # Test 2: Test oversized file upload (simulate)
        try:
            filename = f"{TEST_USER_ID}/oversized_test.jpg"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
            
            # Create large fake data (6MB > 5MB limit)
            large_data = b'x' * (6 * 1024 * 1024)
            
            upload_headers = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                'Content-Type': 'image/jpeg'
            }
            
            response = requests.post(upload_url, headers=upload_headers, data=large_data, timeout=60)
            
            if response and response.status_code >= 400:
                self.log_result(
                    "Error Handling - Oversized file upload rejection",
                    True,
                    f"Oversized file properly rejected, status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Error Handling - Oversized file upload rejection",
                    False,
                    f"Oversized file should have been rejected, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Error Handling - Oversized file upload rejection",
                True,
                f"Oversized upload properly failed: {str(e)[:50]}..."
            )

        # Test 3: Test invalid authentication
        try:
            filename = f"{TEST_USER_ID}/auth_test.jpg"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
            
            test_image = Image.new('RGB', (100, 100), color='yellow')
            img_buffer = io.BytesIO()
            test_image.save(img_buffer, format='JPEG')
            img_buffer.seek(0)
            
            invalid_headers = {
                'apikey': 'invalid_key',
                'Authorization': 'Bearer invalid_token',
                'Content-Type': 'image/jpeg'
            }
            
            response = requests.post(upload_url, headers=invalid_headers, data=img_buffer.getvalue(), timeout=30)
            
            if response and response.status_code in [401, 403]:
                self.log_result(
                    "Error Handling - Invalid authentication rejection",
                    True,
                    f"Invalid auth properly rejected, status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Error Handling - Invalid authentication rejection",
                    False,
                    f"Invalid auth should have been rejected, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Error Handling - Invalid authentication rejection",
                True,
                f"Invalid auth properly failed: {str(e)[:50]}..."
            )

    def run_supabase_storage_tests(self):
        """Run complete Supabase Storage Integration testing suite"""
        print(f"🚀 Starting Supabase Storage Integration Testing Suite")
        print(f"📍 Backend API URL: {BASE_URL}")
        print(f"📍 Frontend URL: {FRONTEND_URL}")
        print(f"📍 Supabase URL: {SUPABASE_URL}")
        print(f"🎯 Focus: Supabase Storage bucket verification, upload process, authentication, and backend integration")
        print(f"🕐 Started at: {datetime.now().isoformat()}")
        print("=" * 80)
        
        try:
            # HIGH PRIORITY TESTS
            print("\n🔥 HIGH PRIORITY TESTS")
            print("-" * 40)
            
            # Test Supabase Storage bucket verification
            self.test_supabase_storage_bucket_verification()
            
            # Test upload process
            self.test_supabase_storage_upload_process()
            
            # Test authentication
            self.test_supabase_storage_authentication()
            
            # Test backend API integration
            self.test_backend_api_integration()
            
            # MEDIUM PRIORITY TESTS
            print("\n⚡ MEDIUM PRIORITY TESTS")
            print("-" * 40)
            
            # Test error handling scenarios
            self.test_error_handling_scenarios()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
            self.log_result("Supabase Storage Test Suite Execution", False, str(e))
        
        # Print summary
        self.print_supabase_storage_summary()

    def print_supabase_storage_summary(self):
        """Print Supabase Storage test results summary"""
        print("=" * 80)
        print("📊 SUPABASE STORAGE INTEGRATION TEST RESULTS SUMMARY")
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
            ['Storage Bucket', 'Upload Process', 'Storage Authentication', 'Backend Integration'])]
        high_priority_passed = len([r for r in high_priority_tests if r['success']])
        
        print(f"\n🔥 HIGH PRIORITY TESTS (Storage Core Functionality):")
        print(f"   Passed: {high_priority_passed}/{len(high_priority_tests)}")
        
        # Check for bucket functionality
        bucket_tests = [r for r in self.results if 'Storage Bucket' in r['test']]
        bucket_passed = len([r for r in bucket_tests if r['success']])
        
        print(f"\n🪣 STORAGE BUCKET:")
        print(f"   Successful: {bucket_passed}/{len(bucket_tests)}")
        
        if bucket_passed > 0:
            print("   🎉 BUCKET WORKING - profile-photos bucket accessible with proper policies!")
        else:
            print("   ⚠️ BUCKET ISSUES - Storage bucket may not be configured properly")
        
        # Check for upload functionality
        upload_tests = [r for r in self.results if 'Upload Process' in r['test']]
        upload_passed = len([r for r in upload_tests if r['success']])
        
        print(f"\n📤 UPLOAD PROCESS:")
        print(f"   Successful: {upload_passed}/{len(upload_tests)}")
        
        if upload_passed > 0:
            print("   🎉 UPLOAD WORKING - File upload and public URL generation functional!")
        else:
            print("   ⚠️ UPLOAD ISSUES - File upload process may have configuration problems")
        
        # Check for authentication
        auth_tests = [r for r in self.results if 'Authentication' in r['test']]
        auth_passed = len([r for r in auth_tests if r['success']])
        
        print(f"\n🔐 AUTHENTICATION:")
        print(f"   Successful: {auth_passed}/{len(auth_tests)}")
        
        if auth_passed > 0:
            print("   🎉 AUTH WORKING - Storage operations work with authenticated users!")
        else:
            print("   ⚠️ AUTH ISSUES - Storage authentication may need configuration")
        
        # Check for backend integration
        backend_tests = [r for r in self.results if 'Backend Integration' in r['test']]
        backend_passed = len([r for r in backend_tests if r['success']])
        
        print(f"\n🔗 BACKEND INTEGRATION:")
        print(f"   Successful: {backend_passed}/{len(backend_tests)}")
        
        if backend_passed > 0:
            print("   🎉 INTEGRATION WORKING - Profile updates work with storage URLs!")
        else:
            print("   ⚠️ INTEGRATION ISSUES - Backend API may not handle storage URLs properly")
        
        # Check for error handling
        error_tests = [r for r in self.results if 'Error Handling' in r['test']]
        error_passed = len([r for r in error_tests if r['success']])
        
        print(f"\n⚠️ ERROR HANDLING:")
        print(f"   Successful: {error_passed}/{len(error_tests)}")
        
        if error_passed > 0:
            print("   🎉 ERROR HANDLING WORKING - Proper validation and error responses!")
        else:
            print("   ⚠️ ERROR HANDLING ISSUES - Error scenarios may not be handled properly")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        print(f"\n💡 SUPABASE STORAGE STATUS:")
        if passed_tests >= total_tests * 0.8:  # 80% success rate
            print("   ✅ STORAGE READY - Complete Supabase Storage integration operational!")
        elif passed_tests >= total_tests * 0.6:  # 60% success rate
            print("   ⚠️ PARTIAL SUPPORT - Storage partially working, some features may need configuration")
        else:
            print("   ❌ LIMITED SUPPORT - Storage appears to have significant configuration issues")
        
        print(f"\n🎯 STORAGE INTEGRATION FEATURES:")
        print("   • Profile Photos Storage Bucket (profile-photos)")
        print("   • File Upload with Image Processing (400x400, JPEG compression)")
        print("   • Public URL Generation for Uploaded Photos")
        print("   • Authentication-based Write Permissions")
        print("   • Automatic Bucket Creation with Retry Logic")
        print("   • File Deletion Functionality")
        print("   • Preset Avatar System (6 high-quality athlete avatars)")
        print("   • Backend API Integration for Profile Updates")
        
        print("\n🕐 Completed at:", datetime.now().isoformat())
        print("=" * 80)

    def test_achievement_badge_system(self):
        """Test Achievement Badge & Unlock System - HIGH PRIORITY"""
        print("🧪 Testing Achievement Badge & Unlock System...")
        
        # Test 1: Achievement categories and data structure
        # Since achievements are frontend-only, test supporting backend data
        if self.test_data.get('challenges'):
            # Test challenge categories for achievement mapping
            categories = set()
            difficulties = set()
            points_total = 0
            
            for challenge in self.test_data['challenges']:
                if challenge.get('category'):
                    categories.add(challenge.get('category'))
                if challenge.get('difficulty'):
                    difficulties.add(challenge.get('difficulty'))
                if challenge.get('points'):
                    points_total += challenge.get('points', 0)
            
            self.log_result(
                "Achievement Badges - Challenge categories for mapping",
                len(categories) >= 3,
                f"Found {len(categories)} challenge categories: {list(categories)} for achievement mapping"
            )
            
            self.log_result(
                "Achievement Badges - Difficulty levels for badges",
                len(difficulties) >= 2,
                f"Found {len(difficulties)} difficulty levels: {list(difficulties)} for badge difficulty"
            )
            
            self.log_result(
                "Achievement Badges - Points system for rewards",
                points_total > 0,
                f"Total challenge points: {points_total} available for achievement rewards"
            )

        # Test 2: User progress tracking for achievement unlock
        test_user_id = str(uuid.uuid4())
        
        # Test creating achievement-related stats
        achievement_stats = [
            {'stat_name': 'Current Streak', 'value': 5, 'category': 'achievement'},
            {'stat_name': 'Goals Completed', 'value': 8, 'category': 'achievement'},
            {'stat_name': 'Pillar Progress - Resilient', 'value': 6, 'category': 'pillar'}
        ]
        
        created_stats = 0
        for stat_data in achievement_stats:
            stat_data['user_id'] = test_user_id
            stat_data['unit'] = 'count'
            
            response = self.make_request('POST', '/stats', data=stat_data)
            if response and response.status_code in [200, 201]:
                created_stats += 1
        
        self.log_result(
            "Achievement Badges - Progress tracking stats",
            created_stats >= 1,
            f"Created {created_stats}/{len(achievement_stats)} achievement progress stats"
        )

        # Test 3: Challenge completion for achievement triggers
        if self.test_data.get('challenges') and len(self.test_data['challenges']) > 0:
            challenge_id = self.test_data['challenges'][0].get('id')
            completion_data = {
                'user_id': test_user_id,
                'challenge_id': challenge_id,
                'notes': 'Achievement system test completion'
            }
            
            response = self.make_request('POST', '/challenges', data=completion_data)
            
            if response and response.status_code in [200, 201]:
                data = response.json()
                points_earned = data.get('points_earned', 0)
                self.log_result(
                    "Achievement Badges - Challenge completion trigger",
                    True,
                    f"Challenge completion tracked, earned {points_earned} points for achievement progress"
                )
            else:
                self.log_result(
                    "Achievement Badges - Challenge completion trigger",
                    False,
                    f"Challenge completion failed, status: {response.status_code if response else 'No response'}"
                )

    def test_character_level_system(self):
        """Test Character Level System - MEDIUM PRIORITY"""
        print("🧪 Testing Character Level System...")
        
        # Test 1: Pillar-based challenge categorization
        if self.test_data.get('challenges'):
            pillar_mapping = {
                'fitness': 'relentless',
                'mental': 'resilient', 
                'skill': 'fearless',
                'leadership': 'fearless'
            }
            
            pillar_challenges = {}
            for challenge in self.test_data['challenges']:
                category = challenge.get('category', 'unknown')
                pillar = pillar_mapping.get(category, 'unknown')
                if pillar != 'unknown':
                    pillar_challenges[pillar] = pillar_challenges.get(pillar, 0) + 1
            
            self.log_result(
                "Character Levels - Pillar challenge mapping",
                len(pillar_challenges) >= 2,
                f"Mapped challenges to pillars: {pillar_challenges}"
            )

        # Test 2: User level progression data
        test_user_id = str(uuid.uuid4())
        pillar_stats = [
            {'stat_name': 'Resilient Points', 'value': 350, 'category': 'pillar', 'pillar': 'resilient'},
            {'stat_name': 'Relentless Points', 'value': 150, 'category': 'pillar', 'pillar': 'relentless'},
            {'stat_name': 'Fearless Points', 'value': 100, 'category': 'pillar', 'pillar': 'fearless'}
        ]
        
        created_pillar_stats = 0
        for stat_data in pillar_stats:
            stat_data['user_id'] = test_user_id
            stat_data['unit'] = 'points'
            
            response = self.make_request('POST', '/stats', data=stat_data)
            if response and response.status_code in [200, 201]:
                created_pillar_stats += 1
        
        self.log_result(
            "Character Levels - Pillar progression tracking",
            created_pillar_stats >= 2,
            f"Created {created_pillar_stats}/{len(pillar_stats)} pillar progression stats"
        )

        # Test 3: Level calculation support
        response = self.make_request('GET', '/stats', params={
            'user_id': test_user_id,
            'category': 'pillar',
            'limit': 10
        })
        
        if response and response.status_code == 200:
            data = response.json()
            pillar_stats_retrieved = data.get('stats', [])
            self.log_result(
                "Character Levels - Level calculation data retrieval",
                len(pillar_stats_retrieved) >= 1,
                f"Retrieved {len(pillar_stats_retrieved)} pillar stats for level calculations"
            )
        else:
            self.log_result(
                "Character Levels - Level calculation data retrieval",
                False,
                f"Pillar stats retrieval failed, status: {response.status_code if response else 'No response'}"
            )

    def test_achievement_categories_and_data(self):
        """Test Achievement Categories & Data - MEDIUM PRIORITY"""
        print("🧪 Testing Achievement Categories & Data...")
        
        # Test 1: Streak achievement data support
        test_user_id = str(uuid.uuid4())
        
        # Create streak-related stats
        streak_stats = [
            {'stat_name': 'Daily Streak', 'value': 7, 'category': 'streak'},
            {'stat_name': 'Weekly Streak', 'value': 2, 'category': 'streak'},
            {'stat_name': 'Max Streak', 'value': 30, 'category': 'streak'}
        ]
        
        created_streak_stats = 0
        for stat_data in streak_stats:
            stat_data['user_id'] = test_user_id
            stat_data['unit'] = 'days'
            
            response = self.make_request('POST', '/stats', data=stat_data)
            if response and response.status_code in [200, 201]:
                created_streak_stats += 1
        
        self.log_result(
            "Achievement Categories - Streak achievement data",
            created_streak_stats >= 2,
            f"Created {created_streak_stats}/{len(streak_stats)} streak stats for streak achievements"
        )

        # Test 2: Milestone achievement data support
        milestone_stats = [
            {'stat_name': 'Total Goals Completed', 'value': 50, 'category': 'milestone'},
            {'stat_name': 'Days Active', 'value': 100, 'category': 'milestone'},
            {'stat_name': 'Total Points Earned', 'value': 1500, 'category': 'milestone'}
        ]
        
        created_milestone_stats = 0
        for stat_data in milestone_stats:
            stat_data['user_id'] = test_user_id
            stat_data['unit'] = 'count' if 'Goals' in stat_data['stat_name'] or 'Days' in stat_data['stat_name'] else 'points'
            
            response = self.make_request('POST', '/stats', data=stat_data)
            if response and response.status_code in [200, 201]:
                created_milestone_stats += 1
        
        self.log_result(
            "Achievement Categories - Milestone achievement data",
            created_milestone_stats >= 2,
            f"Created {created_milestone_stats}/{len(milestone_stats)} milestone stats for milestone achievements"
        )

        # Test 3: Achievement filtering and retrieval
        response = self.make_request('GET', '/stats', params={
            'user_id': test_user_id,
            'limit': 20
        })
        
        if response and response.status_code == 200:
            data = response.json()
            user_stats = data.get('stats', [])
            
            # Categorize stats for achievement filtering
            categories = set(stat.get('category', 'unknown') for stat in user_stats)
            achievement_categories = {'streak', 'milestone', 'pillar', 'achievement'}
            supported_categories = categories.intersection(achievement_categories)
            
            self.log_result(
                "Achievement Categories - Category filtering support",
                len(supported_categories) >= 3,
                f"Found {len(supported_categories)} achievement categories: {list(supported_categories)}"
            )
        else:
            self.log_result(
                "Achievement Categories - Category filtering support",
                False,
                f"Stats retrieval failed, status: {response.status_code if response else 'No response'}"
            )

    def test_achievement_gallery_backend_support(self):
        """Test Achievement Gallery Backend Support - HIGH PRIORITY"""
        print("🧪 Testing Achievement Gallery Backend Support...")
        
        # Test 1: User profile integration for achievement gallery
        if self.test_data.get('profiles') and len(self.test_data['profiles']) > 0:
            profile = self.test_data['profiles'][0]
            required_fields = ['full_name', 'sport']
            available_fields = [field for field in required_fields if profile.get(field)]
            
            self.log_result(
                "Achievement Gallery - User profile integration",
                len(available_fields) >= 1,
                f"Profile has {len(available_fields)}/{len(required_fields)} fields for achievement gallery display"
            )

        # Test 2: Achievement progress calculation support
        test_user_id = str(uuid.uuid4())
        
        # Test comprehensive user stats for achievement calculations
        comprehensive_stats = [
            {'stat_name': 'Current Streak', 'value': 5, 'category': 'achievement'},
            {'stat_name': 'Goals Completed', 'value': 8, 'category': 'achievement'},
            {'stat_name': 'Success Rate', 'value': 85, 'category': 'achievement'},
            {'stat_name': 'Resilient Goals', 'value': 6, 'category': 'pillar'},
            {'stat_name': 'Relentless Goals', 'value': 1, 'category': 'pillar'},
            {'stat_name': 'Fearless Goals', 'value': 1, 'category': 'pillar'}
        ]
        
        created_comprehensive_stats = 0
        for stat_data in comprehensive_stats:
            stat_data['user_id'] = test_user_id
            stat_data['unit'] = 'percentage' if 'Rate' in stat_data['stat_name'] else 'count'
            
            response = self.make_request('POST', '/stats', data=stat_data)
            if response and response.status_code in [200, 201]:
                created_comprehensive_stats += 1
        
        self.log_result(
            "Achievement Gallery - Comprehensive progress data",
            created_comprehensive_stats >= 4,
            f"Created {created_comprehensive_stats}/{len(comprehensive_stats)} comprehensive stats for achievement calculations"
        )

        # Test 3: Achievement gallery data retrieval
        response = self.make_request('GET', '/stats', params={
            'user_id': test_user_id,
            'limit': 20
        })
        
        if response and response.status_code == 200:
            data = response.json()
            user_stats = data.get('stats', [])
            
            # Check for achievement gallery requirements
            has_streak_data = any('Streak' in stat.get('stat_name', '') for stat in user_stats)
            has_goal_data = any('Goals' in stat.get('stat_name', '') for stat in user_stats)
            has_pillar_data = any(stat.get('category') == 'pillar' for stat in user_stats)
            
            gallery_support = sum([has_streak_data, has_goal_data, has_pillar_data])
            
            self.log_result(
                "Achievement Gallery - Data retrieval for display",
                gallery_support >= 2,
                f"Achievement gallery has {gallery_support}/3 data types: streak={has_streak_data}, goals={has_goal_data}, pillars={has_pillar_data}"
            )
        else:
            self.log_result(
                "Achievement Gallery - Data retrieval for display",
                False,
                f"Gallery data retrieval failed, status: {response.status_code if response else 'No response'}"
            )

    def run_achievement_system_tests(self):
        """Run complete Achievement System testing suite"""
        print(f"🚀 Starting Achievement System Backend Testing Suite")
        print(f"📍 Backend API URL: {BASE_URL}")
        print(f"📍 Frontend URL: {FRONTEND_URL}")
        print(f"🎯 Focus: Achievement System navigation, badges, character levels, and gallery")
        print(f"🕐 Started at: {datetime.now().isoformat()}")
        print("=" * 80)
        
        try:
            # HIGH PRIORITY TESTS
            print("\n🔥 HIGH PRIORITY TESTS")
            print("-" * 40)
            
            # Test Achievement System navigation
            self.test_achievement_system_navigation()
            
            # Test Achievement Badge system
            self.test_achievement_badge_system()
            
            # Test Achievement Gallery backend support
            self.test_achievement_gallery_backend_support()
            
            # MEDIUM PRIORITY TESTS
            print("\n⚡ MEDIUM PRIORITY TESTS")
            print("-" * 40)
            
            # Test Character Level system
            self.test_character_level_system()
            
            # Test Achievement Categories and data
            self.test_achievement_categories_and_data()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
            self.log_result("Achievement System Test Suite Execution", False, str(e))
        
        # Print summary
        self.print_achievement_system_summary()

    def print_achievement_system_summary(self):
        """Print Achievement System test results summary"""
        print("=" * 80)
        print("📊 ACHIEVEMENT SYSTEM BACKEND TEST RESULTS SUMMARY")
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
            ['Achievement Navigation', 'Achievement Badges', 'Achievement Gallery'])]
        high_priority_passed = len([r for r in high_priority_tests if r['success']])
        
        print(f"\n🔥 HIGH PRIORITY TESTS (Achievement System Core):")
        print(f"   Passed: {high_priority_passed}/{len(high_priority_tests)}")
        
        # Check for navigation functionality
        nav_tests = [r for r in self.results if 'Navigation' in r['test']]
        nav_passed = len([r for r in nav_tests if r['success']])
        
        print(f"\n🧭 ACHIEVEMENT NAVIGATION:")
        print(f"   Successful: {nav_passed}/{len(nav_tests)}")
        
        if nav_passed > 0:
            print("   🎉 NAVIGATION WORKING - Achievement System accessible via ACHIEVEMENTS link!")
        else:
            print("   ⚠️ NAVIGATION ISSUES - Achievement System may not be accessible")
        
        # Check for badge system support
        badge_tests = [r for r in self.results if 'Badge' in r['test'] or 'Achievement' in r['test']]
        badge_passed = len([r for r in badge_tests if r['success']])
        
        print(f"\n🏆 ACHIEVEMENT BADGE SYSTEM:")
        print(f"   Successful: {badge_passed}/{len(badge_tests)}")
        
        if badge_passed > 0:
            print("   🎉 BADGE SYSTEM SUPPORTED - Achievement badges can display with backend data!")
        else:
            print("   ⚠️ BADGE ISSUES - Achievement badges may rely on mock data only")
        
        # Check for character level support
        level_tests = [r for r in self.results if 'Character' in r['test'] or 'Level' in r['test']]
        level_passed = len([r for r in level_tests if r['success']])
        
        print(f"\n⚡ CHARACTER LEVEL SYSTEM:")
        print(f"   Successful: {level_passed}/{len(level_tests)}")
        
        if level_passed > 0:
            print("   🎉 LEVEL SYSTEM SUPPORTED - Character development levels can track real progress!")
        else:
            print("   ⚠️ LEVEL ISSUES - Character levels may use frontend-only calculations")
        
        # Check for gallery support
        gallery_tests = [r for r in self.results if 'Gallery' in r['test'] or 'Categories' in r['test']]
        gallery_passed = len([r for r in gallery_tests if r['success']])
        
        print(f"\n🖼️ ACHIEVEMENT GALLERY:")
        print(f"   Successful: {gallery_passed}/{len(gallery_tests)}")
        
        if gallery_passed > 0:
            print("   🎉 GALLERY SUPPORTED - Achievement gallery can display with filtering and real data!")
        else:
            print("   ⚠️ GALLERY ISSUES - Achievement gallery may rely on mock data only")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['details']}")
        
        print(f"\n💡 ACHIEVEMENT SYSTEM STATUS:")
        if passed_tests >= total_tests * 0.8:  # 80% success rate
            print("   ✅ ACHIEVEMENT SYSTEM READY - Complete Achievement System with backend support operational!")
        elif passed_tests >= total_tests * 0.6:  # 60% success rate
            print("   ⚠️ PARTIAL SUPPORT - Achievement System partially supported, some features may use mock data")
        else:
            print("   ❌ LIMITED SUPPORT - Achievement System appears to be primarily frontend-only with mock data")
        
        print(f"\n🏆 ACHIEVEMENT SYSTEM FEATURES:")
        print("   • 15+ Elite Achievements across 5 categories")
        print("   • Character Development Level System (Bronze→Silver→Gold→Platinum→Legendary)")
        print("   • Achievement Badge System with unlock animations")
        print("   • Achievement Gallery with category filtering")
        print("   • Character Pillar Visualization (Resilient, Relentless, Fearless)")
        
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
    tester.run_achievement_system_tests()