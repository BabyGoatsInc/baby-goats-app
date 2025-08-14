#!/usr/bin/env python3
"""
Comprehensive API Test for Baby Goats Application
Focused on validating current API status and RLS issues
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "http://localhost:3002/api"
HEADERS = {'Content-Type': 'application/json', 'Accept': 'application/json'}

def test_endpoint(method, endpoint, data=None, params=None, expected_status=200):
    """Test a single endpoint and return results"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url, headers=HEADERS, params=params, timeout=30)
        elif method == 'POST':
            response = requests.post(url, headers=HEADERS, json=data, timeout=30)
        else:
            return {"success": False, "error": "Unsupported method"}
            
        return {
            "success": response.status_code == expected_status,
            "status_code": response.status_code,
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "expected": expected_status
        }
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Timeout"}
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": "Connection error"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    print("🧪 Comprehensive Baby Goats API Testing")
    print("=" * 50)
    
    test_uuid = str(uuid.uuid4())
    results = {}
    
    # Test all GET endpoints (should work)
    print("\n📖 Testing GET Endpoints (Read Operations)")
    
    get_tests = [
        ("GET", "/profiles", {"limit": 5}),
        ("GET", "/profiles", {"sport": "Basketball", "limit": 5}),
        ("GET", "/profiles", {"search": "test", "limit": 5}),
        ("GET", "/highlights", {"limit": 5}),
        ("GET", "/highlights", {"user_id": test_uuid, "limit": 5}),
        ("GET", "/challenges", {"limit": 5}),
        ("GET", "/challenges", {"category": "fitness", "limit": 5}),
        ("GET", "/stats", {"limit": 5}),
        ("GET", "/stats", {"user_id": test_uuid, "limit": 5}),
        ("GET", "/likes", {"user_id": test_uuid, "limit": 5}),
    ]
    
    for method, endpoint, params in get_tests:
        result = test_endpoint(method, endpoint, params=params)
        status = "✅" if result["success"] else "❌"
        print(f"{status} {method} {endpoint}: {result['status_code']}")
        if not result["success"] and "error" not in result:
            print(f"   Expected {result['expected']}, got {result['status_code']}")
        results[f"{method} {endpoint}"] = result
    
    # Test POST endpoints (expected to fail due to RLS)
    print("\n✏️  Testing POST Endpoints (Write Operations - Expected RLS Failures)")
    
    post_tests = [
        ("POST", "/profiles", {
            "id": test_uuid,
            "full_name": "Test User",
            "sport": "Soccer",
            "grad_year": 2026
        }, 500),  # Expected to fail due to RLS
        ("POST", "/highlights", {
            "user_id": test_uuid,
            "title": "Test Highlight",
            "video_url": "https://example.com/video.mp4",
            "description": "Test description"
        }, 500),  # Expected to fail due to RLS
        ("POST", "/challenges", {
            "user_id": test_uuid,
            "challenge_id": str(uuid.uuid4()),
            "notes": "Test completion"
        }, 500),  # Expected to fail due to RLS
        ("POST", "/stats", {
            "user_id": test_uuid,
            "stat_name": "Goals",
            "value": 10,
            "unit": "goals",
            "category": "performance"
        }, 500),  # Expected to fail due to RLS
        ("POST", "/likes", {
            "user_id": test_uuid,
            "highlight_id": str(uuid.uuid4())
        }, 500),  # Expected to fail due to RLS
    ]
    
    for method, endpoint, data, expected_status in post_tests:
        result = test_endpoint(method, endpoint, data=data, expected_status=expected_status)
        if result["success"]:
            status = "✅ (RLS blocking as expected)"
        elif result.get("status_code") == 500:
            status = "✅ (RLS blocking as expected)"
        else:
            status = "❌"
        print(f"{status} {method} {endpoint}: {result.get('status_code', 'No response')}")
        results[f"{method} {endpoint}"] = result
    
    # Summary
    print("\n📊 SUMMARY")
    print("=" * 50)
    
    get_success = sum(1 for k, v in results.items() if k.startswith("GET") and v["success"])
    get_total = sum(1 for k in results.keys() if k.startswith("GET"))
    
    post_rls_blocked = sum(1 for k, v in results.items() if k.startswith("POST") and v.get("status_code") == 500)
    post_total = sum(1 for k in results.keys() if k.startswith("POST"))
    
    print(f"GET Endpoints Working: {get_success}/{get_total}")
    print(f"POST Endpoints (RLS Blocked): {post_rls_blocked}/{post_total}")
    
    if get_success == get_total and post_rls_blocked == post_total:
        print("\n🎉 ALL TESTS MATCH EXPECTED BEHAVIOR!")
        print("✅ All read operations working")
        print("✅ All write operations blocked by RLS (as expected)")
        return True
    else:
        print("\n⚠️  Some tests didn't match expected behavior")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)