#!/usr/bin/env python3
"""
Simple Social Features Backend Test
Quick test to check if social features APIs are responding
"""

import requests
import json
import uuid

BASE_URL = "https://goat-realtime.preview.emergentagent.com/api"

def test_endpoint(method, endpoint, data=None, params=None):
    """Test a single endpoint and return detailed response"""
    url = f"{BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers, params=params, timeout=10)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers, params=params, timeout=10)
        
        print(f"✅ {method} {endpoint}")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        print()
        
        return response
        
    except requests.exceptions.Timeout:
        print(f"❌ {method} {endpoint} - TIMEOUT")
        return None
    except Exception as e:
        print(f"❌ {method} {endpoint} - ERROR: {e}")
        return None

if __name__ == "__main__":
    print("🧪 Simple Social Features Backend Test")
    print("=" * 50)
    
    # Test basic endpoint
    test_endpoint('GET', '/')
    
    # Test social features endpoints
    user_id = str(uuid.uuid4())
    
    print("📱 Testing Messages API:")
    test_endpoint('GET', '/messages', params={'user_id': user_id})
    
    print("🤝 Testing Friendships API:")
    test_endpoint('GET', '/friendships', params={'user_id': user_id, 'type': 'friends'})
    
    print("🏆 Testing Leaderboards API:")
    test_endpoint('GET', '/leaderboards', params={'type': 'points'})
    
    print("🔔 Testing Notifications API:")
    test_endpoint('GET', '/notifications', params={'user_id': user_id})
    
    print("🗄️ Testing Database Schema:")
    test_endpoint('GET', '/debug/schema')