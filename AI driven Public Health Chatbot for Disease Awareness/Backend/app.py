from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

# ==========================
# Load Environment Variables
# ==========================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

print("API Key:", API_KEY)

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

# ==========================
# Flask App
# ==========================

app = Flask(__name__)
CORS(app)

print("Database location:", os.path.abspath("users.db"))

# ==========================
# Database Initialization
# ==========================

def init_db():

    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        user_message TEXT NOT NULL,
        bot_response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


init_db()

# ==========================
# Register
# ==========================

@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    fullname = data.get("fullname")
    email = data.get("email")
    password = data.get("password")

    if not fullname or not email or not password:

        return jsonify({
            "success": False,
            "message": "Please fill all fields."
        })

    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email=?",
        (email,)
    )

    if cursor.fetchone():

        conn.close()

        return jsonify({
            "success": False,
            "message": "Email already registered."
        })

    password_hash = generate_password_hash(password)

    cursor.execute(
        """
        INSERT INTO users(fullname,email,password)
        VALUES(?,?,?)
        """,
        (
            fullname,
            email,
            password_hash
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Account created successfully!"
    })


# ==========================
# Login
# ==========================

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:

        return jsonify({
            "success": False,
            "message": "Please fill all fields."
        })

    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT fullname,email,password FROM users WHERE email=?",
        (email,)
    )

    user = cursor.fetchone()

    conn.close()

    if user is None:

        return jsonify({
            "success": False,
            "message": "Email not found."
        })

    fullname, user_email, password_hash = user

    if not check_password_hash(password_hash, password):

        return jsonify({
            "success": False,
            "message": "Incorrect password."
        })

    return jsonify({
        "success": True,
        "message": "Login successful!",
        "fullname": fullname,
        "email": user_email
    })


# ==========================
# Chatbot
# ==========================

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    message = data.get("message", "")
    email = data.get("email")

    prompt = f"""
You are an AI Public Health Chatbot.

Answer only health-related questions.

Always use this exact format.

## Disease Name

### Overview
Short explanation.

### Causes
- Point 1
- Point 2

### Symptoms
- Point 1
- Point 2
- Point 3

### Prevention
- Point 1
- Point 2

### Treatment
- Point 1
- Point 2

### When to Consult a Doctor
- Point 1

End with:

⚠️ This information is for educational purposes only. Consult a healthcare professional for diagnosis and treatment.

User Question:
{message}
"""

    try:

        response = model.generate_content(prompt)

        bot_response = response.text

    except Exception as e:

        error = str(e)

        if "429" in error or "quota" in error.lower():

            bot_response = "⚠️ HealthBot AI has reached its AI request limit. Please try again later."

        elif "500" in error:

            bot_response = "⚠️ AI service is temporarily unavailable."

        elif "API_KEY" in error or "permission" in error.lower():

            bot_response = "⚠️ AI service configuration error."

        elif "connection" in error.lower():

            bot_response = "⚠️ Unable to connect to AI service."

        else:

            print(error)

            bot_response = "⚠️ Something went wrong while processing your request."

    # Save chat history
    if email:

        conn = sqlite3.connect("users.db")
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO chat_history(email,user_message,bot_response)
            VALUES(?,?,?)
            """,
            (
                email,
                message,
                bot_response
            )
        )

        conn.commit()
        conn.close()

    return jsonify({
        "response": bot_response
    })


# ==========================
# Get Chat History
# ==========================

@app.route("/history/<email>", methods=["GET"])
def history(email):

    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id,user_message,bot_response,created_at
        FROM chat_history
        WHERE email=?
        ORDER BY created_at DESC
        """,
        (email,)
    )

    rows = cursor.fetchall()

    conn.close()

    history = []

    for row in rows:

        history.append({

            "id": row[0],
            "user_message": row[1],
            "bot_response": row[2],
            "created_at": row[3]

        })

    return jsonify(history)


# ==========================
# Run Server
# ==========================

if __name__ == "__main__":
    app.run(debug=True)