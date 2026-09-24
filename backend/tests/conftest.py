import os
import sys
from pathlib import Path

# Isolate test database so pytest never drops the development database
backend_dir = Path(__file__).resolve().parent.parent
test_db_path = (Path(__file__).resolve().parent / "test_logistics.db").as_posix()
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"

# Ensure backend directory is in sys.path
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

