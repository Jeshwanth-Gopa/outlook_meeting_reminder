import json
import os
import sys
from datetime import datetime
import pywintypes

def resource_path(relative_path):
    base_path = getattr(sys, '_MEIPASS', os.path.abspath("."))
    return os.path.join(base_path, relative_path)

CONFIG_FILE = resource_path("alarm/config.json")

def get_ring_before():
    if not os.path.exists(CONFIG_FILE):
        return 5  # default value if file doesn't exist
    with open(CONFIG_FILE, "r") as f:
        return json.load(f).get("ring_before", 5)

def set_ring_before(minutes):
    try:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        config = {}
    
    config["ring_before"] = minutes

    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

def get_days_ahead():
    if not os.path.exists(CONFIG_FILE):
        return 10
    with open(CONFIG_FILE, "r") as f:
        return json.load(f).get("days_ahead", 10)

def set_days_ahead(days):
    try:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        config = {}
    
    config["days_ahead"] = days

    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

def get_num():
    if not os.path.exists(CONFIG_FILE):
        return 5  # default value if file doesn't exist
    with open(CONFIG_FILE, "r") as f:
        return json.load(f).get("num", 5)

def set_num(num):
    try:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        config = {}
    
    config["num"] = num

    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

def get_meetings_config():
    if not os.path.exists(CONFIG_FILE):
        return []

    with open(CONFIG_FILE, "r") as f:
        config = json.load(f)
        meetings = config.get("meetings", [])

        for m in meetings:
            for k, v in m.items():
                if isinstance(v, str):
                    try:
                        m[k] = datetime.fromisoformat(v)
                    except ValueError:
                        pass

        return meetings

def set_meetings_config(meetings):
    for m in meetings:
        for k, v in m.items():
            if isinstance(v, (datetime, pywintypes.TimeType)):
                m[k] = v.isoformat()
    
    try:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        config = {}

    config["meetings"] = meetings

    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=4)

def get_snooze_time():
    if not os.path.exists(CONFIG_FILE):
        return 5
    with open(CONFIG_FILE, "r") as f:
        return json.load(f).get("snooze_time", 5)
    
def get_ringtone_file():
    if not os.path.exists(CONFIG_FILE):
        return resource_path("alarm/ringtone.mp3")
    with open(CONFIG_FILE, "r") as f:
        ringtone = json.load(f).get("ringtone_file", "alarm/ringtone.mp3")
        return resource_path(ringtone)