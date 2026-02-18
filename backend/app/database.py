import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    host="dpg-d4fvarali9vc73ct52kg-a.oregon-postgres.render.com",
    database="elevenlabs",
    user="voicedata_user",
    password="Bm6rXzNRSHWugm8GUjaSqy1rHc4vzFCO",
    sslmode="require"
)

cursor = conn.cursor(cursor_factory=RealDictCursor)
