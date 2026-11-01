from flask import Flask, render_template, request, jsonify
import sqlite3
import os
from pathlib import Path

app = Flask(__name__)

DB_PATH = Path(__file__).resolve().parent / "team.db"


# Connect to database
def connect_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


# Create database and table
def create_database():
    con = connect_db()

    con.execute("""
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Available'
        )
    """)

    # Add sample members only when the table is empty
    count = con.execute(
        "SELECT COUNT(*) FROM members"
    ).fetchone()[0]

    if count == 0:
        con.executemany(
            "INSERT INTO members (name, status) VALUES (?, ?)",
            [
                ("Naveetha", "Available"),
                ("Alex", "Busy"),
                ("Priya", "Away")
            ]
        )

    con.commit()
    con.close()


# Home page
@app.route("/")
def home():
    return render_template("index.html")


# Get all team members
@app.route("/api/members", methods=["GET"])
def get_members():
    con = connect_db()

    members = con.execute(
        "SELECT * FROM members ORDER BY id DESC"
    ).fetchall()

    con.close()

    return jsonify([dict(member) for member in members])


# Add a team member
@app.route("/api/members", methods=["POST"])
def add_member():
    data = request.get_json()

    if not data or not data.get("name", "").strip():
        return jsonify({"error": "Enter a member name"}), 400

    name = data["name"].strip()

    con = connect_db()

    con.execute(
        "INSERT INTO members (name, status) VALUES (?, ?)",
        (name, "Available")
    )

    con.commit()
    con.close()

    return jsonify({"message": "Member added successfully"}), 201


# Update member status
@app.route("/api/members/<int:member_id>", methods=["PATCH"])
def update_status(member_id):
    data = request.get_json()

    allowed_statuses = ["Available", "Busy", "Away"]

    if not data or data.get("status") not in allowed_statuses:
        return jsonify({"error": "Invalid status"}), 400

    con = connect_db()

    result = con.execute(
        "UPDATE members SET status = ? WHERE id = ?",
        (data["status"], member_id)
    )

    con.commit()
    con.close()

    if result.rowcount == 0:
        return jsonify({"error": "Member not found"}), 404

    return jsonify({"message": "Status updated successfully"})


# Delete a member
@app.route("/api/members/<int:member_id>", methods=["DELETE"])
def delete_member(member_id):
    con = connect_db()

    result = con.execute(
        "DELETE FROM members WHERE id = ?",
        (member_id,)
    )

    con.commit()
    con.close()

    if result.rowcount == 0:
        return jsonify({"error": "Member not found"}), 404

    return jsonify({"message": "Member deleted successfully"})


# Create database when application starts
create_database()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )