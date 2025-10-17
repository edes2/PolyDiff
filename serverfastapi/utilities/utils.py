from datetime import datetime, timezone
import pytz

montreal_tz = pytz.timezone('America/Montreal')

def getCurrentTimestamp():
    return datetime.now(montreal_tz).strftime('%Y-%m-%d %H:%M:%S')