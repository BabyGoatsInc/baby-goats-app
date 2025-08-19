#!/usr/bin/env python3
"""
Database Error Check - Check specific database errors for social features
"""

import requests
import json
import uuid

BASE_URL = "https://goatyouth.preview.emergentagent.com/api"

def test_specific_endpoints():
    """Test specific endpoints to see exact error messages"""
    
    test_user_id = str(uuid.uuid4())
    
    print("🔍 CHECKING SPECIFIC DATABASE ERRORS")
    print("=" * 50)
    
    # Test messages API
    print("\n📱 Testing Messages API:")
    try:
        response = requests.get(f"{BASE_URL}/messages?user_id={test_user_id}", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
    
    # Test friendships API
    print("\n👥 Testing Friendships API:")
    try:
        response = requests.get(f"{BASE_URL}/friendships?user_id={test_user_id}", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
    
    # Test teams API
    print("\n⚽ Testing Teams API:")
    try:
        response = requests.get(f"{BASE_URL}/teams", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
    
    # Test notifications API
    print("\n🔔 Testing Notifications API:")
    try:
        response = requests.get(f"{BASE_URL}/notifications?user_id={test_user_id}", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
    
    # Test leaderboards API
    print("\n🏆 Testing Leaderboards API:")
    try:
        response = requests.get(f"{BASE_URL}/leaderboards", timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Error text: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_specific_endpoints()