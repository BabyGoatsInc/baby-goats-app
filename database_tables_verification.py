#!/usr/bin/env python3
"""
BABY GOATS DATABASE TABLES VERIFICATION
Final verification of database table creation status

This script tests the actual database table status by analyzing API responses
to determine which tables exist and which are missing.
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Configuration
BASE_URL = "https://youthgoat-social.preview.emergentagent.com/api"

HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Test data
TEST_USER_ID = str(uuid.uuid4())

class DatabaseTablesVerifier:
    def __init__(self):
        self.results = []
        self.table_status = {}
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ EXISTS" if success else "❌ MISSING"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=HEADERS, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, headers=HEADERS, json=data, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
            
        except requests.exceptions.Timeout:
            print(f"Request timed out: {method} {url}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"Connection error: {method} {url}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None

    def verify_table_exists(self, table_name, endpoint, params=None):
        """Verify if a database table exists by testing API endpoint"""
        print(f"🔍 Testing {table_name} table via {endpoint}...")
        
        response = self.make_request('GET', endpoint, params=params)
        
        if not response:
            self.table_status[table_name] = {
                'exists': False,
                'status': 'CONNECTION_ERROR',
                'details': 'No response from API'
            }
            self.log_result(f"{table_name} table", False, "Connection error - cannot determine table status")
            return False
        
        # Analyze response to determine table status
        if response.status_code == 200:
            # Table exists and API is working
            try:
                data = response.json()
                if 'success' in data and data['success']:
                    self.table_status[table_name] = {
                        'exists': True,
                        'status': 'EXISTS_AND_WORKING',
                        'details': f'API returned success with data: {json.dumps(data)[:100]}...'
                    }
                    self.log_result(f"{table_name} table", True, f"Table exists and API working - returned {len(str(data))} chars of data")
                    return True
                else:
                    # API responded but with error - table might not exist
                    self.table_status[table_name] = {
                        'exists': False,
                        'status': 'API_ERROR',
                        'details': f'API error: {json.dumps(data)[:100]}...'
                    }
                    self.log_result(f"{table_name} table", False, f"API error suggests table missing: {data.get('error', 'Unknown error')}")
                    return False
            except json.JSONDecodeError:
                self.table_status[table_name] = {
                    'exists': False,
                    'status': 'INVALID_RESPONSE',
                    'details': f'Invalid JSON response: {response.text[:100]}...'
                }
                self.log_result(f"{table_name} table", False, "Invalid JSON response")
                return False
        
        elif response.status_code == 500:
            # Internal server error - likely table doesn't exist
            try:
                error_data = response.json()
                error_message = error_data.get('error', response.text)
                
                # Check for table-related errors
                if any(keyword in error_message.lower() for keyword in ['table', 'relation', 'does not exist', 'not found']):
                    self.table_status[table_name] = {
                        'exists': False,
                        'status': 'TABLE_NOT_FOUND',
                        'details': f'Database error indicates missing table: {error_message}'
                    }
                    self.log_result(f"{table_name} table", False, f"Database error confirms table missing: {error_message}")
                    return False
                else:
                    self.table_status[table_name] = {
                        'exists': None,
                        'status': 'SERVER_ERROR',
                        'details': f'Server error (not table-related): {error_message}'
                    }
                    self.log_result(f"{table_name} table", False, f"Server error (unclear if table exists): {error_message}")
                    return False
            except json.JSONDecodeError:
                self.table_status[table_name] = {
                    'exists': False,
                    'status': 'SERVER_ERROR_NO_JSON',
                    'details': f'500 error with no JSON: {response.text[:100]}...'
                }
                self.log_result(f"{table_name} table", False, "500 error suggests table missing")
                return False
        
        elif response.status_code == 400:
            # Bad request - API exists but needs parameters, table likely exists
            self.table_status[table_name] = {
                'exists': True,
                'status': 'EXISTS_NEEDS_PARAMS',
                'details': f'API exists but needs parameters: {response.text[:100]}...'
            }
            self.log_result(f"{table_name} table", True, "API responds with parameter validation - table exists")
            return True
        
        else:
            # Other status codes
            self.table_status[table_name] = {
                'exists': None,
                'status': f'HTTP_{response.status_code}',
                'details': f'Unexpected status code: {response.text[:100]}...'
            }
            self.log_result(f"{table_name} table", False, f"Unexpected status {response.status_code}")
            return False

    def run_verification(self):
        """Run comprehensive database table verification"""
        print("🎯 BABY GOATS DATABASE TABLES VERIFICATION")
        print("=" * 80)
        print()
        
        # Test essential social tables that should have been created
        essential_tables = [
            ('friendships', '/friendships', {'user_id': TEST_USER_ID}),
            ('teams', '/teams', {'limit': 10}),
            ('notifications', '/notifications', {'user_id': TEST_USER_ID}),
        ]
        
        # Test tables that should already exist and work
        existing_tables = [
            ('messages', '/messages', {'user_id': TEST_USER_ID}),
            ('leaderboards', '/leaderboards', None),
            ('profiles', '/profiles', {'limit': 10}),
            ('challenges', '/challenges', {'limit': 10}),
            ('stats', '/stats', {'user_id': TEST_USER_ID}),
        ]
        
        print("🔍 TESTING ESSENTIAL SOCIAL TABLES (Should be newly created):")
        print("-" * 60)
        essential_working = 0
        for table_name, endpoint, params in essential_tables:
            if self.verify_table_exists(table_name, endpoint, params):
                essential_working += 1
        
        print()
        print("🔍 TESTING EXISTING CORE TABLES (Should already work):")
        print("-" * 60)
        existing_working = 0
        for table_name, endpoint, params in existing_tables:
            if self.verify_table_exists(table_name, endpoint, params):
                existing_working += 1
        
        print()
        print("📊 FINAL DATABASE TABLES STATUS REPORT")
        print("=" * 80)
        
        # Calculate success rates
        essential_total = len(essential_tables)
        existing_total = len(existing_tables)
        total_tables = essential_total + existing_total
        total_working = essential_working + existing_working
        
        essential_rate = (essential_working / essential_total * 100) if essential_total > 0 else 0
        existing_rate = (existing_working / existing_total * 100) if existing_total > 0 else 0
        overall_rate = (total_working / total_tables * 100) if total_tables > 0 else 0
        
        print(f"📈 ESSENTIAL SOCIAL TABLES: {essential_working}/{essential_total} working ({essential_rate:.1f}%)")
        print(f"📈 EXISTING CORE TABLES: {existing_working}/{existing_total} working ({existing_rate:.1f}%)")
        print(f"📈 OVERALL DATABASE STATUS: {total_working}/{total_tables} working ({overall_rate:.1f}%)")
        print()
        
        # Detailed table status
        print("🔍 DETAILED TABLE STATUS:")
        print("-" * 40)
        
        print("Essential Social Tables:")
        for table_name, _, _ in essential_tables:
            status_info = self.table_status.get(table_name, {})
            exists = status_info.get('exists', False)
            status = status_info.get('status', 'UNKNOWN')
            icon = "✅" if exists else "❌" if exists is False else "❓"
            print(f"  {icon} {table_name}: {status}")
        
        print("\nExisting Core Tables:")
        for table_name, _, _ in existing_tables:
            status_info = self.table_status.get(table_name, {})
            exists = status_info.get('exists', False)
            status = status_info.get('status', 'UNKNOWN')
            icon = "✅" if exists else "❌" if exists is False else "❓"
            print(f"  {icon} {table_name}: {status}")
        
        print()
        
        # Final assessment
        if essential_working == essential_total and existing_working >= existing_total * 0.8:
            verdict = "🎉 DATABASE FULLY OPERATIONAL!"
            status = "READY FOR PRODUCTION"
            recommendation = "All essential tables created successfully. Baby Goats social platform ready!"
        elif essential_working >= essential_total * 0.7:
            verdict = "✅ DATABASE MOSTLY OPERATIONAL"
            status = "NEARLY READY"
            recommendation = "Most essential tables working. Minor issues to resolve."
        elif essential_working > 0:
            verdict = "⚠️ DATABASE PARTIALLY OPERATIONAL"
            status = "NEEDS ATTENTION"
            recommendation = "Some essential tables missing. Database schema incomplete."
        else:
            verdict = "❌ DATABASE TABLES NOT CREATED"
            status = "CRITICAL ISSUE"
            recommendation = "Essential social tables not found. Database schema deployment failed."
        
        print(f"🏆 FINAL VERDICT: {verdict}")
        print(f"📋 STATUS: {status}")
        print(f"💡 RECOMMENDATION: {recommendation}")
        print()
        
        # Specific issues found
        missing_tables = []
        error_tables = []
        
        for table_name, status_info in self.table_status.items():
            if status_info.get('exists') is False:
                missing_tables.append(table_name)
            elif status_info.get('exists') is None:
                error_tables.append(table_name)
        
        if missing_tables:
            print(f"❌ MISSING TABLES: {', '.join(missing_tables)}")
        
        if error_tables:
            print(f"❓ TABLES WITH ERRORS: {', '.join(error_tables)}")
        
        return {
            'essential_working': essential_working,
            'essential_total': essential_total,
            'existing_working': existing_working,
            'existing_total': existing_total,
            'overall_rate': overall_rate,
            'verdict': verdict,
            'status': status,
            'recommendation': recommendation,
            'missing_tables': missing_tables,
            'error_tables': error_tables,
            'table_status': self.table_status
        }

def main():
    """Main verification execution"""
    verifier = DatabaseTablesVerifier()
    results = verifier.run_verification()
    
    print("🏁 DATABASE VERIFICATION COMPLETE!")
    print(f"📊 Overall Success Rate: {results['overall_rate']:.1f}%")
    print(f"🎯 Status: {results['status']}")
    
    return results

if __name__ == "__main__":
    main()