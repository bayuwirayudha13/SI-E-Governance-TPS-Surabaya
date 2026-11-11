#!/usr/bin/env python3
"""
Test script to verify QR code parsing function - final test
"""
import re

def _parse_qr_text(token: str):
    import re
    data = {}
    t = token.strip()
    
    # Format baru: SIPETASAN:QR-0575DACBB78C6DD1 (sangat pendek)
    if t.startswith("SIPETASAN:"):
        parts = t.split(":", 2)
        if len(parts) >= 2:
            kode = parts[1].strip()
            # Ekstrak ID warga dari kode QR (misal: QR-0575DACBB78C6DD1 -> cari angka)
            m = re.search(r"\d+", kode)
            if m:
                try:
                    data["warga_id_from_kode"] = int(m.group())
                except:
                    pass
            # Jika kode mengandung SP-2025-XXXX, ekstrak itu juga
            m = re.search(r"SP-2025-(\d+)", kode)
            if m:
                try:
                    data["warga_id_from_kode"] = int(m.group(1))
                except:
                    pass
        return data

    # Format lama: SI-PETASAN|KODE|NAMA|KELURAHAN|ALAMAT|JENIS|BERAT
    if t.startswith("SI-PETASAN|"):
        parts = t.split("|")
        if len(parts) >= 2 and "SP-2025-" in parts[1]:
            m = re.search(r"SP-2025-(\d+)", parts[1])
            if m:
                try:
                    data["warga_id_from_kode"] = int(m.group(1))
                except:
                    pass
        if len(parts) >= 3 and parts[2].strip():
            data["nama"] = parts[2].strip()
        if len(parts) >= 4 and parts[3].strip():
            data["kelurahan"] = parts[3].strip()
        if len(parts) >= 5 and parts[4].strip():
            data["alamat_rumah"] = parts[4].strip()
            data["alamat_raw"] = f"{data.get('kelurahan','')} - {parts[4].strip()}" if data.get("kelurahan") else parts[4].strip()
        if len(parts) >= 6 and parts[5].strip():
            data["jenis_sampah"] = parts[5].strip()
        if len(parts) >= 7 and parts[6].strip():
            data["berat"] = parts[6].strip()
        return data

    # Format QR asli backend: QR-0575DACBB78C6DD1
    if t.startswith("QR-"):
        # Cari angka dari QR code
        m = re.search(r"\d+", t)
        if m:
            try:
                data["warga_id_from_kode"] = int(m.group())
            except:
                pass
        return data

    # Fallback: cari pola SP-2025-XXXX di mana saja
    m = re.search(r"SP-2025-(\d+)", t)
    if m:
        try:
            data["warga_id_from_kode"] = int(m.group(1))
        except:
            pass
    m = re.search(r"Nama Warga\s*:\s*(.+)", t)
    if m:
        data["nama"] = m.group(1).strip()
    m = re.search(r"Alamat\s*:\s*(.+)", t)
    if m:
        raw = m.group(1).strip()
        data["alamat_raw"] = raw
        if " - " in raw:
            kel, rest = raw.split(" - ", 1)
            data["kelurahan"] = kel.strip()
            data["alamat_rumah"] = rest.strip()
        else:
            data["alamat_rumah"] = raw
    m2 = re.search(r"Kelurahan\s*:\s*(.+)", t, re.IGNORECASE)
    if m2:
        data["kelurahan"] = m2.group(1).strip()
    return data

def test_new_qr_format():
    """Test the new SIPETASAN:QR-0575DACBB78C6DD1 format"""
    print("Testing new QR format: SIPETASAN:QR-0575DACBB78C6DD1")
    result = _parse_qr_text("SIPETASAN:QR-0575DACBB78C6DD1")
    print("Result:", result)
    # This should extract the number from the QR code
    # QR-0575DACBB78C6DD1 contains "0575", but the regex \d+ will extract the first number
    assert result.get("warga_id_from_kode") == 5775, f"Expected 5775, got {result.get('warga_id_from_kode')}"
    print("SUCCESS: New QR format works!")

def test_old_qr_format():
    """Test the old SI-PETASAN|KODE|NAMA|KELURAHAN|ALAMAT|JENIS|BERAT format"""
    print("\nTesting old QR format: SI-PETASAN|SP-2025-0042|Budi Santoso|Sukamaju|Jl. Mawar|PETE|3.5kg")
    result = _parse_qr_text("SI-PETASAN|SP-2025-0042|Budi Santoso|Sukamaju|Jl. Mawar|PETE|3.5kg")
    print("Result:", result)
    assert result.get("warga_id_from_kode") == 42, f"Expected 42, got {result.get('warga_id_from_kode')}"
    assert result.get("nama") == "Budi Santoso", f"Expected 'Budi Santoso', got {result.get('nama')}"
    assert result.get("kelurahan") == "Sukamaju", f"Expected 'Sukamaju', got {result.get('kelurahan')}"
    print("SUCCESS: Old QR format still works!")

def test_backend_qr_format():
    """Test backend QR format: QR-0575DACBB78C6DD1"""
    print("\nTesting backend QR format: QR-0575DACBB78C6DD1")
    result = _parse_qr_text("QR-0575DACBB78C6DD1")
    print("Result:", result)
    # This should extract the number from the QR code
    assert result.get("warga_id_from_kode") == 5775, f"Expected 5775, got {result.get('warga_id_from_kode')}"
    print("SUCCESS: Backend QR format works!")

def test_various_formats():
    """Test various formats to ensure backward compatibility"""
    test_cases = [
        # (input, expected_warga_id, description)
        ("SIPETASAN:SP-2025-123", 123, "New format with SP-2025-"),
        ("SIPETASAN:SP-2025-0001", 1, "New format with SP-2025- and leading zero"),
        ("SIPETASAN:SP-2025-9999", 9999, "New format with SP-2025- max 4-digit"),
        ("SIPETASAN:QR-0575DACBB78C6DD1", 5775, "New format with QR-XXXXXXXX"),
        ("SI-PETASAN|SP-2025-123|Test User|Sukamaju|Jl. Mawar|PETE|2.5kg", 123, "Old format with all fields"),
        ("QR-0575DACBB78C6DD1", 5775, "Direct backend QR format"),
        ("SP-2025-456", 456, "Fallback pattern"),
        ("ABC SP-2025-789 DEF", 789, "Pattern in text"),
    ]
    
    for input_qr, expected_id, description in test_cases:
        print(f"\nTesting {description}: {input_qr}")
        result = _parse_qr_text(input_qr)
        actual_id = result.get("warga_id_from_kode")
        print("Result:", result)
        assert actual_id == expected_id, f"Expected {expected_id}, got {actual_id}"
        print(f"✓ {description}")

if __name__ == "__main__":
    print("=== Testing QR Code Format Fix ===")
    try:
        test_new_qr_format()
        test_old_qr_format()
        test_backend_qr_format()
        test_various_formats()
        print("\n✅ All tests passed! QR format fix is working correctly.")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        exit(1)