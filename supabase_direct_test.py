#!/usr/bin/env python3
"""
Direct Supabase Database Connection Test
Test if the database tables actually exist and are accessible
"""

import requests
import json
import os

# Supabase configuration
SUPABASE_URL = "https://ssdzlzlubzcknkoflgyf.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZHpsemx1Ynpja25rb2ZsZ3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2Nzk5NiwiZXhwIjoyMDcwMzQzOTk2fQ.qLpTC1ugTRUJw-7hLYcoCrKGd5FczieyfIt_5hfkN8c"

def test_table_access(table_name):
    """Test if a table exists and is accessible"""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f"{url}?limit=1", headers=headers, timeout=10)
        print(f"Table '{table_name}': HTTP {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Table exists and accessible - {len(data)} records found")
            return True
        elif response.status_code == 404:
            print(f"  ❌ Table does not exist")
            return False
        else:
            print(f"  ❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Connection error: {str(e)}")
        return False

def main():
    print("🔍 DIRECT SUPABASE DATABASE CONNECTION TEST")
    print("=" * 60)
    print(f"Testing connection to: {SUPABASE_URL}")
    print("=" * 60)
    
    # Test the failing API tables
    failing_tables = ['teams', 'friendships', 'notifications', 'messages']
    working_tables = ['profiles', 'challenges']
    
    print("\n❌ TESTING FAILING API TABLES:")
    failing_results = {}
    for table in failing_tables:
        failing_results[table] = test_table_access(table)
    
    print("\n✅ TESTING WORKING API TABLES:")
    working_results = {}
    for table in working_tables:
        working_results[table] = test_table_access(table)
        
    print("\n📊 SUMMARY:")
    print(f"Failing API tables accessible: {sum(failing_results.values())}/{len(failing_tables)}")
    print(f"Working API tables accessible: {sum(working_results.values())}/{len(working_tables)}")
    
    if sum(failing_results.values()) == 0:
        print("\n🚨 CRITICAL FINDING: All failing API tables are missing from database!")
        print("📋 SOLUTION: Create the missing database tables in Supabase")
    elif sum(failing_results.values()) == len(failing_tables):
        print("\n🤔 UNEXPECTED: All tables exist but APIs still failing")
        print("📋 INVESTIGATION NEEDED: Check API implementation or authentication")
    else:
        print("\n⚠️ PARTIAL: Some tables exist, some don't")
        missing_tables = [table for table, exists in failing_results.items() if not exists]
        print(f"📋 MISSING TABLES: {', '.join(missing_tables)}")

if __name__ == "__main__":
    main()