#!/usr/bin/env python3
"""
Detailed Messages API Testing - Investigate the regression
"""

import requests
import json
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://goatyouth.preview.emergentagent.com/api"

HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

TEST_USER_ID = str(uuid.uuid4())
TEST_FRIEND_ID = str(uuid.uuid4())

def test_messages_api_detailed():
    """Detailed Messages API testing"""
    print("🔍 DETAILED MESSAGES API TESTING")
    print("="*50)
    
    # Test 1: GET /api/messages (no parameters)
    print("\n1. Testing GET /api/messages (no parameters)")
    try:
        response = requests.get(f"{BASE_URL}/messages", headers=HEADERS, timeout=30)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: GET /api/messages?user_id=test
    print("\n2. Testing GET /api/messages?user_id=test")
    try:
        response = requests.get(f"{BASE_URL}/messages?user_id={TEST_USER_ID}", headers=HEADERS, timeout=30)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 3: GET /api/messages?user_id=test&friend_id=test2
    print("\n3. Testing GET /api/messages?user_id=test&friend_id=test2")
    try:
        response = requests.get(f"{BASE_URL}/messages?user_id={TEST_USER_ID}&friend_id={TEST_FRIEND_ID}", headers=HEADERS, timeout=30)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 4: POST /api/messages
    print("\n4. Testing POST /api/messages")
    try:
        message_data = {
            'sender_id': TEST_USER_ID,
            'receiver_id': TEST_FRIEND_ID,
            'content': 'Test message for detailed testing'
        }
        response = requests.post(f"{BASE_URL}/messages", headers=HEADERS, json=message_data, timeout=30)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 5: Compare with working Leaderboards API
    print("\n5. Testing Leaderboards API (should work)")
    try:
        response = requests.get(f"{BASE_URL}/leaderboards", headers=HEADERS, timeout=30)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 6: Test failing APIs
    print("\n6. Testing Friendships API (should fail)")
    try:
        response = requests.get(f"{BASE_URL}/friendships?user_id={TEST_USER_ID}", headers=HEADERS, timeout=30)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_messages_api_detailed()