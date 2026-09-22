import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.connectors.disruption_connector import fetch_and_scan_disruptions

logger = logging.getLogger("scheduler")

def run_disruption_scanner():
    keywords = ["Red Sea", "cyclone", "port strike", "canal blocked", "typhoon", "Hormuz", "Suez", "Mozambique"]
    alerts = fetch_and_scan_disruptions(keywords)
    logger.info(f"Disruption scanner ran: {len(alerts)} alerts matched.")

def setup_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_disruption_scanner, "interval", minutes=30)
    scheduler.start()
    logger.info("APScheduler initialized for disruption scanner & proxy caches.")
    return scheduler
