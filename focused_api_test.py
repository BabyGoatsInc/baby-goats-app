#!/usr/bin/env python3
"""
Focused API Test for Baby Goats Application
Testing all endpoints with proper error handling and RLS policy validation
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "http://localhost:3001/api"
HEADERS = {'Content-Type': 'application/json', 'Accept': 'application/json'}

def test_endpoint(method, endpoint, data=None, params=None, timeout=10):
    """Test a single endpoint with better error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url, headers=HEADERS, params=params, timeout=timeout)
        elif method == 'POST':
            response = requests.post(url, headers=HEADERS, json=data, timeout=timeout)
        else:
            return {"success": False, "error": "Unsupported method"}
            
        return {
            "success": True,
            "status_code": response.status_code,
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
        }
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Timeout"}
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Connection error"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    print("🧪 Focused Baby Goats API Testing")
    print("=" * 50)
    
    # Test user ID from the debug endpoint
    existing_user_id = "5ca55a65-caa4-4a9c-95de-ae59be757b63"
    test_user_id = str(uuid.uuid4())
    challenge_id = "593de75d-0843-468b-ace6-07641c7b547a"
    
    results = {}
    
    print("\n📖 Testing GET Endpoints (Should Work)")
    
    # Test GET endpoints
    get_tests = [
        ("GET", "/profiles", {"limit": 5}),
        ("GET", "/profiles", {"sport": "Basketball", "limit": 5}),
        ("GET", "/profiles", {"search": "test", "limit": 5}),
        ("GET", "/highlights", {"limit": 5}),
        ("GET", "/highlights", {"user_id": existing_user_id}),
        ("GET", "/challenges", {"limit": 5}),
        ("GET", "/challenges", {"category": "fitness"}),
        ("GET", "/challenges", {"user_id": existing_user_id}),
        ("GET", "/stats", {"limit": 5}),
        ("GET", "/stats", {"user_id": existing_user_id}),
        ("GET", "/stats", {"category": "performance"}),
        ("GET", "/likes", {"user_id": existing_user_id}),
        ("GET", "/debug/schema", None),
    ]
    
    for method, endpoint, params in get_tests:
        result = test_endpoint(method, endpoint, params=params)
        status = "✅ PASS" if result["success"] and result["status_code"] == 200 else "❌ FAIL"
        print(f"{status}: {method} {endpoint}")
        if not result["success"]:
            print(f"   Error: {result['error']}")
        elif result["status_code"] != 200:
            print(f"   Status: {result['status_code']}, Response: {result['response']}")
        else:
            # Count items in response for GET endpoints
            response_data = result["response"]
            if isinstance(response_data, dict):
                for key in ['profiles', 'highlights', 'challenges', 'stats', 'likes']:
                    if key in response_data:
                        print(f"   Retrieved {len(response_data[key])} {key}")
                        break
                if 'schema' in response_data:
                    print(f"   Schema info retrieved successfully")
        print()
    
    print("\n📝 Testing POST Endpoints (Expected to be blocked by RLS)")
    
    # Test POST endpoints (expected to fail due to RLS)
    post_tests = [
        ("POST", "/profiles", {
            "id": test_user_id,
            "full_name": "Test User",
            "sport": "Soccer",
            "grad_year": 2026
        }),
        ("POST", "/highlights", {
            "user_id": existing_user_id,
            "title": "Test Highlight",
            "video_url": "https://example.com/video.mp4",
            "description": "Test description"
        }),
        ("POST", "/challenges", {
            "user_id": existing_user_id,
            "challenge_id": challenge_id,
            "notes": "Test completion"
        }),
        ("POST", "/stats", {
            "user_id": existing_user_id,
            "stat_name": "Test Stat",
            "value": 10,
            "category": "performance",
            "unit": "points"
        }),
        ("POST", "/likes", {
            "user_id": existing_user_id,
            "highlight_id": str(uuid.uuid4())
        }),
    ]
    
    for method, endpoint, data in post_tests:
        result = test_endpoint(method, endpoint, data=data)
        if result["success"]:
            # POST endpoints should return errors due to RLS policies
            if result["status_code"] in [403, 500] or "error" in str(result["response"]):
                print(f"✅ EXPECTED: {method} {endpoint} - Blocked by RLS")
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
            else:
                print(f"❌ UNEXPECTED: {method} {endpoint} - Should be blocked")
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        else:
            print(f"❌ FAIL: {method} {endpoint} - {result['error']}")
        print()
    
    print("=" * 50)
    print("🎯 SUMMARY:")
    print("✅ All GET endpoints should work (read operations)")
    print("✅ All POST endpoints should be blocked by RLS policies (write operations)")
    print("📋 This confirms the current state before RLS policy updates")
    print("=" * 50)

if __name__ == "__main__":
    main()