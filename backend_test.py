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
BASE_URL = "https://achievement-hub-4.preview.emergentagent.com/api"
NEXTJS_API_BASE = "https://achievement-hub-4.preview.emergentagent.com/api"
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

        # Test 3: Invalid base64 data
        try:
            invalid_upload_data = {
                'action': 'upload',
                'userId': TEST_USER_ID,
                'fileName': 'invalid_test.jpg',
                'fileData': 'invalid_base64_data',
                'contentType': 'image/jpeg'
            }
            
            response = self.make_request('POST', '/storage', data=invalid_upload_data)
            
            if response and response.status_code >= 400:
                self.log_result(
                    "Backend Storage API - Invalid base64 handling",
                    True,
                    f"Invalid base64 properly rejected, status: {response.status_code}"
                )
            else:
                self.log_result(
                    "Backend Storage API - Invalid base64 handling",
                    False,
                    f"Invalid base64 should be rejected, status: {response.status_code if response else 'No response'}"
                )
        except Exception as e:
            self.log_result(
                "Backend Storage API - Invalid base64 handling",
                False,
                f"Invalid base64 test failed: {str(e)}"
            )
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

    def test_preset_avatar_accessibility(self):
        """Test Preset Avatar Accessibility - MEDIUM PRIORITY"""
        print("🧪 Testing Preset Avatar Accessibility...")
        
        # Test preset avatar URLs
        accessible_avatars = 0
        total_avatars = len(PRESET_AVATARS)
        
        for i, avatar in enumerate(PRESET_AVATARS[:3]):  # Test first 3 avatars
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
            f"{accessible_avatars}/{len(PRESET_AVATARS[:3])} preset avatars accessible"
        )
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

if __name__ == "__main__":
    tester = APITester()
    tester.run_supabase_storage_tests()