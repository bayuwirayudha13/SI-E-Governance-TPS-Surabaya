from datetime import datetime
from zoneinfo import ZoneInfo

WIB = ZoneInfo("Asia/Jakarta")

def get_wib_now():
    """Return current datetime in WIB timezone"""
    return datetime.now(WIB)
