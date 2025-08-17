#!/usr/bin/env python3
"""
Simple Advanced Social Features Database Schema Test
Direct test to validate if the 6 new social features tables exist in the database
"""

import requests
import json

# Configuration
BASE_URL = "https://youthgoat-social.preview.emergentagent.com/api"

def test_social_endpoints():
    """Test if advanced social features endpoints return proper database errors vs 404s"""
    
    endpoints_to_test = [
        ('/messages', 'Messages/Chat System'),
        ('/friendships', 'Friendship Management'),
        ('/leaderboards', 'Leaderboards & Rankings'),
        ('/notifications', 'Notifications System')
    ]
    
    results = []
    
    print("🧪 Testing Advanced Social Features Database Schema...")
    print("=" * 60)
    
    for endpoint, feature_name in endpoints_to_test:
        try:
            # Test with a simple GET request
            url = f"{BASE_URL}{endpoint}?user_id=test-user&limit=1"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 500:
                # Check if it's a database table missing error
                try:
                    error_data = response.json()
                    error_msg = str(error_data.get('error', ''))
                    
                    if 'table' in error_msg.lower() or 'relation' in error_msg.lower():
                        status = "❌ DATABASE TABLE MISSING"
                        details = f"Table does not exist in database"
                    else:
                        status = "⚠️ OTHER DATABASE ERROR"
                        details = f"Database error: {error_msg}"
                except:
                    status = "⚠️ SERVER ERROR"
                    details = "500 error but unknown cause"
                    
            elif response.status_code == 404:
                status = "❌ ENDPOINT NOT FOUND"
                details = "API endpoint not implemented"
                
            elif response.status_code == 200:
                status = "✅ WORKING"
                details = "API endpoint and database table working"
                
            elif response.status_code == 400:
                status = "✅ API EXISTS"
                details = "API exists, likely parameter validation error"
                
            elif response.status_code == 403:
                status = "✅ API EXISTS"
                details = "API exists, authentication/authorization error"
                
            else:
                status = f"⚠️ UNEXPECTED STATUS {response.status_code}"
                details = "Unexpected response"
                
        except requests.exceptions.Timeout:
            status = "❌ TIMEOUT"
            details = "Request timed out"
            
        except requests.exceptions.ConnectionError:
            status = "❌ CONNECTION ERROR"
            details = "Cannot connect to API"
            
        except Exception as e:
            status = "❌ ERROR"
            details = f"Test error: {str(e)}"
        
        results.append({
            'endpoint': endpoint,
            'feature': feature_name,
            'status': status,
            'details': details
        })
        
        print(f"{status}: {feature_name} ({endpoint})")
        print(f"   Details: {details}")
        print()
    
    # Summary
    print("=" * 60)
    print("📊 ADVANCED SOCIAL FEATURES DATABASE SCHEMA TEST SUMMARY")
    print("=" * 60)
    
    working_count = len([r for r in results if 'WORKING' in r['status']])
    api_exists_count = len([r for r in results if 'API EXISTS' in r['status']])
    table_missing_count = len([r for r in results if 'TABLE MISSING' in r['status']])
    
    print(f"Total Endpoints Tested: {len(results)}")
    print(f"✅ Fully Working: {working_count}")
    print(f"✅ API Exists (needs DB): {api_exists_count}")
    print(f"❌ Database Tables Missing: {table_missing_count}")
    print(f"❌ Other Issues: {len(results) - working_count - api_exists_count - table_missing_count}")
    
    print(f"\n🏆 OVERALL ASSESSMENT:")
    if table_missing_count > 0:
        print("   ❌ CRITICAL: Advanced social features database tables are MISSING")
        print("   📋 ACTION REQUIRED: Database schema with 6 new tables needs to be applied")
        print("   📝 Missing tables likely include: messages, friendships, leaderboards, notifications, etc.")
        print("   🔧 SOLUTION: Apply the advanced social features database schema to Supabase")
    elif api_exists_count >= len(results) * 0.8:
        print("   ✅ GOOD: API endpoints exist and are accessible")
        print("   🎯 READY: Once database schema is applied, features should work")
    else:
        print("   ⚠️ MIXED: Some endpoints working, others need attention")
    
    print("=" * 60)
    
    return results

if __name__ == "__main__":
    test_social_endpoints()