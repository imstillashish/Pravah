import logging
import threading
from app.connectors.disruption_connector import fetch_and_scan_disruptions

logger = logging.getLogger("scheduler")

def run_disruption_scanner():
    keywords = ["Red Sea", "cyclone", "port strike", "canal blocked", "typhoon", "Hormuz", "Suez", "Mozambique"]
    alerts = fetch_and_scan_disruptions(keywords)
    logger.info(f"Disruption scanner ran: {len(alerts)} alerts matched.")
    return alerts

def setup_scheduler():
    """
    ponytail: Uses APScheduler when available; gracefully falls back to stdlib threading.Timer
    to guarantee zero crashes and unblocked dev/production workflows.
    """
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(run_disruption_scanner, "interval", minutes=30)
        scheduler.start()
        logger.info("APScheduler initialized for disruption scanner & proxy caches.")
        return scheduler
    except ImportError:
        logger.info("APScheduler package not found; using resilient background timer fallback.")
        timer = threading.Timer(1800.0, run_disruption_scanner)
        timer.daemon = True
        timer.start()
        return timer
