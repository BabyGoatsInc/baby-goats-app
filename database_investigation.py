#!/usr/bin/env python3
"""
Database Schema and RLS Policy Investigation
Test direct database access to identify the root cause
"""

import requests
import json

# Test the debug schema endpoint to see what tables exist
def test_database_schema():
    print("🔍 Testing Database Schema...")
    
    try:
        response = requests.get("http://localhost:3001/api/debug/schema", timeout=10)
        if response.status_code == 200:
            schema_data = response.json()
            print("✅ Database connection working")
            print(f"Schema data: {json.dumps(schema_data, indent=2)}")
            
            # Check if social tables exist
            tables = schema_data.get('schema', {}).get('tables', [])
            social_tables = ['friendships', 'teams', 'notifications', 'messages', 'leaderboards']
            
            print("\n📊 Social Tables Status:")
            for table in social_tables:
                exists = table in [t.get('name', '') for t in tables] if isinstance(tables, list) else False
                status = "✅ EXISTS" if exists else "❌ MISSING"
                print(f"  {table}: {status}")
                
        else:
            print(f"❌ Database connection failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")

def test_simple_supabase_query():
    print("\n🔍 Testing Simple Supabase Query...")
    
    # Test a simple query that should work
    try:
        response = requests.get("http://localhost:3001/api/profiles?limit=1", timeout=10)
        print(f"Profiles API Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Profiles API working: {data.get('count', 0)} profiles")
        else:
            print(f"❌ Profiles API failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Profiles test failed: {str(e)}")

def test_environment_variables():
    print("\n🔍 Testing Environment Variables Access...")
    
    # Create a simple test endpoint call to see if env vars are accessible
    test_data = {
        "test": "environment_check"
    }
    
    try:
        # Test with a POST to see if the server can access environment variables
        response = requests.post("http://localhost:3001/api/leaderboards", 
                               json={"user_id": "test", "action": "test"}, 
                               timeout=10)
        print(f"Environment test status: {response.status_code}")
        if response.status_code in [400, 500]:
            print("✅ Server is responding (env vars likely accessible)")
        else:
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Environment test failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Database and Environment Investigation...")
    print("=" * 60)
    
    test_database_schema()
    test_simple_supabase_query()
    test_environment_variables()
    
    print("\n" + "=" * 60)
    print("Investigation complete!")