#!/usr/bin/env python3
"""
RLS Status Check - Quick verification of API status after RLS policies
"""

import requests
import json
import uuid

BASE_URL = "https://goatyouth.preview.emergentagent.com/api"

def check_api_status(endpoint, params=None, method='GET', data=None):
    """Check API status and return detailed info"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url, params=params, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)
        
        return {
            'status_code': response.status_code,
            'response': response.text[:300],
            'success': response.status_code < 400
        }
    except Exception as e:
        return {
            'status_code': 'ERROR',
            'response': str(e),
            'success': False
        }

def main():
    print("🔍 RLS POLICIES STATUS CHECK")
    print("=" * 50)
    
    # Test social features APIs
    print("\n📱 SOCIAL FEATURES APIs:")
    
    social_apis = [
        ('/messages', {'user_id': 'test'}),
        ('/leaderboards', {'type': 'global'}),
        ('/friendships', {'user_id': 'test'}),
        ('/notifications', {'user_id': 'test'})
    ]
    
    social_working = 0
    for endpoint, params in social_apis:
        result = check_api_status(endpoint, params)
        status = "✅" if result['success'] else "❌"
        print(f"   {status} {endpoint}: {result['status_code']} - {result['response'][:100]}")
        if result['success']:
            social_working += 1
    
    # Test team system APIs
    print("\n👥 TEAM SYSTEM APIs:")
    
    team_apis = [
        ('/teams', {'limit': 10}),
        ('/team-members', {'team_id': 'test'}),
        ('/team-challenges', {'team_id': 'test'})
    ]
    
    team_working = 0
    for endpoint, params in team_apis:
        result = check_api_status(endpoint, params)
        status = "✅" if result['success'] else "❌"
        print(f"   {status} {endpoint}: {result['status_code']} - {result['response'][:100]}")
        if result['success']:
            team_working += 1
    
    # Test regression APIs
    print("\n🔄 REGRESSION APIs:")
    
    regression_apis = [
        ('/profiles', {'limit': 5}),
        ('/challenges', {'limit': 5}),
        ('/stats', {'user_id': 'test'})
    ]
    
    regression_working = 0
    for endpoint, params in regression_apis:
        result = check_api_status(endpoint, params)
        status = "✅" if result['success'] else "❌"
        print(f"   {status} {endpoint}: {result['status_code']} - {result['response'][:100]}")
        if result['success']:
            regression_working += 1
    
    # Summary
    print("\n📊 SUMMARY:")
    print(f"   Social Features: {social_working}/{len(social_apis)} working ({social_working/len(social_apis)*100:.1f}%)")
    print(f"   Team System: {team_working}/{len(team_apis)} working ({team_working/len(team_apis)*100:.1f}%)")
    print(f"   Regression: {regression_working}/{len(regression_apis)} working ({regression_working/len(regression_apis)*100:.1f}%)")
    
    total_working = social_working + team_working + regression_working
    total_apis = len(social_apis) + len(team_apis) + len(regression_apis)
    overall_rate = total_working / total_apis * 100
    
    print(f"\n🎯 OVERALL: {total_working}/{total_apis} APIs working ({overall_rate:.1f}%)")
    
    if overall_rate >= 80:
        print("✅ EXCELLENT: Most APIs working - RLS policies likely applied successfully!")
    elif overall_rate >= 60:
        print("⚠️ PARTIAL: Some progress - RLS policies partially applied")
    else:
        print("❌ CRITICAL: Major issues remain - RLS policies may not be applied correctly")

if __name__ == "__main__":
    main()