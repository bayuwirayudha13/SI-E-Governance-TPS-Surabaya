#!/usr/bin/env python3
"""
Test script to verify QR extraction function
"""
import re

def _extract_qr_code_from_text(text: str) -> str:
    """
    Extract actual QR code from text that may be in format:
    - SIPETASAN:QR-0575DACBB78C6DD1 -> returns QR-0575DACBB78C6DD1
    - QR-0575DACBB78C6DD1 -> returns QR-0575DACBB78C6DD1
    - SP-2025-XXXX -> returns SP-2025-XXXX
    """
    text = text.strip()
    
    # Format: SIPETASAN:QR-XXXXXXXX
    if text.startswith("SIPETASAN:"):
        return text.split(":", 1)[1].strip()
    
    # Format: QR-XXXXXXXX (direct)
    if text.startswith("QR-"):
        return text
    
    # Format: SP-2025-XXXX (direct)
    if text.startswith("SP-2025-"):
        return text
    
    # Default: return as-is
    return text

def test_extraction():
    test_cases = [
        ("SIPETASAN:QR-0575DACBB78C6DD1", "QR-0575DACBB78C6DD1"),
        ("QR-0575DACBB78C6DD1", "QR-0575DACBB78C6DD1"),
        ("SP-2025-0042", "SP-2025-0042"),
        ("  SIPETASAN:QR-12345  ", "QR-12345"),
    ]
    
    for input_text, expected in test_cases:
        result = _extract_qr_code_from_text(input_text)
        print(f"Input: {input_text!r} -> Extracted: {result!r}")
        assert result == expected, f"Expected {expected!r}, got {result!r}"
    
    print("\nAll QR extraction tests passed successfully!")

if __name__ == "__main__":
    test_extraction()