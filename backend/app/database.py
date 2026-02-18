import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("DATABASE_URL not set")

conn = psycopg2.connect(DATABASE_URL, sslmode="require")
cursor = conn.cursor(cursor_factory=RealDictCursor)
