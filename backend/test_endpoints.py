#!/usr/bin/env python3
"""
Test chat endpoints tanpa server running.
Simulates API calls directly.
"""
import sys
sys.path.insert(0, '/home/bayu/Documents/SI-E-Governance-TPS-Surabaya/backend')

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Test 1: Health check
print("1. Health check:")
resp = client.get("/health")
print(f"   Status: {resp.status_code}")
print(f"   Data: {resp.json()}")

# Test 2: Create conversation (warga)
print("\n2. Create/get warga conversation:")
token = "demo-token-warga-test"
headers = {"Authorization": f"Bearer {token}"}
resp = client.post("/api/chat/conversations", headers=headers)
print(f"   Status: {resp.status_code}")
if resp.status_code == 200:
    conv_data = resp.json()
    print(f"   Conv ID: {conv_data.get('id')}")
    conv_id = conv_data.get('id')
else:
    print(f"   Error: {resp.text[:100]}")
    conv_id = None

# Test 3: Get messages
if conv_id:
    print(f"\n3. Get messages for conversation {conv_id}:")
    resp = client.get(f"/api/chat/conversations/{conv_id}/messages", headers=headers)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        msgs = resp.json()
        print(f"   Messages: {len(msgs)}")
    else:
        print(f"   Error: {resp.text[:100]}")

# Test 4: List conversations (admin)
print("\n4. List conversations (admin):")
admin_token = "demo-token-admin"
admin_headers = {"Authorization": f"Bearer {admin_token}"}
resp = client.get("/api/chat/admin/conversations", headers=admin_headers)
print(f"   Status: {resp.status_code}")
if resp.status_code == 200:
    convs = resp.json()
    print(f"   Conversations: {len(convs)}")
    for conv in convs[:3]:
        print(f"     - Conv {conv['id']}: {conv['warga_name']}")
else:
    print(f"   Error: {resp.text[:100]}")

# Test 5: Unauthorized access
print("\n5. Unauthorized (no token):")
resp = client.get("/api/chat/conversations/1/messages")
print(f"   Status: {resp.status_code} (expected 401)")

print("\n✓ All endpoint tests completed")
