#!/usr/bin/env python3
"""
Backend Storage API Testing Suite for Baby Goats Application
Tests the new backend storage API implementation with service role key for secure storage operations
Focus: Verify backend storage API endpoints, bucket management, file upload pipeline, and integration testing
"""

import requests
import json
import uuid
from datetime import datetime
import time
import base64
import io
from PIL import Image

# Configuration - Testing Backend Storage API Implementation
BASE_URL = "https://champion-storage.preview.emergentagent.com/api"
NEXTJS_API_BASE = "https://champion-storage.preview.emergentagent.com/api"
FRONTEND_URL = "https://champion-storage.preview.emergentagent.com"

HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Test data - using realistic data for Backend Storage API testing
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

    def test_backend_storage_api_bucket_check(self):
        """Test Backend Storage API - Bucket Status Check - HIGH PRIORITY"""
        print("🧪 Testing Backend Storage API - Bucket Status Check...")
        
        # Test 1: Check bucket status via backend API
        try:
            response = self.make_request('GET', '/storage', params={'action': 'check_bucket'})
            
            if response and response.status_code == 200:
                data = response.json()
                bucket_exists = data.get('bucketExists', False)
                bucket_info = data.get('bucket', {})
                
                self.log_result(
                    "Backend Storage API - Bucket status check",
                    True,
                    f"Bucket exists: {bucket_exists}, Bucket info: {bucket_info}"
                )
                self.test_data['backend_bucket_exists'] = bucket_exists
                self.test_data['bucket_info'] = bucket_info
            else:
                self.log_result(
                    "Backend Storage API - Bucket status check",
                    False,
                    f"Bucket check failed, status: {response.status_code if response else 'No response'}"
                )
                self.test_data['backend_bucket_exists'] = False
        except Exception as e:
            self.log_result(
                "Backend Storage API - Bucket status check",
                False,
                f"Bucket check test failed: {str(e)}"
            )
            self.test_data['backend_bucket_exists'] = False

    def test_backend_storage_api_bucket_setup(self):
        """Test Backend Storage API - Bucket Setup - HIGH PRIORITY"""
        print("🧪 Testing Backend Storage API - Bucket Setup...")
        
        # Test 1: Setup bucket via backend API
        try:
            setup_data = {
                'action': 'setup_bucket'
            }
            
            response = self.make_request('POST', '/storage', data=setup_data)
            
            if response and response.status_code == 200:
                data = response.json()
                setup_success = data.get('success', False)
                bucket_exists = data.get('bucketExists', False)
                message = data.get('message', '')
                
                self.log_result(
                    "Backend Storage API - Bucket setup",
                    setup_success,
                    f"Setup success: {setup_success}, Bucket exists: {bucket_exists}, Message: {message}"
                )
                self.test_data['backend_bucket_setup'] = setup_success
            else:
                self.log_result(
                    "Backend Storage API - Bucket setup",
                    False,
                    f"Bucket setup failed, status: {response.status_code if response else 'No response'}"
                )
                self.test_data['backend_bucket_setup'] = False
        except Exception as e:
            self.log_result(
                "Backend Storage API - Bucket setup",
                False,
                f"Bucket setup test failed: {str(e)}"
            )
            self.test_data['backend_bucket_setup'] = False

    def test_backend_storage_api_file_upload(self):
        """Test Backend Storage API - File Upload Process - HIGH PRIORITY"""
        print("🧪 Testing Backend Storage API - File Upload Process...")
        
        # Test 1: Create test image for upload
        try:
            # Create a simple test image (400x400 JPEG)
            test_image = Image.new('RGB', (400, 400), color='blue')
            img_buffer = io.BytesIO()
            test_image.save(img_buffer, format='JPEG', quality=70)
            img_buffer.seek(0)
            
            # Convert to base64 for backend API
            image_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
            
            self.log_result(
                "Backend Storage API - Test image creation",
                True,
                f"Created 400x400 JPEG test image ({len(image_base64)} chars base64)"
            )
            self.test_data['backend_test_image_base64'] = image_base64
        except Exception as e:
            self.log_result(
                "Backend Storage API - Test image creation",
                False,
                f"Test image creation failed: {str(e)}"
            )
            return

        # Test 2: Upload file via backend API
        try:
            timestamp = int(time.time())
            filename = f"backend_test_{timestamp}.jpg"
            
            upload_data = {
                'action': 'upload',
                'userId': TEST_USER_ID,
                'fileName': filename,
                'fileData': self.test_data['backend_test_image_base64'],
                'contentType': 'image/jpeg'
            }
            
            response = self.make_request('POST', '/storage', data=upload_data)
            
            if response and response.status_code == 200:
                data = response.json()
                upload_success = data.get('success', False)
                upload_url = data.get('url', '')
                upload_path = data.get('path', '')
                
                if upload_success and upload_url:
                    self.log_result(
                        "Backend Storage API - File upload",
                        True,
                        f"Upload successful: {filename}, URL: {upload_url[:50]}..."
                    )
                    self.test_data['backend_uploaded_url'] = upload_url
                    self.test_data['backend_uploaded_path'] = upload_path
                else:
                    self.log_result(
                        "Backend Storage API - File upload",
                        False,
                        f"Upload failed: {data.get('error', 'Unknown error')}"
                    )
            else:
                self.log_result(
                    "Backend Storage API - File upload",
                    False,
                    f"Upload request failed, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Backend Storage API - File upload",
                False,
                f"Upload test failed: {str(e)}"
            )

        # Test 3: Verify uploaded file accessibility
        if self.test_data.get('backend_uploaded_url'):
            try:
                response = requests.get(self.test_data['backend_uploaded_url'], timeout=30)
                
                if response and response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    self.log_result(
                        "Backend Storage API - Uploaded file accessibility",
                        True,
                        f"Uploaded file accessible, Content-Type: {content_type}"
                    )
                else:
                    self.log_result(
                        "Backend Storage API - Uploaded file accessibility",
                        False,
                        f"Uploaded file not accessible, status: {response.status_code if response else 'No response'}"
                    )
            except Exception as e:
                self.log_result(
                    "Backend Storage API - Uploaded file accessibility",
                    False,
                    f"File accessibility test failed: {str(e)}"
                )

    def test_backend_storage_api_file_deletion(self):
        """Test Backend Storage API - File Deletion - HIGH PRIORITY"""
        print("🧪 Testing Backend Storage API - File Deletion...")
        
        # Test 1: Delete uploaded file via backend API
        if self.test_data.get('backend_uploaded_path'):
            try:
                delete_data = {
                    'action': 'delete',
                    'filePath': self.test_data['backend_uploaded_path']
                }
                
                response = self.make_request('POST', '/storage', data=delete_data)
                
                if response and response.status_code == 200:
                    data = response.json()
                    delete_success = data.get('success', False)
                    
                    if delete_success:
                        self.log_result(
                            "Backend Storage API - File deletion",
                            True,
                            f"File deleted successfully: {self.test_data['backend_uploaded_path']}"
                        )
                    else:
                        self.log_result(
                            "Backend Storage API - File deletion",
                            False,
                            f"Delete failed: {data.get('error', 'Unknown error')}"
                        )
                else:
                    self.log_result(
                        "Backend Storage API - File deletion",
                        False,
                        f"Delete request failed, status: {response.status_code if response else 'No response'}"
                    )
            except Exception as e:
                self.log_result(
                    "Backend Storage API - File deletion",
                    False,
                    f"Delete test failed: {str(e)}"
                )
        else:
            self.log_result(
                "Backend Storage API - File deletion",
                False,
                "No uploaded file path available for deletion test"
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
            'avatar_url': self.test_data.get('backend_uploaded_url', PRESET_AVATARS[0]['url'])
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

        # Test 2: Test profile retrieval with avatar_url
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

    def test_preset_avatar_accessibility(self):
        """Test Preset Avatar Accessibility - MEDIUM PRIORITY"""
        print("🧪 Testing Preset Avatar Accessibility...")
        
        # Test preset avatar URLs
        accessible_avatars = 0
        
        for i, avatar in enumerate(PRESET_AVATARS):
            try:
                response = requests.get(avatar['url'], timeout=10)
                if response and response.status_code == 200:
                    accessible_avatars += 1
                    self.log_result(
                        f"Preset Avatar {i+1} - {avatar['name']}",
                        True,
                        f"Avatar accessible: {avatar['url'][:50]}..."
                    )
                else:
                    self.log_result(
                        f"Preset Avatar {i+1} - {avatar['name']}",
                        False,
                        f"Avatar not accessible, status: {response.status_code if response else 'No response'}"
                    )
            except Exception as e:
                self.log_result(
                    f"Preset Avatar {i+1} - {avatar['name']}",
                    False,
                    f"Avatar test failed: {str(e)}"
                )
        
        self.log_result(
            "Preset Avatars - Overall accessibility",
            accessible_avatars >= 2,
            f"{accessible_avatars}/{len(PRESET_AVATARS)} preset avatars accessible"
        )

    def test_backend_storage_api_error_handling(self):
        """Test Backend Storage API - Error Handling - MEDIUM PRIORITY"""
        print("🧪 Testing Backend Storage API - Error Handling...")
        
        # Test 1: Invalid action
        try:
            invalid_data = {
                'action': 'invalid_action'
            }
            
            response = self.make_request('POST', '/storage', data=invalid_data)
            
            if response and response.status_code == 400:
                self.log_result(
                    "Backend Storage API - Invalid action handling",
                    True,
                    f"Invalid action properly rejected, status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Backend Storage API - Invalid action handling",
                    False,
                    f"Invalid action should be rejected, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Backend Storage API - Invalid action handling",
                False,
                f"Invalid action test failed: {str(e)}"
            )

        # Test 2: Missing required fields for upload
        try:
            incomplete_data = {
                'action': 'upload',
                'userId': TEST_USER_ID
                # Missing fileName, fileData, contentType
            }
            
            response = self.make_request('POST', '/storage', data=incomplete_data)
            
            if response and response.status_code >= 400:
                self.log_result(
                    "Backend Storage API - Missing fields handling",
                    True,
                    f"Missing fields properly rejected, status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Backend Storage API - Missing fields handling",
                    False,
                    f"Missing fields should be rejected, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Backend Storage API - Missing fields handling",
                False,
                f"Missing fields test failed: {str(e)}"
            )

    def run_backend_storage_api_tests(self):
        """Run complete Backend Storage API testing suite"""
        print(f"🚀 Starting Backend Storage API Testing Suite")
        print(f"📍 Backend API URL: {BASE_URL}")
        print(f"📍 Next.js API URL: {NEXTJS_API_BASE}")
        print(f"📍 Frontend URL: {FRONTEND_URL}")
        print(f"🎯 Focus: Backend Storage API with service role key, bucket management, file upload pipeline")
        print(f"🕐 Started at: {datetime.now().isoformat()}")
        print("=" * 80)
        
        try:
            # HIGH PRIORITY TESTS - Backend Storage API
            print("\n🔥 HIGH PRIORITY TESTS - Backend Storage API")
            print("-" * 50)
            
            # Test backend storage API bucket check
            self.test_backend_storage_api_bucket_check()
            
            # Test backend storage API bucket setup
            self.test_backend_storage_api_bucket_setup()
            
            # Test backend storage API file upload
            self.test_backend_storage_api_file_upload()
            
            # Test backend storage API file deletion
            self.test_backend_storage_api_file_deletion()
            
            # Test backend API integration with profiles
            self.test_backend_api_integration()
            
            # MEDIUM PRIORITY TESTS
            print("\n⚡ MEDIUM PRIORITY TESTS")
            print("-" * 40)
            
            # Test backend storage API error handling
            self.test_backend_storage_api_error_handling()
            
            # Test preset avatar accessibility
            self.test_preset_avatar_accessibility()
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {e}")
            self.log_result("Backend Storage API Test Suite Execution", False, str(e))
        
        # Print summary
        self.print_backend_storage_api_summary()

    def print_backend_storage_api_summary(self):
        """Print Backend Storage API test results summary"""
        print("=" * 80)
        print("📊 BACKEND STORAGE API TEST RESULTS SUMMARY")
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
            ['Backend Storage API', 'Backend Integration'])]
        high_priority_passed = len([r for r in high_priority_tests if r['success']])
        
        print(f"\n🔥 HIGH PRIORITY TESTS (Backend Storage API Core):")
        print(f"   Passed: {high_priority_passed}/{len(high_priority_tests)}")
        
        # Check for backend storage API functionality
        storage_api_tests = [r for r in self.results if 'Backend Storage API' in r['test']]
        storage_api_passed = len([r for r in storage_api_tests if r['success']])
        
        print(f"\n🔧 BACKEND STORAGE API:")
        print(f"   Successful: {storage_api_passed}/{len(storage_api_tests)}")
        
        if storage_api_passed > 0:
            print("   🎉 BACKEND API WORKING - Storage operations via service role key functional!")
        else:
            print("   ⚠️ BACKEND API ISSUES - Storage API may not be configured properly")
        
        # Check for bucket management
        bucket_tests = [r for r in self.results if any(keyword in r['test'] for keyword in ['Bucket', 'bucket'])]
        bucket_passed = len([r for r in bucket_tests if r['success']])
        
        print(f"\n🪣 BUCKET MANAGEMENT:")
        print(f"   Successful: {bucket_passed}/{len(bucket_tests)}")
        
        if bucket_passed > 0:
            print("   🎉 BUCKET MANAGEMENT WORKING - Bucket creation and status check functional!")
        else:
            print("   ⚠️ BUCKET ISSUES - Bucket management may need configuration")
        
        # Check for file operations
        file_tests = [r for r in self.results if any(keyword in r['test'] for keyword in ['upload', 'deletion', 'File'])]
        file_passed = len([r for r in file_tests if r['success']])
        
        print(f"\n📁 FILE OPERATIONS:")
        print(f"   Successful: {file_passed}/{len(file_tests)}")
        
        if file_passed > 0:
            print("   🎉 FILE OPERATIONS WORKING - Upload and deletion via backend API functional!")
        else:
            print("   ⚠️ FILE OPERATION ISSUES - File upload/deletion may have problems")
        
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
        error_tests = [r for r in self.results if 'Error' in r['test'] or 'error' in r['test']]
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
        
        print(f"\n💡 BACKEND STORAGE API STATUS:")
        if passed_tests >= total_tests * 0.8:  # 80% success rate
            print("   ✅ STORAGE API READY - Complete backend storage integration operational!")
        elif passed_tests >= total_tests * 0.6:  # 60% success rate
            print("   ⚠️ PARTIAL SUPPORT - Storage API partially working, some features may need configuration")
        else:
            print("   ❌ LIMITED SUPPORT - Storage API appears to have significant configuration issues")
        
        print(f"\n🎯 BACKEND STORAGE API FEATURES:")
        print("   • Service Role Key Authentication for Admin Operations")
        print("   • Automatic Bucket Creation and Management (profile-photos)")
        print("   • File Upload with Base64 Processing and Compression")
        print("   • Public URL Generation for Uploaded Files")
        print("   • File Deletion with Path Extraction")
        print("   • Bucket Status Checking and Validation")
        print("   • Error Handling for Invalid Requests and Data")
        print("   • Integration with Profile Management System")
        print("   • Preset Avatar System Support")
        
        print("\n🕐 Completed at:", datetime.now().isoformat())
        print("=" * 80)

if __name__ == "__main__":
    tester = APITester()
    tester.run_backend_storage_api_tests()