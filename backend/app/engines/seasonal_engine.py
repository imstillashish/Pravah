"""
Seasonal Climatology & Demand-Supply Engine for SIH26006.
Computes month-indexed seasonal factors, climatological disruption risks,
and bilingual (English/Hindi) explainability narratives for maritime procurement.
"""
from typing import Dict, Any

MONTH_SEASONAL_PROFILE: Dict[int, Dict[str, Any]] = {
    1: {
        "season_name": "Queensland Wet & Cyclone Season / Winter Restocking",
        "factor": 1.18,
        "risk_level": "ELEVATED",
        "narrative_en": "January Laycan: Queensland wet season raises flood and rail outage risks at DBCT/Gladstone; East Asian winter heating drives tight Capesize supply.",
        "narrative_hi": "जनवरी लैकान: क्वींसलैंड में बारिश और चक्रवात से DBCT/ग्लैडस्टोन पर रेल व्यवधान का जोखिम; पूर्वी एशिया में सर्दियों की मांग से जहाजों की कमी।",
    },
    2: {
        "season_name": "Queensland Cyclone Season Peak",
        "factor": 1.22,
        "risk_level": "ELEVATED",
        "narrative_en": "February Laycan: Peak Australian tropical cyclone window frequently triggers precautionary anchorage closures and delays vessel berthing.",
        "narrative_hi": "फरवरी लैकान: ऑस्ट्रेलियाई चक्रवात के चरम दौर के कारण लंगरगाह बंद होने और लोडिंग में देरी की उच्च संभावना रहती है।",
    },
    3: {
        "season_name": "Post-Cyclone Recovery & Pre-Spring Trade",
        "factor": 1.14,
        "risk_level": "MODERATE",
        "narrative_en": "March Laycan: Supply chains normalize following Australian wet season; steady restocking by Indian and East Asian steel mills.",
        "narrative_hi": "मार्च लैकान: ऑस्ट्रेलियाई बारिश के बाद आपूर्ति श्रृंखला सामान्य होती है; भारतीय इस्पात संयंत्रों द्वारा स्थिर पुनःभंडारण।",
    },
    4: {
        "season_name": "Pre-Monsoon Strategic Stocking Rush",
        "factor": 1.10,
        "risk_level": "MODERATE",
        "narrative_en": "April Laycan: Indian steel mills accelerate import fixtures to establish mandatory 30-day coal buffers before monsoon squalls arrive.",
        "narrative_hi": "अप्रैल लैकान: भारतीय इस्पात मिलें मानसून से पहले 30 दिनों का अनिवार्य कोयला स्टॉक बनाने के लिए आयात में तेजी लाती हैं।",
    },
    5: {
        "season_name": "Pre-Monsoon Peak Import Window",
        "factor": 1.12,
        "risk_level": "MODERATE",
        "narrative_en": "May Laycan: Peak inward coal volumes arriving at Paradip and Dhamra create preliminary berth congestion ahead of seasonal storms.",
        "narrative_hi": "मई लैकान: पारादीप और धामरा पर भारी आयात प्रवाह से मानसून-पूर्व बर्थ प्रतीक्षा बढ़ जाती है।",
    },
    6: {
        "season_name": "South-West Monsoon Onset (Bay of Bengal)",
        "factor": 1.20,
        "risk_level": "HIGH",
        "narrative_en": "June Laycan: South-West Monsoon brings heavy sea swell to the Bay of Bengal, reducing discharge handling rates by 20–25%.",
        "narrative_hi": "जून लैकान: बंगाल की खाड़ी में दक्षिण-पश्चिम मानसून की शुरुआत; भारी लहरों से डिस्चार्ज दर 20-25% घट जाती है।",
    },
    7: {
        "season_name": "Active SW Monsoon / Sandheads Lightering Suspended",
        "factor": 1.26,
        "risk_level": "HIGH",
        "narrative_en": "July Laycan: Rough sea state forces suspension of offshore lightering at Sandheads; Haldia draft restrictions tighten and anchorage delays peak.",
        "narrative_hi": "जुलाई लैकान: समुद्र में तेज हलचल के कारण सैंडहेड्स पर लाइटरिंग बंद; हल्दिया में ड्राफ्ट बाधाएं और लंगर प्रतीक्षा चरम पर।",
    },
    8: {
        "season_name": "Monsoon Peak Weather Delays",
        "factor": 1.24,
        "risk_level": "HIGH",
        "narrative_en": "August Laycan: Persistent rains and reduced conveyor availability at discharge ports increase demurrage risk across East Coast ports.",
        "narrative_hi": "अगस्त लैकान: लगातार बारिश और कन्वेयर बेल्ट की गति धीमी होने से पूर्वी तट के बंदरगाहों पर डेमरेज जोखिम बढ़ जाता है।",
    },
    9: {
        "season_name": "Late Monsoon & Cyclone Transition",
        "factor": 1.16,
        "risk_level": "MODERATE",
        "narrative_en": "September Laycan: Monsoon retreats, but post-monsoon cyclonic depressions in the Bay of Bengal require contingency voyage planning.",
        "narrative_hi": "सितंबर लैकान: मानसून की वापसी; चक्रवाती दबाव की संभावना के कारण यात्रा योजना में अतिरिक्त बफर जरूरी।",
    },
    10: {
        "season_name": "Post-Monsoon Industrial Surge",
        "factor": 1.05,
        "risk_level": "LOW",
        "narrative_en": "October Laycan: Favorable navigational weather and smooth discharge operations; Indian steel output reaches peak post-monsoon rates.",
        "narrative_hi": "अक्टूबर लैकान: मौसम अनुकूल और निर्बाध डिस्चार्ज; भारतीय इस्पात उत्पादन मानसून के बाद उच्चतम स्तर पर पहुंचता है।",
    },
    11: {
        "season_name": "Winter Steel Mill Restocking",
        "factor": 1.15,
        "risk_level": "MODERATE",
        "narrative_en": "November Laycan: Global blast furnace raw material replenishment drives Capesize and Panamax spot charter competition.",
        "narrative_hi": "नवंबर लैकान: वैश्विक स्तर पर ब्लास्ट फर्नेस कच्चे माल की मांग बढ़ने से केपसाइज जहाजों के किराये में तेजी।",
    },
    12: {
        "season_name": "Peak Winter Demand & Year-End Fixtures",
        "factor": 1.19,
        "risk_level": "ELEVATED",
        "narrative_en": "December Laycan: High seasonal dry-bulk trade volumes and northern hemisphere cold snaps support elevated period charter rates.",
        "narrative_hi": "दिसंबर लैकान: उच्च मौसमी व्यापार और सर्दियों की मांग से फ्रेट दरों को मजबूत समर्थन मिलता है।",
    },
}


def compute_seasonal_factor(
    laycan_month: int,
    origin_port: str = "",
    destination_port: str = ""
) -> Dict[str, Any]:
    """
    Computes seasonal demand-supply factor, risk level, and bilingual narratives
    anchored to historical maritime climatology benchmarks.
    """
    m = int(laycan_month) if laycan_month and 1 <= int(laycan_month) <= 12 else 7
    base = MONTH_SEASONAL_PROFILE.get(m, MONTH_SEASONAL_PROFILE[7]).copy()

    # Dynamic adjustments based on port combinations
    orig_lower = (origin_port or "").lower()
    dest_lower = (destination_port or "").lower()

    factor = base["factor"]

    # Special case: Haldia during monsoon has extreme lightering penalty
    if "haldia" in dest_lower and m in (6, 7, 8):
        factor += 0.05
        base["narrative_en"] += " Haldia lightering via Sandheads is severely impacted."
        base["narrative_hi"] += " सैंडहेड्स के माध्यम से हल्दिया लाइटरिंग पर गंभीर प्रभाव पड़ता है।"

    # Special case: Queensland ports during Jan-Feb cyclone season
    if ("hay point" in orig_lower or "gladstone" in orig_lower or "abbot" in orig_lower) and m in (1, 2):
        factor += 0.03

    base["factor"] = round(factor, 2)
    base["month"] = m
    return base
