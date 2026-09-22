from app.config import settings

def test_settings_load():
    assert settings.SECRET_KEY != ""
    assert settings.ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 1440
