#!/usr/bin/env python3
"""
Test script to verify QR code fix
"""
import sys
sys.path.insert(0, '.')

from backend.routes.qr_routes import _parse_qr_text

def test_new_qr_format():
    """Test the new SIPETASAN:SP-2025-XXXX format"""
    print("Testing new QR format: SIPETASAN:SP-2025-0042")
    result = _parse_qr_text("SIPETASAN:SP-2025-0042")
    print(f"Result: {result}")
    assert result.get("warga_id_from_kode") == 42, f"Expected 42, got {result.get('warga_id_from_kode')}"
    print("✓ New QR format works!")

def test_old_qr_format():
    """Test the old SI-PETASAN|KODE|NAMA|KELURAHAN|ALAMAT|JENIS|BERAT format"""
    print("\nTesting old QR format: SI-PETASAN|SP-2025-0042|Budi Santoso|Sukamaju|Jl. Mawar|PETE|3.5kg")
    result = _parse_qr_text("SI-PETASAN|SP-2025-0042|Budi Santoso|Sukamaju|Jl. Mawar|PETE|3.5kg")
    print(f"Result: {result}")
    assert result.get("warga_id_from_kode") == 42, f"Expected 42, got {result.get('warga_id_from_kode')}"
    assert result.get("nama") == "Budi Santoso", f"Expected 'Budi Santoso', got {result.get('nama')}"
    assert result.get("kelurahan") == "Sukamaju", f"Expected 'Sukamaju', got {result.get('kelurahan')}"
    print("✓ Old QR format still works!")

def test_various_formats():
    """Test various formats to ensure backward compatibility"""
    test_cases = [
        # (input, expected_warga_id, description)
        ("SIPETASAN:SP-2025-123", 123, "New format simple"),
        ("SIPETASAN:SP-2025-0001", 1, "New format leading zero"),
        ("SIPETASAN:SP-2025-9999", 9999, "New format max 4-digit"),
        ("SI-PETASAN|SP-2025-123|Test User|Sukamaju|Jl. Mawar|PETE|2.5kg", 123, "Old format with all fields"),
        ("SP-2025-456", 456, "Fallback pattern"),
        ("ABC SP-2025-789 DEF", 789, "Pattern in text"),
    ]
    
    for input_qr, expected_id, description in test_cases:
        print(f"\nTesting {description}: {input_qr}")
        result = _parse_qr_text(input_qr)
        actual_id = result.get("warga_id_from_kode")
        print(f"Result: {result}")
        assert actual_id == expected_id, f"Expected {expected_id}, got {actual_id}"
        print(f"✓ {description}")

if __name__ == "__main__":
    print("=== Testing QR Code Format Fix ===")
    try:
        test_new_qr_format()
        test_old_qr_format()
        test_various_formats()
        print("\n✅ All tests passed! QR format fix is working correctly.")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)