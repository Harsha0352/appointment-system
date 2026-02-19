from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from app.database import conn
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from datetime import datetime, date, time
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Home Route
# -----------------------------
@app.get("/")
def home():
    return {"message": "FastAPI backend running successfully"}

# -----------------------------
# Create Tables
# -----------------------------
@app.get("/create-tables")
def create_tables():
    with conn.cursor() as cursor:
        cursor.execute("DROP TABLE IF EXISTS action_logs;")
        cursor.execute("DROP TABLE IF EXISTS appointments;")
        cursor.execute("DROP TABLE IF EXISTS users;")

        cursor.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                date_of_birth DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, date_of_birth)
            );
        """)

        cursor.execute("""
            CREATE TABLE appointments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                appointment_date DATE,
                appointment_time TIME,
                purpose TEXT,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cursor.execute("""
            CREATE TABLE action_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                action TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
    return {"message": "Tables created successfully"}

# -----------------------------
# Registration
# -----------------------------
class RegisterRequest(BaseModel):
    name: str
    date_of_birth: str

@app.post("/register")
def register_user(request: RegisterRequest):
    try:
        parsed_dob = datetime.strptime(request.date_of_birth, "%Y-%m-%d").date()
    except:
        try:
            parsed_dob = datetime.strptime(request.date_of_birth, "%d %B %Y").date()
        except:
            raise HTTPException(status_code=400, detail="Invalid date format")

    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "SELECT * FROM users WHERE name = %s AND date_of_birth = %s",
            (request.name, parsed_dob)
        )
        existing_user = cursor.fetchone()

        if existing_user:
            return {"user_id": existing_user["id"], "status": "existing"}

        cursor.execute(
            "INSERT INTO users (name, date_of_birth) VALUES (%s, %s) RETURNING id",
            (request.name, parsed_dob)
        )
        new_user_id = cursor.fetchone()["id"]
        
        cursor.execute(
            "INSERT INTO action_logs (user_id, action) VALUES (%s, %s)",
            (new_user_id, "User Registered")
        )
        conn.commit()

    return {"user_id": new_user_id, "status": "new"}

# -----------------------------
# Book Appointment
# -----------------------------
class AppointmentRequest(BaseModel):
    user_id: str
    appointment_date: str
    appointment_time: str
    purpose: str

@app.post("/book-appointment")
def book_appointment(request: AppointmentRequest):
    try:
        user_id = int(request.user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    # Date parsing logic
    try:
        parsed_date = datetime.strptime(request.appointment_date, "%Y-%m-%d").date()
    except:
        try:
            parsed_date = datetime.strptime(request.appointment_date, "%d %B %Y").date()
        except:
             try:
                parsed_date = datetime.strptime(request.appointment_date, "%d %b %Y").date()
             except:
                raise HTTPException(status_code=400, detail="Invalid date format")

    # Time parsing logic
    try:
        parsed_time = datetime.strptime(request.appointment_time, "%H:%M:%S").time()
    except:
        try:
            parsed_time = datetime.strptime(request.appointment_time, "%H:%M").time()
        except:
             try:
                parsed_time = datetime.strptime(request.appointment_time, "%I:%M %p").time()
             except:
                raise HTTPException(status_code=400, detail="Invalid time format")

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                INSERT INTO appointments 
                (user_id, appointment_date, appointment_time, purpose, status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, parsed_date, parsed_time, request.purpose, "Booked")
            )
            appointment_id = cursor.fetchone()["id"]

            cursor.execute(
                "INSERT INTO action_logs (user_id, action) VALUES (%s, %s)",
                (user_id, "Appointment Booked")
            )
            conn.commit()

        return {"appointment_id": appointment_id, "status": "Booked"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------
# Check Appointment Status
# -----------------------------
class StatusRequest(BaseModel):
    user_id: str

@app.post("/check-appointment-status")
def check_status(request: StatusRequest):
    user_id = int(request.user_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "SELECT * FROM appointments WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        )
        appointment = cursor.fetchone()

    if not appointment:
        return {"message": "No appointment found"}

    return {
        "appointment_id": appointment["id"],
        "appointment_date": appointment["appointment_date"],
        "appointment_time": appointment["appointment_time"],
        "purpose": appointment["purpose"],
        "status": appointment["status"]
    }

# -----------------------------
# Cancel Appointment
# -----------------------------
class CancelRequest(BaseModel):
    user_id: str

@app.post("/cancel-appointment")
def cancel_appointment(request: CancelRequest):
    user_id = int(request.user_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "UPDATE appointments SET status = %s WHERE user_id = %s RETURNING id",
            ("Cancelled", user_id)
        )
        appointment = cursor.fetchone()

        if not appointment:
            return {"message": "No appointment found to cancel"}

        cursor.execute(
            "INSERT INTO action_logs (user_id, action) VALUES (%s, %s)",
            (user_id, "Appointment Cancelled")
        )
        conn.commit()

    return {"appointment_id": appointment["id"], "status": "Cancelled"}

# -----------------------------
# Dashboard Endpoints
# -----------------------------
@app.get("/users")
def get_users():
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
        rows = cursor.fetchall()
    return [serialize_row(r) for r in rows]

@app.get("/appointments")
def get_appointments():
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM appointments ORDER BY created_at DESC")
        rows = cursor.fetchall()
    return [serialize_row(r) for r in rows]

@app.get("/logs")
def get_logs():
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM action_logs ORDER BY created_at DESC")
        rows = cursor.fetchall()
    return [serialize_row(r) for r in rows]

def serialize_value(v):
    if isinstance(v, (datetime, date, time)):
        return str(v)
    return v

def serialize_row(row):
    if not row:
        return row
    out = {}
    for k, v in dict(row).items():
        out[k] = serialize_value(v)
    return out

# -----------------------------
# Chat endpoint
# -----------------------------
class ChatRequest(BaseModel):
    message: str
    model: str = "gpt-3.5-turbo"

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured on server")

    payload = {
        "model": req.model,
        "messages": [
            {"role": "system", "content": "You are the helpful assistant for the Appointment Management System. You help users schedule appointments, check status, and answer queries. Keep responses concise."},
            {"role": "user", "content": req.message}
        ],
        "max_tokens": 500,
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    try:
        resp = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=20)
        resp.raise_for_status()
        jr = resp.json()
        assistant_msg = jr.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"reply": assistant_msg}
    except requests.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
