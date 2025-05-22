import hashlib
from datetime import datetime, timedelta
from alarm.config_handler import get_meetings_config, set_meetings_config
import pythoncom
import win32com.client
import os
import time

def remove_timezone(dt):
    return dt.replace(tzinfo=None) if dt.tzinfo else dt

def convert_dtypes_to_strings(meetings):
    return [{str(k): str(v) for k,v in m.items()} for m in meetings]

def check_meetings(meetings):
    now = datetime.now()
    return [
        m for m in meetings
        if m["ring_at"] >= now and m.get("MeetingStatus", 0) not in (5, 7)
    ]

def get_outlook_instance():
    pythoncom.CoInitialize()
    try:
        outlook = win32com.client.GetActiveObject("Outlook.Application")
        print("Using active Outlook instance.")
    except Exception as e:
        print(f"GetActiveObject failed: {e}")
        # print("Trying to force close Outlook and start fresh...")
        
        # import subprocess
        # subprocess.run(["taskkill", "/f", "/im", "outlook.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # os.system("taskkill /f /im outlook.exe")
        # time.sleep(2)
        # try:
        #     outlook = win32com.client.Dispatch("Outlook.Application")
        #     try:
        #         outlook.Visible = False
        #     except Exception:
        #         pass
        #     print("Started new Outlook instance.")
        try:
            outlook = win32com.client.gencache.EnsureDispatch("Outlook.Application")
            try:
                outlook.Visible = False
            except Exception:
                pass
            print("Started new Outlook instance.")
        except Exception as e2:
            print(f"Dispatch failed too: {e2}")
            raise e2
    return outlook

def meetings_ahead(namespace, days_ahead, ring_before):
    now      = datetime.now() + timedelta(days=-1)
    end_time = now + timedelta(days=30)
    meetings = []
    # print(namespace.Accounts)
    for folder in namespace.Folders:
        try:
            calendar = folder.Folders["Calendar"]
            items = calendar.Items
            items = items.Restrict("[Subject] <> ''")
            items.IncludeRecurrences = True
            items.Sort("[Start]")

            restriction = "[Start] >= '{}' AND [Start] <= '{}'".format(
                now.strftime('%m/%d/%Y'),
                end_time.strftime('%m/%d/%Y')
            )
            print(f"Restriction: {restriction}")
            restricted_items = items.Restrict(restriction)
            # restricted_items = items
            # for item in items:
            #     print(item.Subject, item.Start)
            for item in restricted_items:
                # print(item.Subject, item.Start)
                start = remove_timezone(item.Start)
                if not (now <= start <= end_time):
                    continue

                st = item.Subject + str(start) + str(item.End) + folder.Name
                meetings.append({
                    "subject": item.Subject,
                    "start":   start,
                    "end":     remove_timezone(item.End),
                    "account": folder.Name,
                    "ring_at": start - timedelta(minutes=ring_before),
                    "id":      hashlib.sha256(st.encode()).hexdigest(),
                    "MeetingStatus": item.MeetingStatus,
                })
            # print(meetings)
        except Exception as e:
            print(f"Error with {folder.Name}: {e}")

    meet_before = check_meetings(get_meetings_config())

    for m in meetings:
        for mb in meet_before:
            if m["id"] == mb["id"] and mb["ring_at"] > datetime.now():
                m["ring_at"] = mb["ring_at"]
                break

    meetings = check_meetings(meetings)
    meetings.sort(key=lambda x: x["ring_at"])
    set_meetings_config(meetings)
    return meetings