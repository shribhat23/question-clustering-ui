import os
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "shribhat1350")   # change to your real password
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "clustering_db")

mysql_url = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
    f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
)

engine = create_engine(
    mysql_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    future=True
)

admin_email = "admin@gmail.com"
admin_password = generate_password_hash("Admin@123")

with engine.begin() as conn:
    existing = conn.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": admin_email}
    ).fetchone()

    if existing:
        print("Admin already exists.")
    else:
        conn.execute(text("""
            INSERT INTO users (
                first_name,
                last_name,
                full_name,
                email,
                password,
                role,
                profile_pic
            )
            VALUES (
                :first_name,
                :last_name,
                :full_name,
                :email,
                :password,
                :role,
                :profile_pic
            )
        """), {
            "first_name": "Admin",
            "last_name": "User",
            "full_name": "Admin User",
            "email": admin_email,
            "password": admin_password,
            "role": "Admin",
            "profile_pic": "https://i.pravatar.cc/40"
        })

        print("Admin created successfully.")
        print("Email: admin@gmail.com")
        print("Password: Admin@123")