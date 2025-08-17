#!/usr/bin/env python3
"""
Foreign Key Constraint Diagnosis - Identify the exact issue
"""

import requests
import json
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://youthgoat-social.preview.emergentagent.com/api"

HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def test_foreign_key_impact():
    """Test to understand foreign key constraint impact"""
    print("🔍 FOREIGN KEY CONSTRAINT DIAGNOSIS")
    print("="*60)
    
    # Test 1: Check if database tables exist via debug endpoint
    print("\n1. Testing database schema via debug endpoint")
    try:
        response = requests.get(f"{BASE_URL}/debug/schema", headers=HEADERS, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Tables found: {len(data.get('tables', []))}")
            for table in data.get('tables', [])[:10]:  # Show first 10 tables
                print(f"     - {table}")
        else:
            print(f"   Response: {response.text[:300]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Test Messages API with different scenarios
    print("\n2. Testing Messages API scenarios")
    
    # Scenario A: Basic user conversations (works)
    test_user_id = str(uuid.uuid4())
    print(f"\n   A. GET /api/messages?user_id={test_user_id[:8]}...")
    try:
        response = requests.get(f"{BASE_URL}/messages?user_id={test_user_id}", headers=HEADERS, timeout=30)
        print(f"      Status: {response.status_code}")
        print(f"      Response: {response.text[:200]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    # Scenario B: Specific conversation (fails)
    test_friend_id = str(uuid.uuid4())
    print(f"\n   B. GET /api/messages?user_id={test_user_id[:8]}...&friend_id={test_friend_id[:8]}...")
    try:
        response = requests.get(f"{BASE_URL}/messages?user_id={test_user_id}&friend_id={test_friend_id}", headers=HEADERS, timeout=30)
        print(f"      Status: {response.status_code}")
        print(f"      Response: {response.text[:200]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    # Test 3: Compare working vs failing APIs
    print("\n3. Comparing working vs failing APIs")
    
    apis_to_test = [
        ("Leaderboards (working)", "/leaderboards"),
        ("Profiles (working)", "/profiles?limit=1"),
        ("Challenges (working)", "/challenges?limit=1"),
        ("Messages (partial)", f"/messages?user_id={test_user_id}"),
        ("Friendships (failing)", f"/friendships?user_id={test_user_id}"),
        ("Teams (failing)", "/teams?limit=1"),
        ("Notifications (failing)", f"/notifications?user_id={test_user_id}")
    ]
    
    for name, endpoint in apis_to_test:
        print(f"\n   {name}:")
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS, timeout=30)
            print(f"      Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"      Success: {data.get('success', 'N/A')}")
                # Count items in response
                for key in ['leaderboards', 'profiles', 'challenges', 'conversations', 'friends', 'teams', 'notifications']:
                    if key in data:
                        print(f"      {key.title()}: {len(data[key])}")
                        break
            else:
                print(f"      Error: {response.text[:150]}")
        except Exception as e:
            print(f"      Exception: {e}")
    
    # Test 4: Test foreign key constraint specific scenarios
    print("\n4. Testing foreign key constraint scenarios")
    
    # Test creating data that would trigger foreign key constraints
    print("\n   A. Testing friendship creation (requires valid user IDs)")
    try:
        friendship_data = {
            'user_id': test_user_id,
            'friend_id': test_friend_id
        }
        response = requests.post(f"{BASE_URL}/friendships", headers=HEADERS, json=friendship_data, timeout=30)
        print(f"      Status: {response.status_code}")
        print(f"      Response: {response.text[:200]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    print("\n   B. Testing message creation (requires friendship)")
    try:
        message_data = {
            'sender_id': test_user_id,
            'receiver_id': test_friend_id,
            'content': 'Test message for foreign key diagnosis'
        }
        response = requests.post(f"{BASE_URL}/messages", headers=HEADERS, json=message_data, timeout=30)
        print(f"      Status: {response.status_code}")
        print(f"      Response: {response.text[:200]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    # Test 5: Check if the issue is with JOIN operations
    print("\n5. Testing JOIN operation impact")
    
    # The Messages API uses complex JOINs with foreign key references
    # Let's see if simpler queries work vs complex ones
    
    print("\n   A. Simple query (no JOINs) - should work")
    try:
        # This should work as it doesn't use JOINs
        response = requests.get(f"{BASE_URL}/profiles?limit=1", headers=HEADERS, timeout=30)
        print(f"      Status: {response.status_code}")
        print(f"      Success: {response.status_code == 200}")
    except Exception as e:
        print(f"      Error: {e}")
    
    print("\n   B. Complex query (with JOINs) - may fail")
    try:
        # This uses JOINs and foreign key references
        response = requests.get(f"{BASE_URL}/messages?user_id={test_user_id}&friend_id={test_friend_id}", headers=HEADERS, timeout=30)
        print(f"      Status: {response.status_code}")
        print(f"      Success: {response.status_code == 200}")
    except Exception as e:
        print(f"      Error: {e}")
    
    print("\n" + "="*60)
    print("DIAGNOSIS SUMMARY:")
    print("- Messages API works for simple queries (user conversations)")
    print("- Messages API fails for complex queries (specific conversations with JOINs)")
    print("- Friendships, Teams, Notifications APIs completely fail")
    print("- Leaderboards, Profiles, Challenges APIs work normally")
    print("- Issue likely: Foreign key constraints breaking JOIN operations")
    print("="*60)

if __name__ == "__main__":
    test_foreign_key_impact()