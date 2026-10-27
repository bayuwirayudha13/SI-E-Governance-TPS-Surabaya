"""
Test script untuk refresh token system
Jalankan: python test_refresh_token.py
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_result(title, data):
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(json.dumps(data, indent=2))

def test_warga_login():
    """Test login warga dan dapatkan access/refresh token"""
    print("\n[TEST 1] WARGA LOGIN")
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bayuwirayudha84@gmail.com",
            "password": "warga123"
        })
        
        if response.status_code == 200:
            data = response.json()
            print_result("Warga Login Response", {
                "status": "SUCCESS",
                "has_access_token": "access_token" in data,
                "has_refresh_token": "refresh_token" in data,
                "user_role": data.get("user", {}).get("role")
            })
            return data
        else:
            print_result("Warga Login Response", {
                "status": "FAILED",
                "code": response.status_code,
                "error": response.json()
            })
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_admin_login():
    """Test login admin dan dapatkan access/refresh token"""
    print("\n[TEST 2] ADMIN LOGIN")
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@sipetasan.com",
            "password": "admin123"
        }, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print_result("Admin Login Response", {
                "status": "SUCCESS",
                "has_access_token": "access_token" in data,
                "has_refresh_token": "refresh_token" in data,
                "user_role": data.get("user", {}).get("role")
            })
            return data
        else:
            print_result("Admin Login Response", {
                "status": "FAILED",
                "code": response.status_code,
                "error": response.json() if response.text else "No response body"
            })
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_refresh_token(refresh_token):
    """Test refresh token endpoint"""
    print("\n[TEST 3] REFRESH TOKEN")
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        if response.status_code == 200:
            data = response.json()
            print_result("Refresh Token Response", {
                "status": "SUCCESS",
                "has_new_access_token": "access_token" in data,
                "token_type": data.get("token_type"),
                "user_role": data.get("user", {}).get("role")
            })
            return data.get("access_token")
        else:
            print_result("Refresh Token Response", {
                "status": "FAILED",
                "code": response.status_code,
                "error": response.json()
            })
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_protected_endpoint(access_token):
    """Test protected endpoint dengan new access token"""
    print("\n[TEST 4] PROTECTED ENDPOINT (/api/auth/me)")
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_result("Protected Endpoint Response", {
                "status": "SUCCESS",
                "user_role": data.get("role"),
                "email": data.get("email")
            })
            return True
        else:
            print_result("Protected Endpoint Response", {
                "status": "FAILED",
                "code": response.status_code,
                "error": response.json()
            })
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_logout(refresh_token):
    """Test logout endpoint"""
    print("\n[TEST 5] LOGOUT")
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/logout", json={
            "refresh_token": refresh_token
        })
        
        if response.status_code == 200:
            data = response.json()
            print_result("Logout Response", {
                "status": "SUCCESS",
                "message": data.get("message")
            })
            return True
        else:
            print_result("Logout Response", {
                "status": "FAILED",
                "code": response.status_code,
                "error": response.json()
            })
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_invalid_refresh_token():
    """Test refresh token yang invalid"""
    print("\n[TEST 6] INVALID REFRESH TOKEN")
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/refresh", json={
            "refresh_token": "invalid_token_12345"
        })
        
        if response.status_code == 401:
            print_result("Invalid Token Handling", {
                "status": "CORRECT - Got 401",
                "error": response.json().get("detail")
            })
            return True
        else:
            print_result("Invalid Token Handling", {
                "status": "FAILED - Expected 401",
                "code": response.status_code
            })
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_expired_access_token_then_refresh():
    """Test 401 pada protected endpoint, kemudian refresh"""
    print("\n[TEST 7] EXPIRED ACCESS TOKEN -> REFRESH FLOW")
    
    try:
        # Login dulu
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bayuwirayudha84@gmail.com",
            "password": "warga123"
        })
        
        if login_response.status_code != 200:
            print("Failed to login")
            return False
        
        login_data = login_response.json()
        access_token = login_data.get("access_token")
        refresh_token = login_data.get("refresh_token")
        
        # Modify access token agar expired
        fake_expired_token = access_token[:-10] + "0000000000"
        
        # Try access protected endpoint dengan fake token
        headers = {"Authorization": f"Bearer {fake_expired_token}"}
        protected_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        print(f"\nStep 1: Access protected endpoint dengan invalid token")
        print(f"Status: {protected_response.status_code} (expected 401)")
        
        if protected_response.status_code == 401:
            # Refresh token
            refresh_response = requests.post(f"{BASE_URL}/api/auth/refresh", json={
                "refresh_token": refresh_token
            })
            
            print(f"\nStep 2: Refresh token")
            print(f"Status: {refresh_response.status_code} (expected 200)")
            
            if refresh_response.status_code == 200:
                new_data = refresh_response.json()
                new_access_token = new_data.get("access_token")
                
                # Try protected endpoint lagi dengan token baru
                headers = {"Authorization": f"Bearer {new_access_token}"}
                final_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
                
                print(f"\nStep 3: Access protected endpoint dengan token baru")
                print(f"Status: {final_response.status_code} (expected 200)")
                
                print_result("Expired Token Flow", {
                    "step1_401": protected_response.status_code == 401,
                    "step2_refresh_200": refresh_response.status_code == 200,
                    "step3_access_200": final_response.status_code == 200,
                    "overall": "SUCCESS" if final_response.status_code == 200 else "FAILED"
                })
                
                return final_response.status_code == 200
        
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("SI-PETASAN REFRESH TOKEN SYSTEM TEST")
    print("="*60)
    
    # Check backend is running
    try:
        requests.get(f"{BASE_URL}/health", timeout=2)
    except:
        print("\n[ERROR] Backend tidak berjalan di http://localhost:8000")
        print("Jalankan: python backend/main.py")
        return
    
    # Test sequence
    test_invalid_refresh_token()
    
    warga_login = test_warga_login()
    if warga_login:
        refresh_token = warga_login.get("refresh_token")
        access_token = warga_login.get("access_token")
        
        test_protected_endpoint(access_token)
        
        new_access_token = test_refresh_token(refresh_token)
        if new_access_token:
            test_protected_endpoint(new_access_token)
        
        test_logout(refresh_token)
    
    test_expired_access_token_then_refresh()
    
    # Test Admin login & refresh
    admin_login = test_admin_login()
    if admin_login:
        refresh_token = admin_login.get("refresh_token")
        test_refresh_token(refresh_token)
        test_logout(refresh_token)
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
