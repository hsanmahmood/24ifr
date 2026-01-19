import asyncio
import json
import threading
import time
from collections import deque
import requests
import websockets
from flask import current_app
from ..core.config import Config

MAX_FLIGHT_PLANS = 3
flight_plans_cache = deque(maxlen=MAX_FLIGHT_PLANS)
flight_plan_lock = threading.Lock()

class ExternalApiService:
    def __init__(self):
        self.session = requests.Session()

    def get_controllers(self):
        try:
            response = self.session.get(Config.DATA_API_CONTROLLERS_URL, timeout=15)
            response.raise_for_status()
            return {"data": response.json(), "lastUpdated": time.time(), "source": "live"}
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Failed to fetch controllers: {e}", exc_info=True)
            raise

    def get_atis(self):
        try:
            response = self.session.get(Config.DATA_API_ATIS_URL, timeout=15)
            response.raise_for_status()
            return {"data": response.json(), "lastUpdated": time.time(), "source": "live"}
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Failed to fetch ATIS data: {e}", exc_info=True)
            raise

external_api_service = ExternalApiService()

async def flight_plan_websocket_client():
    uri = Config.DATA_API_WSS_URL
    while True:
        try:
            async with websockets.connect(uri, origin="") as websocket:
                while True:
                    message = await websocket.recv()
                    data = json.loads(message)
                    if data.get("t") in ["FLIGHT_PLAN", "EVENT_FLIGHT_PLAN"]:
                        flight_plan = data.get("d", {})
                        if flight_plan:
                            flight_plan["timestamp"] = time.time()
                            flight_plan["source"] = data.get("t")
                            
                            flight_plan["departing"] = flight_plan.get("departure") or flight_plan.get("departing")
                            flight_plan["arriving"] = flight_plan.get("arrival") or flight_plan.get("arriving")
                            flight_plan["flightlevel"] = flight_plan.get("altitude") or flight_plan.get("flightlevel")
                            flight_plan["flightrules"] = flight_plan.get("flight_rules") or flight_plan.get("flightrules")
                            flight_plan["aircraft"] = flight_plan.get("aircraft_type") or flight_plan.get("aircraft")

                            with flight_plan_lock:
                                composite_key = (
                                    flight_plan.get("callsign"),
                                    flight_plan.get("departing"),
                                    flight_plan.get("arriving")
                                )

                                found = False
                                for i, fp in enumerate(flight_plans_cache):
                                    if (fp.get("callsign"), fp.get("departing"), fp.get("arriving")) == composite_key:
                                        flight_plans_cache[i] = flight_plan
                                        found = True
                                        break

                                if not found:
                                    flight_plans_cache.appendleft(flight_plan)
        except Exception:
            pass
        await asyncio.sleep(5)

def run_websocket_in_background():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(flight_plan_websocket_client())

threading.Thread(target=run_websocket_in_background, daemon=True).start()
