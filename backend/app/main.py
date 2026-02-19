from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from app.database import conn
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from datetime import datetime, date, time
import os
import requests
import json
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
# Helper Functions (Core Logic)
# -----------------------------
def register_user_logic(name: str, date_of_birth: str):
    """
    Registers a new user.
    """
    try:
        parsed_dob = datetime.strptime(date_of_birth, "%Y-%m-%d").date()
    except:
        try:
            parsed_dob = datetime.strptime(date_of_birth, "%d %B %Y").date()
        except:
            return {"error": "Invalid date format. Use YYYY-MM-DD."}

    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "SELECT * FROM users WHERE name = %s AND date_of_birth = %s",
            (name, parsed_dob)
        )
        existing_user = cursor.fetchone()

        if existing_user:
            return {"user_id": existing_user["id"], "status": "existing", "message": f"User already exists with ID {existing_user['id']}"}

        cursor.execute(
            "INSERT INTO users (name, date_of_birth) VALUES (%s, %s) RETURNING id",
            (name, parsed_dob)
        )
        new_user_id = cursor.fetchone()["id"]
        
        cursor.execute(
            "INSERT INTO action_logs (user_id, action) VALUES (%s, %s)",
            (new_user_id, "User Registered")
        )
        conn.commit()

    return {"user_id": new_user_id, "status": "new", "message": f"User registered successfully with ID {new_user_id}"}


def book_appointment_logic(user_id: int, appointment_date: str, appointment_time: str, purpose: str):
    """
    Books an appointment for a user.
    """
    try:
        user_id = int(user_id)
    except:
        return {"error": "Invalid user_id format. Must be an integer."}

    # Date parsing logic
    try:
        parsed_date = datetime.strptime(appointment_date, "%Y-%m-%d").date()
    except:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}

    # Time parsing logic
    try:
        parsed_time = datetime.strptime(appointment_time, "%H:%M").time()
    except:
        try:
            parsed_time = datetime.strptime(appointment_time, "%H:%M:%S").time()
        except:
             try:
                parsed_time = datetime.strptime(appointment_time, "%I:%M %p").time()
             except:
                return {"error": "Invalid time format. Use HH:MM or HH:MM:SS."}
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            if not cursor.fetchone():
                 return {"error": f"User with ID {user_id} not found."}

            cursor.execute(
                """
                INSERT INTO appointments 
                (user_id, appointment_date, appointment_time, purpose, status)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, parsed_date, parsed_time, purpose, "Booked")
            )
            appointment_id = cursor.fetchone()["id"]

            cursor.execute(
                "INSERT INTO action_logs (user_id, action) VALUES (%s, %s)",
                (user_id, "Appointment Booked")
            )
            conn.commit()

        return {"appointment_id": appointment_id, "status": "Booked", "message": f"Appointment booked successfully. ID: {appointment_id}"}

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

def check_appointment_status_logic(user_id: int):
    """
    Checks the status of the latest appointment for a user.
    """
    try:
        user_id = int(user_id)
    except:
        return {"message": "Invalid user_id format."}

    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "SELECT * FROM appointments WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        )
        appointment = cursor.fetchone()

    if not appointment:
        return {"message": "No appointment found for this user."}

    return {
        "appointment_id": appointment["id"],
        "appointment_date": str(appointment["appointment_date"]),
        "appointment_time": str(appointment["appointment_time"]),
        "purpose": appointment["purpose"],
        "status": appointment["status"]
    }

def cancel_appointment_logic(user_id: int):
    """
    Cancels the latest appointment for a user.
    """
    try:
        user_id = int(user_id)
    except:
        return {"message": "Invalid user_id format."}

    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(
            "UPDATE appointments SET status = %s WHERE user_id = %s AND status != 'Cancelled' RETURNING id",
            ("Cancelled", user_id)
        )
        appointment = cursor.fetchone()

        if not appointment:
            return {"message": "No active appointment found to cancel."}

        cursor.execute(
            "INSERT INTO action_logs (user_id, action) VALUES (%s, %s)",
            (user_id, "Appointment Cancelled")
        )
        conn.commit()

    return {"appointment_id": appointment["id"], "status": "Cancelled", "message": "Appointment cancelled successfully."}

# -----------------------------
# Routes using Helper Functions
# -----------------------------

# Home Route
@app.get("/")
def home():
    return {"message": "FastAPI backend running successfully"}

# Create Tables
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

# Registration
class RegisterRequest(BaseModel):
    name: str
    date_of_birth: str

@app.post("/register")
def register_user(request: RegisterRequest):
    result = register_user_logic(request.name, request.date_of_birth)
    if "error" in result:
         raise HTTPException(status_code=400, detail=result["error"])
    return result

# Book Appointment
class AppointmentRequest(BaseModel):
    user_id: str
    appointment_date: str
    appointment_time: str
    purpose: str

@app.post("/book-appointment")
def book_appointment(request: AppointmentRequest):
    try:
        uid = int(request.user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    result = book_appointment_logic(uid, request.appointment_date, request.appointment_time, request.purpose)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

# Check Appointment Status
class StatusRequest(BaseModel):
    user_id: str

@app.post("/check-appointment-status")
def check_status(request: StatusRequest):
    try:
        uid = int(request.user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    return check_appointment_status_logic(uid)

# Cancel Appointment
class CancelRequest(BaseModel):
    user_id: str

@app.post("/cancel-appointment")
def cancel_appointment(request: CancelRequest):
    try:
        uid = int(request.user_id)
    except:
         raise HTTPException(status_code=400, detail="Invalid user ID")
         
    return cancel_appointment_logic(uid)

# Dashboard Endpoints
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
# Chat endpoint with Function Calling
# -----------------------------
class ChatRequest(BaseModel):
    message: str
    model: str = "gpt-3.5-turbo"

# Tools Definition
tools = [
    {
        "type": "function",
        "function": {
            "name": "register_user",
            "description": "Register a new user with their name and date of birth.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "The user's full name."},
                    "date_of_birth": {"type": "string", "description": "Date of birth in YYYY-MM-DD format."}
                },
                "required": ["name", "date_of_birth"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Book a medical appointment for a specific user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer", "description": "The ID of the user booking the appointment."},
                    "appointment_date": {"type": "string", "description": "The date of the appointment (YYYY-MM-DD)."},
                    "appointment_time": {"type": "string", "description": "The time of the appointment (HH:MM)."},
                    "purpose": {"type": "string", "description": "The reason or purpose for the appointment."}
                },
                "required": ["user_id", "appointment_date", "appointment_time", "purpose"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_appointment_status",
            "description": "Check the status of the latest appointment for a user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer", "description": "The ID of the user."}
                },
                "required": ["user_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_appointment",
            "description": "Cancel the existing appointment for a user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer", "description": "The ID of the user."}
                },
                "required": ["user_id"]
            }
        }
    }
]

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured on server")

    messages = [
        {"role": "system", "content": "You are the helpful assistant for the Appointment Management System. You can register users, book appointments, check status, and cancel appointments using the available tools. Always ask for necessary details if missing. If a user asks to register, ask for their name and DOB. If they want to book, ask for User ID, Date, Time, and Purpose. Today's date is " + str(date.today())},
        {"role": "user", "content": req.message}
    ]

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": req.model,
        "messages": messages,
        "max_tokens": 500,
        "tools": tools,
        "tool_choice": "auto"
    }

    try:
        # 1. Verification Call
        resp = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=20)
        resp.raise_for_status()
        response_data = resp.json()
        
        message = response_data["choices"][0]["message"]
        
        # 2. Check for Tool Calls
        if message.get("tool_calls"):
            tool_calls = message["tool_calls"]
            messages.append(message)  # Append assistant's message with tool calls

            for tool_call in tool_calls:
                function_name = tool_call["function"]["name"]
                function_args = json.loads(tool_call["function"]["arguments"])
                
                tool_output = None
                
                # Execute the tool
                if function_name == "register_user":
                    tool_output = register_user_logic(**function_args)
                elif function_name == "book_appointment":
                    tool_output = book_appointment_logic(**function_args)
                elif function_name == "check_appointment_status":
                    tool_output = check_appointment_status_logic(**function_args)
                elif function_name == "cancel_appointment":
                    tool_output = cancel_appointment_logic(**function_args)
                else:
                    tool_output = {"error": "Unknown function invoked."}

                # Append tool result
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "content": json.dumps(tool_output)
                })

            # 3. Final Call with Tool Outputs
            final_payload = {
                "model": req.model,
                "messages": messages,
                "max_tokens": 500
            }
            final_resp = requests.post("https://api.openai.com/v1/chat/completions", json=final_payload, headers=headers, timeout=20)
            final_resp.raise_for_status()
            final_jr = final_resp.json()
            assistant_msg = final_jr["choices"][0]["message"]["content"]
            return {"reply": assistant_msg}

        else:
            # No tool calls, just return the message
            return {"reply": message["content"]}

    except requests.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
