import os
import re
import json
import pickle
import numpy as np
import pandas as pd

from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder

import docx
import PyPDF2

app = Flask(__name__)
CORS(app)

# ---------------------------
# Load NLP Models
# ---------------------------
nlp = spacy.load("en_core_web_sm")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# ---------------------------
# Upload Folder / Model Folder
# ---------------------------
UPLOAD_FOLDER = "uploads"
MODEL_FOLDER = "saved_models"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MODEL_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

CLASSIFIER_PATH = os.path.join(MODEL_FOLDER, "topic_classifier.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_FOLDER, "label_encoder.pkl")

ALLOWED_EXTENSIONS = {"txt", "csv", "json", "pdf", "docx", "md", "log"}

# ---------------------------
# Database Connection (MySQL only)
# ---------------------------
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "shribhat1350")
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

# ---------------------------
# Fixed Topics
# ---------------------------
TOPIC_ORDER = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Python",
    "Java",
    "C Programming",
    "C++ Programming",
    "Object Oriented Programming",
    "Data Structures",
    "DBMS",
    "Operating System",
    "Computer Networks",
    "Web Development",
    "Data Mining",
    "Natural Language Processing",
    "Computer Vision",
    "Artificial Intelligence",
    "Machine Learning",
    "Big Data",
    "Cloud Computing",
    "Others"
]

VALID_TOPICS = set(TOPIC_ORDER)
AUTO_LABEL_GENERIC_CATEGORIES = {"", "manual", "auto", "others", "none", "null"}

TOPIC_EXAMPLES = {
    "Mathematics": [
        "Find the LCM of 60 and 25",
        "Define LCM",
        "Define algebraic sum",
        "Solve x + 2 = 5",
        "Calculate the area of a circle",
        "Find the HCF of 24 and 36",
        "Explain probability",
        "Sum of 10 and 20",
        "Difference of 100 and 20",
        "Find the derivative of x^2",
        "Evaluate the integral of sin(x)",
        "Solve differential equation dy/dx = x^2",
        "Find the limit of x as it approaches infinity",
        "Explain Taylor series expansion",
        "Find partial derivatives",
        "Solve definite integration",
        "Find maxima and minima",
        "Explain matrices",
        "Explain determinants",
        "Find eigen values of a matrix",
        "Solve linear equations using matrix method"
    ],
    "Physics": [
        "Define force",
        "What is velocity?",
        "State Ohm's law",
        "Explain acceleration",
        "Define momentum"
    ],
    "Chemistry": [
        "Define atom",
        "Explain chemical bonding",
        "Define acid and base",
        "Explain pH scale"
    ],
    "Biology": [
        "Define cell",
        "Explain photosynthesis",
        "What is respiration?",
        "Explain DNA structure"
    ],
    "Python": [
        "What is Python?",
        "Explain for loop in Python",
        "What is a function in Python?",
        "Explain lists in Python",
        "Explain file handling in Python",
        "Explain OOP in Python",
        "What is dictionary in Python?",
        "Explain classes and objects in Python"
    ],
    "Java": [
        "What is Java?",
        "What is JVM?",
        "Define constructor in Java",
        "Explain inheritance in Java"
    ],
    "C Programming": [
        "What is C language?",
        "Explain pointers in C",
        "Define array in C",
        "Explain structures in C"
    ],
    "C++ Programming": [
        "What is C++?",
        "What is polymorphism in C++?",
        "Define constructor in C++",
        "Explain templates in C++"
    ],
    "Object Oriented Programming": [
        "What is Object Oriented Programming?",
        "Explain OOP concepts",
        "Explain inheritance and polymorphism",
        "Define encapsulation",
        "Explain class and object",
        "Explain abstraction and encapsulation"
    ],
    "Data Structures": [
        "What is stack?",
        "Define linked list",
        "What is binary tree?",
        "Explain queue"
    ],
    "DBMS": [
        "What is DBMS?",
        "Explain normalization",
        "Define primary key",
        "Explain SQL joins"
    ],
    "Operating System": [
        "What is operating system?",
        "Define deadlock",
        "What is paging?",
        "Explain process scheduling"
    ],
    "Computer Networks": [
        "What is computer network?",
        "Explain OSI model",
        "What is TCP/IP?",
        "Define routing"
    ],
    "Web Development": [
        "What is HTML?",
        "Explain CSS",
        "What is JavaScript?",
        "Explain DOM"
    ],
    "Data Mining": [
        "What is Data Mining?",
        "Define clustering",
        "Applications of Data Mining",
        "Explain classification"
    ],
    "Natural Language Processing": [
        "What is NLP?",
        "Explain tokenization",
        "Applications of NLP",
        "Explain stemming"
    ],
    "Computer Vision": [
        "What is Computer Vision?",
        "Define object detection",
        "Explain image processing",
        "Explain image segmentation"
    ],
    "Artificial Intelligence": [
        "What is Artificial Intelligence?",
        "Define intelligent agent",
        "Applications of AI",
        "Explain heuristic search",
        "What is expert system?",
        "Explain knowledge representation"
    ],
    "Machine Learning": [
        "What is Machine Learning?",
        "Explain supervised learning",
        "Define unsupervised learning",
        "Explain regression",
        "What is classification in machine learning?"
    ],
    "Big Data": [
        "What is Big Data?",
        "Explain Hadoop",
        "Applications of Big Data",
        "Explain MapReduce"
    ],
    "Cloud Computing": [
        "What is Cloud Computing?",
        "Explain SaaS",
        "Define IaaS",
        "Explain PaaS"
    ],
    "Others": [
        "General subject question"
    ]
}

# ---------------------------
# Keyword Rules
# ---------------------------
KEYWORD_BONUS = {
    "Mathematics": [
        "lcm", "hcf", "algebra", "algebraic", "sum",
        "difference", "add", "subtract", "multiply", "division",
        "probability", "equation", "mean", "median", "mode",
        "area", "perimeter", "volume", "fraction", "ratio",
        "derivative", "differentiate", "differentiation",
        "integration", "integral", "limit", "calculus",
        "dy/dx", "dx", "partial derivative", "laplace",
        "taylor", "series", "matrix", "matrices", "determinant",
        "determinants", "vector", "eigen", "trigonometry",
        "geometry", "statistics"
    ],
    "Physics": [
        "force", "velocity", "acceleration", "ohm", "motion",
        "momentum", "current", "voltage", "resistance"
    ],
    "Chemistry": [
        "atom", "molecule", "acid", "base", "bond", "reaction",
        "compound", "chemical", "ph", "salt"
    ],
    "Biology": [
        "cell", "photosynthesis", "respiration", "tissue", "dna",
        "rna", "plant", "animal"
    ],
    "Python": [
        "python", "py", "for loop", "while loop", "function",
        "list", "tuple", "dictionary", "set", "lambda",
        "decorator", "file handling", "exception handling",
        "pandas", "numpy", "class in python", "object in python"
    ],
    "Java": [
        "java", "jvm", "constructor", "interface", "inheritance",
        "multithreading", "spring"
    ],
    "C Programming": [
        "pointer", "printf", "scanf", "structure", "array",
        "malloc", "header", "stdio", "c language", "preprocessor"
    ],
    "C++ Programming": [
        "c++", "destructor", "template", "polymorphism",
        "namespace", "stl", "cout", "cin"
    ],
    "Object Oriented Programming": [
        "oop", "oops", "object oriented programming",
        "class", "object", "inheritance", "polymorphism",
        "encapsulation", "abstraction", "constructor",
        "destructor", "method overloading", "method overriding"
    ],
    "Data Structures": [
        "stack", "queue", "linked list", "tree", "graph",
        "heap", "binary tree", "bst", "hash table"
    ],
    "DBMS": [
        "dbms", "sql", "normalization", "primary key",
        "foreign key", "transaction", "table", "database",
        "er model", "join", "query"
    ],
    "Operating System": [
        "deadlock", "paging", "process", "thread",
        "scheduler", "memory", "semaphore", "os",
        "cpu scheduling", "virtual memory"
    ],
    "Computer Networks": [
        "osi", "tcp", "ip", "routing", "topology",
        "subnetting", "http", "https", "network",
        "protocol", "udp"
    ],
    "Web Development": [
        "html", "css", "javascript", "responsive",
        "dom", "react", "node", "frontend", "backend",
        "web page", "bootstrap"
    ],
    "Data Mining": [
        "data mining", "clustering", "association",
        "apriori", "frequent pattern"
    ],
    "Natural Language Processing": [
        "nlp", "tokenization", "stemming",
        "lemmatization", "tf-idf", "named entity",
        "sentiment analysis"
    ],
    "Computer Vision": [
        "opencv", "image", "segmentation",
        "object detection", "cnn", "computer vision"
    ],
    "Artificial Intelligence": [
        "artificial intelligence", "intelligent agent",
        "expert system", "heuristic", "heuristic search",
        "knowledge representation", "state space search",
        "a*", "a star", "minimax"
    ],
    "Machine Learning": [
        "machine learning", "supervised", "unsupervised",
        "regression", "classification", "training data",
        "model evaluation", "overfitting", "underfitting"
    ],
    "Big Data": ["big data", "hadoop", "spark", "mapreduce"],
    "Cloud Computing": [
        "cloud", "saas", "paas", "iaas", "virtualization",
        "aws", "azure", "gcp"
    ]
}

# ---------------------------
# Runtime Classifier Storage
# ---------------------------
topic_classifier = None
label_encoder = None
subject_prototypes = {}

# ---------------------------
# Helpers
# ---------------------------
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_email(email):
    email = str(email).strip().lower()
    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
    return re.fullmatch(pattern, email) is not None


def validate_password(password):
    password = str(password)

    if len(password) < 8:
        return False, "Password must be at least 8 characters"

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"

    return True, ""


def normalize_question(question):
    question = str(question).strip().lower()
    question = re.sub(r"[^\w\s\+\#]", " ", question)
    question = re.sub(r"\s+", " ", question)
    return question.strip()


def safe_filename(filename):
    filename = filename.replace("\\", "/")
    filename = filename.split("/")[-1]
    return secure_filename(filename)


def tokenize_text(text_value):
    return re.findall(r"[a-zA-Z0-9\+\#]+", text_value.lower())


def contains_keyword(text_value, keyword):
    text_value = text_value.lower().strip()
    keyword = keyword.lower().strip()

    if not keyword:
        return False

    if keyword in {"c++", "a*", "c#", "dy/dx"}:
        return keyword in text_value

    if " " in keyword or "/" in keyword or "-" in keyword:
        pattern = r"(?<!\w)" + re.escape(keyword) + r"(?!\w)"
        return re.search(pattern, text_value) is not None

    tokens = set(tokenize_text(text_value))
    return keyword in tokens


def count_keyword_hits(question, keywords):
    hits = 0
    for kw in keywords:
        if contains_keyword(question, kw):
            hits += 1
    return hits


def extract_text_from_file(filepath):
    ext = filepath.rsplit(".", 1)[-1].lower()

    try:
        if ext in {"txt", "md", "log"}:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        if ext == "csv":
            df = pd.read_csv(filepath, dtype=str, keep_default_na=False)
            return "\n".join(df.astype(str).fillna("").values.flatten().tolist())

        if ext == "json":
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                data = json.load(f)
            return json.dumps(data, ensure_ascii=False, indent=2)

        if ext == "docx":
            doc = docx.Document(filepath)
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

        if ext == "pdf":
            content = []
            with open(filepath, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    content.append(page.extract_text() or "")
            return "\n".join(content)

    except Exception as e:
        print(f"File extraction error for {filepath}: {e}")

    return ""


def ensure_tables():
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS questions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    question_text TEXT NOT NULL,
                    normalized_question VARCHAR(500),
                    category VARCHAR(255)
                )
            """))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS clustered_questions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    cluster VARCHAR(255),
                    topic VARCHAR(255),
                    question TEXT
                )
            """))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    full_name VARCHAR(200) NOT NULL,
                    email VARCHAR(150) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('Admin', 'Student', 'Teacher') NOT NULL DEFAULT 'Student',
                    profile_pic TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS user_activity (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_name VARCHAR(255),
                    question_text TEXT,
                    subject VARCHAR(255),
                    action_type VARCHAR(100),
                    time_spent_seconds INT DEFAULT 0,
                    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
    except Exception as e:
        print("Ensure tables error:", e)

# ---------------------------
# Signup API
# ---------------------------
@app.route("/api/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json() or {}

        first_name = str(data.get("firstName", "")).strip()
        last_name = str(data.get("lastName", "")).strip()
        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", "")).strip()
        confirm_password = str(data.get("confirmPassword", "")).strip()
        role = str(data.get("role", "Student")).strip()

        if not first_name or not last_name or not email or not password or not confirm_password:
            return jsonify({
                "success": False,
                "message": "All fields are required"
            }), 400

        if len(first_name) < 2 or len(last_name) < 2:
            return jsonify({
                "success": False,
                "message": "First name and last name must be at least 2 characters"
            }), 400

        if not validate_email(email):
            return jsonify({
                "success": False,
                "message": "Please enter a valid email address"
            }), 400

        password_ok, password_message = validate_password(password)
        if not password_ok:
            return jsonify({
                "success": False,
                "message": password_message
            }), 400

        if password != confirm_password:
            return jsonify({
                "success": False,
                "message": "Passwords do not match"
            }), 400

        if role not in ["Student", "Teacher"]:
            return jsonify({
                "success": False,
                "message": "Invalid role selected"
            }), 403

        full_name = f"{first_name} {last_name}"
        profile_pic = "https://i.pravatar.cc/40"
        hashed_password = generate_password_hash(password)

        with engine.begin() as conn:
            existing_user = conn.execute(
                text("SELECT id FROM users WHERE email = :email LIMIT 1"),
                {"email": email}
            ).fetchone()

            if existing_user:
                return jsonify({
                    "success": False,
                    "message": "Email already registered"
                }), 409

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
                "first_name": first_name,
                "last_name": last_name,
                "full_name": full_name,
                "email": email,
                "password": hashed_password,
                "role": role,
                "profile_pic": profile_pic
            })

        return jsonify({
            "success": True,
            "message": "Signup successful"
        }), 201

    except Exception as e:
        print("Signup error:", e)
        return jsonify({
            "success": False,
            "message": "Server error during signup"
        }), 500

# ---------------------------
# Login API
# ---------------------------
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}

        email = str(data.get("email", "")).strip().lower()
        password = str(data.get("password", "")).strip()

        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required"
            }), 400

        if not validate_email(email):
            return jsonify({
                "success": False,
                "message": "Please enter a valid email address"
            }), 400

        with engine.begin() as conn:
            user = conn.execute(
                text("""
                    SELECT id, first_name, last_name, full_name, email, password, role, profile_pic
                    FROM users
                    WHERE email = :email
                    LIMIT 1
                """),
                {"email": email}
            ).mappings().fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        if not check_password_hash(user["password"], password):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        user_data = {
            "id": user["id"],
            "firstName": user["first_name"],
            "lastName": user["last_name"],
            "name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "profilePic": user["profile_pic"]
        }

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": user_data
        }), 200

    except Exception as e:
        print("Login error:", e)
        return jsonify({
            "success": False,
            "message": "Server error during login"
        }), 500


def ensure_normalized_column():
    try:
        with engine.begin() as conn:
            df = pd.read_sql("SELECT id, question_text, normalized_question, category FROM questions", conn)

            for _, row in df.iterrows():
                normalized_q = normalize_question(row["question_text"])
                current_normalized = row["normalized_question"]

                if pd.isna(current_normalized) or str(current_normalized).strip() != normalized_q:
                    conn.execute(text("""
                        UPDATE questions
                        SET normalized_question = :normalized_question
                        WHERE id = :id
                    """), {
                        "normalized_question": normalized_q,
                        "id": int(row["id"])
                    })

                current_category = "" if pd.isna(row["category"]) else str(row["category"]).strip()
                if not current_category:
                    conn.execute(text("""
                        UPDATE questions
                        SET category = :category
                        WHERE id = :id
                    """), {
                        "category": "Others",
                        "id": int(row["id"])
                    })
    except Exception as e:
        print("Warning:", e)


def build_subject_prototypes():
    global subject_prototypes
    subject_prototypes = {}

    for topic, examples in TOPIC_EXAMPLES.items():
        embeddings = embedding_model.encode(examples)
        subject_prototypes[topic] = np.mean(embeddings, axis=0)


def save_classifier():
    global topic_classifier, label_encoder

    if topic_classifier is not None and label_encoder is not None:
        with open(CLASSIFIER_PATH, "wb") as f:
            pickle.dump(topic_classifier, f)
        with open(LABEL_ENCODER_PATH, "wb") as f:
            pickle.dump(label_encoder, f)


def load_classifier():
    global topic_classifier, label_encoder

    if os.path.exists(CLASSIFIER_PATH) and os.path.exists(LABEL_ENCODER_PATH):
        try:
            with open(CLASSIFIER_PATH, "rb") as f:
                topic_classifier = pickle.load(f)
            with open(LABEL_ENCODER_PATH, "rb") as f:
                label_encoder = pickle.load(f)
        except Exception as e:
            print("Classifier load error:", e)
            topic_classifier = None
            label_encoder = None


def delete_duplicate_questions():
    try:
        df = pd.read_sql("SELECT id, normalized_question FROM questions ORDER BY id ASC", engine)
        if df.empty:
            return

        seen = set()
        ids_to_delete = []

        for _, row in df.iterrows():
            norm = "" if pd.isna(row["normalized_question"]) else str(row["normalized_question"]).strip()
            if not norm:
                continue

            if norm in seen:
                ids_to_delete.append(int(row["id"]))
            else:
                seen.add(norm)

        if ids_to_delete:
            with engine.begin() as conn:
                for question_id in ids_to_delete:
                    conn.execute(text("DELETE FROM questions WHERE id = :id"), {"id": question_id})

    except Exception as e:
        print("Duplicate cleanup error:", e)


def delete_semantic_duplicate_questions(threshold=0.95):
    try:
        df = pd.read_sql("SELECT id, question_text FROM questions ORDER BY id", engine)

        if df.empty or len(df) < 2:
            return 0

        questions = df["question_text"].tolist()
        ids = df["id"].tolist()
        embeddings = embedding_model.encode(questions)

        ids_to_delete = set()

        for i in range(len(questions)):
            if ids[i] in ids_to_delete:
                continue

            for j in range(i + 1, len(questions)):
                if ids[j] in ids_to_delete:
                    continue

                score = cosine_similarity([embeddings[i]], [embeddings[j]])[0][0]

                if score > threshold:
                    ids_to_delete.add(ids[j])

        deleted_count = 0

        if ids_to_delete:
            with engine.begin() as conn:
                for question_id in ids_to_delete:
                    result = conn.execute(
                        text("DELETE FROM questions WHERE id = :id"),
                        {"id": int(question_id)}
                    )
                    deleted_count += result.rowcount

        return deleted_count

    except Exception as e:
        print("Semantic duplicate cleanup error:", e)
        return 0


def detect_topic_by_rules(question):
    q = question.lower()

    topic_hits = {topic: 0 for topic in TOPIC_ORDER}

    for topic, keywords in KEYWORD_BONUS.items():
        topic_hits[topic] += count_keyword_hits(q, keywords)

    if topic_hits["Python"] >= 1 and (
        contains_keyword(q, "python")
        or contains_keyword(q, "file handling")
        or contains_keyword(q, "dictionary")
        or contains_keyword(q, "list")
        or contains_keyword(q, "tuple")
    ):
        return "Python", 0.98

    if topic_hits["Mathematics"] >= 1 and (
        contains_keyword(q, "matrix")
        or contains_keyword(q, "matrices")
        or contains_keyword(q, "determinant")
        or contains_keyword(q, "determinants")
        or contains_keyword(q, "derivative")
        or contains_keyword(q, "integration")
        or contains_keyword(q, "integral")
        or contains_keyword(q, "calculus")
        or contains_keyword(q, "equation")
    ):
        return "Mathematics", 0.98

    if topic_hits["DBMS"] >= 1 and (
        contains_keyword(q, "dbms")
        or contains_keyword(q, "sql")
        or contains_keyword(q, "database")
        or contains_keyword(q, "normalization")
        or contains_keyword(q, "primary key")
        or contains_keyword(q, "foreign key")
    ):
        return "DBMS", 0.98

    if topic_hits["Object Oriented Programming"] >= 2 and topic_hits["Python"] == 0 and topic_hits["Java"] == 0 and topic_hits["C++ Programming"] == 0:
        return "Object Oriented Programming", 0.95

    if topic_hits["Machine Learning"] >= 1:
        return "Machine Learning", 0.94

    if topic_hits["Artificial Intelligence"] >= 1:
        return "Artificial Intelligence", 0.94

    best_topic = max(topic_hits, key=topic_hits.get)
    best_hits = topic_hits[best_topic]

    if best_hits > 0:
        confidence = min(0.90, 0.55 + (best_hits * 0.10))
        return best_topic, confidence

    return None, 0.0


def detect_topic_by_prototype(question):
    question_lower = question.lower()

    if any(contains_keyword(question_lower, term) for term in [
        "derivative", "differentiate", "differentiation",
        "integral", "integration", "limit", "calculus",
        "dy/dx", "partial derivative", "laplace", "taylor series",
        "matrix", "matrices", "determinant", "determinants"
    ]):
        return "Mathematics", 0.99

    rule_topic, rule_conf = detect_topic_by_rules(question)
    if rule_topic is not None and rule_conf >= 0.90:
        return rule_topic, rule_conf

    question_embedding = embedding_model.encode([question])[0]
    subject_scores = {}

    for topic, prototype_embedding in subject_prototypes.items():
        score = cosine_similarity([question_embedding], [prototype_embedding])[0][0]
        subject_scores[topic] = float(score)

    for topic, keywords in KEYWORD_BONUS.items():
        hits = count_keyword_hits(question_lower, keywords)
        if hits > 0:
            subject_scores[topic] += min(0.30, 0.12 * hits)

    best_topic = max(subject_scores, key=subject_scores.get)
    best_score = subject_scores[best_topic]

    if best_score < 0.33:
        return "Others", best_score

    return best_topic, best_score


def auto_label_existing_questions():
    try:
        df = pd.read_sql(
            "SELECT id, question_text, category FROM questions ORDER BY id ASC",
            engine
        )

        if df.empty:
            return 0

        updated_count = 0

        with engine.begin() as conn:
            for _, row in df.iterrows():
                question_id = int(row["id"])
                question_text = str(row["question_text"]).strip()

                current_category = ""
                if pd.notna(row["category"]):
                    current_category = str(row["category"]).strip()

                if current_category.lower() in AUTO_LABEL_GENERIC_CATEGORIES or current_category not in VALID_TOPICS:
                    predicted_topic = detect_topic_for_question(question_text)

                    if predicted_topic not in VALID_TOPICS:
                        predicted_topic = "Others"

                    conn.execute(text("""
                        UPDATE questions
                        SET category = :category
                        WHERE id = :id
                    """), {
                        "category": predicted_topic,
                        "id": question_id
                    })
                    updated_count += 1

        return updated_count

    except Exception as e:
        print("Auto labeling error:", e)
        return 0


def train_topic_classifier_from_db(min_samples=10):
    global topic_classifier, label_encoder

    try:
        df = pd.read_sql(
            "SELECT question_text, category FROM questions "
            "WHERE category IS NOT NULL AND category <> ''",
            engine
        )
    except Exception as e:
        print("Training read error:", e)
        topic_classifier = None
        label_encoder = None
        return False

    if df.empty:
        topic_classifier = None
        label_encoder = None
        return False

    df["category"] = df["category"].astype(str).str.strip()
    df = df[df["category"].isin(VALID_TOPICS)]
    df = df[df["category"] != "Others"]

    if len(df) < min_samples:
        topic_classifier = None
        label_encoder = None
        return False

    class_counts = df["category"].value_counts()
    valid_classes = class_counts[class_counts >= 2].index.tolist()
    df = df[df["category"].isin(valid_classes)]

    if len(df["category"].unique()) < 2:
        topic_classifier = None
        label_encoder = None
        return False

    questions = df["question_text"].tolist()
    labels = df["category"].tolist()

    X = embedding_model.encode(questions)
    le = LabelEncoder()
    y = le.fit_transform(labels)

    clf = LogisticRegression(max_iter=2000)
    clf.fit(X, y)

    topic_classifier = clf
    label_encoder = le
    save_classifier()
    return True


def extract_questions(text_data):
    questions = []
    lines = text_data.splitlines()

    command_words = {
        "what", "why", "how", "when", "where", "who", "which",
        "define", "explain", "describe", "write", "list",
        "mention", "differentiate", "find", "calculate",
        "solve", "evaluate", "state", "discuss", "prove",
        "derive", "compare", "identify", "name", "give",
        "classify", "illustrate"
    }

    for line in lines:
        sentence = str(line).strip()

        if not sentence:
            continue

        sentence = re.sub(r"\s+", " ", sentence)
        sentence = re.sub(r"^\d+\s*[\.\)\-:]\s*", "", sentence)
        sentence = re.sub(r"^[\-\*\u2022]\s*", "", sentence)
        sentence = sentence.strip()

        if not sentence:
            continue

        if len(sentence.split()) < 3:
            continue

        first_word = sentence.split()[0].lower()

        if sentence.endswith("?") or first_word in command_words:
            questions.append(sentence)
            continue

        if len(sentence.split()) >= 4:
            questions.append(sentence)

    return questions


def remove_internal_duplicates(questions):
    unique_questions = []
    seen = set()

    for question in questions:
        normalized_q = normalize_question(question)
        if normalized_q not in seen:
            seen.add(normalized_q)
            unique_questions.append(question)

    return unique_questions


def is_duplicate_in_db(question, threshold=0.95):
    normalized_q = normalize_question(question)

    try:
        df = pd.read_sql(
            "SELECT question_text, normalized_question FROM questions",
            engine
        )
    except Exception:
        return False

    if df.empty:
        return False

    existing_normalized = df["normalized_question"].dropna().tolist()
    if normalized_q in existing_normalized:
        return True

    db_questions = df["question_text"].tolist()
    new_embedding = embedding_model.encode([question])[0]
    db_embeddings = embedding_model.encode(db_questions)

    similarities = cosine_similarity([new_embedding], db_embeddings)[0]
    return float(np.max(similarities)) > threshold


def find_similar_questions_in_db(question, threshold=0.60, limit=20):
    try:
        df = pd.read_sql("SELECT question_text FROM questions", engine)
    except Exception:
        return []

    if df.empty:
        return []

    db_questions = df["question_text"].tolist()
    query_embedding = embedding_model.encode([question])[0]
    db_embeddings = embedding_model.encode(db_questions)

    scores = cosine_similarity([query_embedding], db_embeddings)[0]

    matched = []
    seen = set()

    for db_question, score in sorted(zip(db_questions, scores), key=lambda x: x[1], reverse=True):
        normalized_db_q = normalize_question(db_question)
        if score >= threshold and normalized_db_q not in seen:
            matched.append(db_question)
            seen.add(normalized_db_q)

        if len(matched) >= limit:
            break

    return matched


def find_duplicate_ids_for_new_question(question_text, threshold=0.95):
    normalized_q = normalize_question(question_text)

    try:
        df = pd.read_sql(
            "SELECT id, question_text, normalized_question FROM questions ORDER BY id ASC",
            engine
        )
    except Exception as e:
        print("Duplicate ID search error:", e)
        return []

    if df.empty:
        return []

    ids_to_delete = set()

    for _, row in df.iterrows():
        existing_normalized = str(row["normalized_question"]) if not pd.isna(row["normalized_question"]) else ""
        if existing_normalized == normalized_q:
            ids_to_delete.add(int(row["id"]))

    existing_questions = df["question_text"].tolist()
    existing_ids = df["id"].tolist()

    new_embedding = embedding_model.encode([question_text])[0]
    existing_embeddings = embedding_model.encode(existing_questions)
    similarities = cosine_similarity([new_embedding], existing_embeddings)[0]

    for i, score in enumerate(similarities):
        if score >= threshold:
            ids_to_delete.add(int(existing_ids[i]))

    return sorted(list(ids_to_delete))


def detect_topic_for_question(question):
    global topic_classifier, label_encoder

    question_lower = question.lower()

    rule_topic, rule_conf = detect_topic_by_rules(question)
    if rule_topic is not None and rule_conf >= 0.90:
        return rule_topic

    if any(contains_keyword(question_lower, term) for term in [
        "derivative", "differentiate", "differentiation",
        "integral", "integration", "limit", "calculus",
        "dy/dx", "partial derivative", "laplace",
        "taylor series", "matrix", "matrices",
        "determinant", "determinants"
    ]):
        return "Mathematics"

    if topic_classifier is not None and label_encoder is not None:
        try:
            emb = embedding_model.encode([question])
            probs = topic_classifier.predict_proba(emb)[0]
            pred_idx = int(np.argmax(probs))
            pred_label = label_encoder.inverse_transform([pred_idx])[0]
            pred_conf = float(np.max(probs))

            keyword_hits = 0
            if pred_label in KEYWORD_BONUS:
                keyword_hits = count_keyword_hits(question_lower, KEYWORD_BONUS[pred_label])

            if pred_conf >= 0.60 or keyword_hits >= 1:
                return pred_label
        except Exception as e:
            print("Classifier prediction error:", e)

    topic, _ = detect_topic_by_prototype(question)
    return topic


def group_questions_by_topic(questions):
    grouped = {topic: [] for topic in TOPIC_ORDER}
    seen_per_topic = {topic: set() for topic in TOPIC_ORDER}

    for question in questions:
        topic = detect_topic_for_question(question)
        if topic not in grouped:
            topic = "Others"

        normalized_q = normalize_question(question)

        if normalized_q not in seen_per_topic[topic]:
            grouped[topic].append(question)
            seen_per_topic[topic].add(normalized_q)

    grouped = {topic: qs for topic, qs in grouped.items() if qs}
    return grouped


def save_clustered_results(grouped_topics):
    rows = []
    cluster_number = 1

    for topic in TOPIC_ORDER:
        if topic in grouped_topics:
            for q in grouped_topics[topic]:
                rows.append({
                    "cluster": f"Cluster {cluster_number}",
                    "topic": topic,
                    "question": q
                })
            cluster_number += 1

    with engine.begin() as conn:
        conn.execute(text("DELETE FROM clustered_questions"))

    df = pd.DataFrame(rows)

    if not df.empty:
        df.to_sql(
            "clustered_questions",
            engine,
            if_exists="append",
            index=False
        )


def build_cluster_result(grouped_topics):
    result = []
    cluster_number = 1

    for topic in TOPIC_ORDER:
        if topic in grouped_topics:
            result.append({
                "cluster": f"Cluster {cluster_number}",
                "topic": topic,
                "questions": grouped_topics[topic]
            })
            cluster_number += 1

    return result


def rebuild_clustered_results_from_questions():
    try:
        df = pd.read_sql("SELECT question_text FROM questions ORDER BY id ASC", engine)

        if df.empty:
            with engine.begin() as conn:
                conn.execute(text("DELETE FROM clustered_questions"))
            return

        questions = df["question_text"].dropna().tolist()
        grouped_topics = group_questions_by_topic(questions)
        save_clustered_results(grouped_topics)

    except Exception as e:
        print("Rebuild cluster error:", e)


def refresh_models_and_clusters():
    build_subject_prototypes()
    auto_label_existing_questions()
    train_topic_classifier_from_db()
    rebuild_clustered_results_from_questions()


def process_uploaded_questions(question_list):
    if len(question_list) == 0:
        return {
            "message": "Files uploaded but no questions found",
            "questions_found": 0,
            "stored_in_db": 0,
            "duplicates_found": 0,
            "clusters_created": 0,
            "results": []
        }

    question_list = remove_internal_duplicates(question_list)

    try:
        df = pd.read_sql("SELECT normalized_question FROM questions", engine)
        existing_normalized = set(df["normalized_question"].dropna().tolist())
    except Exception:
        existing_normalized = set()

    saved_questions = []
    duplicate_questions = []

    with engine.begin() as conn:
        for q in question_list:
            normalized_q = normalize_question(q)

            if normalized_q in existing_normalized:
                duplicate_questions.append(q)
                continue

            try:
                predicted_topic = detect_topic_for_question(q)

                conn.execute(text("""
                    INSERT INTO questions (question_text, normalized_question, category)
                    VALUES (:question_text, :normalized_question, :category)
                """), {
                    "question_text": q,
                    "normalized_question": normalized_q,
                    "category": predicted_topic
                })

                existing_normalized.add(normalized_q)
                saved_questions.append(q)

            except Exception as e:
                print("Insert error:", e)
                duplicate_questions.append(q)

    delete_duplicate_questions()
    refresh_models_and_clusters()

    grouped_topics = group_questions_by_topic(saved_questions if saved_questions else question_list)
    result = build_cluster_result(grouped_topics)

    return {
        "questions_found": len(question_list),
        "stored_in_db": len(saved_questions),
        "duplicates_found": len(duplicate_questions),
        "clusters_created": len(result),
        "results": result
    }

def detect_difficulty(question_text):
    if not isinstance(question_text, str):
        return "Medium"

    q = question_text.lower()
    hard_words = [
        "explain in detail", "derive", "algorithm", "architecture",
        "implement", "optimize", "analyze", "justify"
    ]
    easy_words = [
        "define", "what is", "list", "name", "write short note",
        "mention", "state"
    ]

    if any(word in q for word in hard_words):
        return "Hard"
    if any(word in q for word in easy_words):
        return "Easy"
    return "Medium"

# ---------------------------
# Initial setup
# ---------------------------
ensure_tables()
build_subject_prototypes()
load_classifier()
ensure_normalized_column()
delete_duplicate_questions()
refresh_models_and_clusters()

# ---------------------------
# Upload API
# ---------------------------
@app.route("/upload", methods=["POST"])
def upload_files():
    uploaded_files = request.files.getlist("files")

    if not uploaded_files or len(uploaded_files) == 0:
        single_file = request.files.get("file")
        if single_file:
            uploaded_files = [single_file]

    if not uploaded_files or len(uploaded_files) == 0:
        return jsonify({"error": "No file uploaded"}), 400

    valid_files = [f for f in uploaded_files if f and f.filename.strip() != ""]

    if len(valid_files) == 0:
        return jsonify({"error": "No selected file"}), 400

    all_questions = []
    saved_file_names = []

    for file in valid_files:
        try:
            filename = safe_filename(file.filename)

            if not filename:
                continue

            if not allowed_file(filename):
                return jsonify({
                    "error": f"Unsupported file type: {filename}"
                }), 400

            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            saved_file_names.append(filename)

            text_data = extract_text_from_file(filepath)

            if not text_data.strip():
                print(f"{filename} -> no readable content found")
                continue

            questions = extract_questions(text_data)
            print(f"{filename} -> {len(questions)} questions found")
            all_questions.extend(questions)

        except Exception as e:
            return jsonify({
                "error": f"File read error in {file.filename}: {str(e)}"
            }), 500

    if len(saved_file_names) == 0:
        return jsonify({"error": "No valid files uploaded"}), 400

    processed = process_uploaded_questions(all_questions)

    return jsonify({
        "message": f"{len(saved_file_names)} file(s) uploaded and processed successfully",
        "files_uploaded": len(saved_file_names),
        "uploaded_files": saved_file_names,
        "questions_found": processed["questions_found"],
        "stored_in_db": processed["stored_in_db"],
        "duplicates_found": processed["duplicates_found"],
        "clusters_created": processed["clusters_created"],
        "results": processed["results"]
    }), 200

# ---------------------------
# Ask Question API
# ---------------------------
@app.route("/ask-question", methods=["POST"])
def ask_question():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        question = data.get("question", "").strip()

        if not question:
            return jsonify({"error": "Question is required"}), 400

        similar_db_questions = find_similar_questions_in_db(question, threshold=0.55, limit=15)

        all_matched_questions = [question]
        seen = {normalize_question(question)}

        for matched_q in similar_db_questions:
            normalized_matched = normalize_question(matched_q)
            if normalized_matched not in seen:
                all_matched_questions.append(matched_q)
                seen.add(normalized_matched)

        grouped_topics = group_questions_by_topic(all_matched_questions)
        save_clustered_results(grouped_topics)
        result = build_cluster_result(grouped_topics)

        predicted_topic = detect_topic_for_question(question)

        return jsonify({
            "message": "Question processed successfully",
            "predicted_topic": predicted_topic,
            "clusters": result
        })

    except Exception as e:
        print("Ask question error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Get Cluster Results
# ---------------------------
@app.route("/results", methods=["GET"])
def get_results():
    try:
        df = pd.read_sql("SELECT * FROM clustered_questions", engine)

        if df.empty:
            return jsonify([])

        grouped = []
        for (cluster, topic), group in df.groupby(["cluster", "topic"], sort=False):
            unique_questions = []
            seen = set()

            for q in group["question"].tolist():
                normalized_q = normalize_question(q)
                if normalized_q not in seen:
                    unique_questions.append(q)
                    seen.add(normalized_q)

            grouped.append({
                "cluster": cluster,
                "topic": topic,
                "questions": unique_questions
            })

        return jsonify(grouped)

    except Exception as e:
        print("Results error:", e)
        return jsonify([])

# ---------------------------
# Add Question
# ---------------------------
@app.route("/add-question", methods=["POST"])
def add_question():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        question_text = data.get("question_text", "").strip()
        category = data.get("category", "Manual").strip()

        if not question_text:
            return jsonify({"error": "Question is required"}), 400

        if category not in VALID_TOPICS:
            category = detect_topic_for_question(question_text)

        normalized_q = normalize_question(question_text)
        ids_to_delete = find_duplicate_ids_for_new_question(question_text, threshold=0.95)

        with engine.begin() as conn:
            deleted_questions = []

            for question_id in ids_to_delete:
                old_row = conn.execute(
                    text("SELECT question_text FROM questions WHERE id = :id"),
                    {"id": question_id}
                ).fetchone()

                if old_row:
                    deleted_questions.append(old_row[0])

                conn.execute(
                    text("DELETE FROM questions WHERE id = :id"),
                    {"id": question_id}
                )

            conn.execute(text("""
                INSERT INTO questions (question_text, normalized_question, category)
                VALUES (:question_text, :normalized_question, :category)
            """), {
                "question_text": question_text,
                "normalized_question": normalized_q,
                "category": category
            })

        delete_duplicate_questions()
        refresh_models_and_clusters()

        return jsonify({
            "message": "Question added successfully. Old duplicate/similar questions removed.",
            "added_question": question_text,
            "assigned_category": category,
            "deleted_old_duplicates_count": len(ids_to_delete),
            "semantic_deleted_after_insert": 0,
            "deleted_old_questions": deleted_questions
        }), 200

    except Exception as e:
        print("Add question error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Get Questions
# ---------------------------
@app.route("/questions", methods=["GET"])
def get_questions():
    try:
        df = pd.read_sql("SELECT * FROM questions ORDER BY id ASC", engine)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Delete Question
# ---------------------------
@app.route("/delete-question/<int:id>", methods=["DELETE"])
def delete_question(id):
    try:
        with engine.begin() as conn:
            row = conn.execute(
                text("SELECT id, question_text FROM questions WHERE id = :id"),
                {"id": id}
            ).fetchone()

            if not row:
                return jsonify({"error": "Question not found"}), 404

            conn.execute(
                text("DELETE FROM questions WHERE id = :id"),
                {"id": id}
            )

        refresh_models_and_clusters()

        return jsonify({
            "message": "Question deleted successfully",
            "deleted_id": id,
            "deleted_question": row[1]
        })

    except Exception as e:
        print("Delete question error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Delete File
# ---------------------------
@app.route("/delete-file/<path:filename>", methods=["DELETE"])
def delete_file(filename):
    try:
        clean_name = safe_filename(filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], clean_name)

        if not os.path.exists(filepath):
            return jsonify({"error": "File not found"}), 404

        os.remove(filepath)
        return jsonify({"message": "File deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Cleanup Duplicate Questions
# ---------------------------
@app.route("/cleanup-duplicates", methods=["DELETE"])
def cleanup_duplicates():
    try:
        delete_duplicate_questions()
        refresh_models_and_clusters()

        return jsonify({
            "message": "Duplicate questions cleaned successfully from database",
            "semantic_deleted_count": 0
        })

    except Exception as e:
        return jsonify({
            "error": f"Duplicate cleanup failed: {str(e)}"
        }), 500

# ---------------------------
# Training Status API
# ---------------------------
@app.route("/model-status", methods=["GET"])
def model_status():
    try:
        df = pd.read_sql(
            "SELECT category, COUNT(*) as count FROM questions GROUP BY category",
            engine
        )

        status = {
            "classifier_trained": topic_classifier is not None and label_encoder is not None,
            "topic_counts": df.to_dict(orient="records") if not df.empty else [],
            "uses_sentence_transformer": True,
            "uses_logistic_regression": topic_classifier is not None
        }

        return jsonify(status)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Auto-label DB API
# ---------------------------
@app.route("/auto-label-db", methods=["POST"])
def auto_label_db():
    try:
        updated_count = auto_label_existing_questions()
        train_topic_classifier_from_db()
        rebuild_clustered_results_from_questions()

        return jsonify({
            "message": "Existing database questions auto-labeled successfully",
            "updated_count": updated_count,
            "classifier_trained": topic_classifier is not None and label_encoder is not None
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Files List
# ---------------------------
@app.route("/files", methods=["GET"])
def get_files():
    try:
        files = os.listdir(app.config["UPLOAD_FOLDER"])
        return jsonify({"uploaded_files": files})
    except Exception as e:
        return jsonify({"error": str(e), "uploaded_files": []}), 500

# ---------------------------
# Dashboard Stats API
# ---------------------------
@app.route("/dashboard-stats", methods=["GET"])
def dashboard_stats():
    try:
        with engine.begin() as conn:
            total_questions = conn.execute(text("SELECT COUNT(*) FROM questions")).scalar() or 0
            labeled_questions = conn.execute(
                text("SELECT COUNT(*) FROM questions WHERE category IS NOT NULL AND category <> ''")
            ).scalar() or 0
            total_categories = conn.execute(
                text("SELECT COUNT(DISTINCT category) FROM questions WHERE category IS NOT NULL AND category <> ''")
            ).scalar() or 0

        files_count = len(os.listdir(app.config["UPLOAD_FOLDER"]))

        return jsonify({
            "total_uploaded_files": int(files_count),
            "total_questions": int(total_questions),
            "labeled_questions": int(labeled_questions),
            "total_categories": int(total_categories),
            "classifier_trained": topic_classifier is not None and label_encoder is not None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Topic Distribution API
# ---------------------------
@app.route("/topic-distribution", methods=["GET"])
def topic_distribution():
    try:
        df = pd.read_sql("""
            SELECT category, COUNT(*) AS count
            FROM questions
            WHERE category IS NOT NULL AND category <> ''
            GROUP BY category
            ORDER BY count DESC, category ASC
        """, engine)

        if df.empty:
            return jsonify([])

        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Track User Activity API
# ---------------------------
@app.route("/track-activity", methods=["POST"])
def track_activity():
    try:
        data = request.get_json() or {}

        user_name = str(data.get("user_name", "Unknown User")).strip()
        question_text = str(data.get("question_text", "")).strip()
        subject = str(data.get("subject", "Others")).strip()
        action_type = str(data.get("action_type", "view_question")).strip()

        try:
            time_spent_seconds = int(data.get("time_spent_seconds", 0))
        except Exception:
            time_spent_seconds = 0

        if not subject or subject not in VALID_TOPICS:
            subject = "Others"

        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO user_activity (
                    user_name, question_text, subject, action_type, time_spent_seconds
                )
                VALUES (
                    :user_name, :question_text, :subject, :action_type, :time_spent_seconds
                )
            """), {
                "user_name": user_name,
                "question_text": question_text,
                "subject": subject,
                "action_type": action_type,
                "time_spent_seconds": time_spent_seconds
            })

        return jsonify({
            "message": "Activity tracked successfully"
        }), 200

    except Exception as e:
        print("Track activity error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# User Analytics API
# ---------------------------
@app.route("/user-analytics", methods=["GET"])
def user_analytics():
    try:
        user_name = request.args.get("user_name", None)

        base_query = "SELECT * FROM user_activity"
        params = {}

        if user_name:
            base_query += " WHERE user_name = :user_name"
            params["user_name"] = user_name

        df = pd.read_sql(text(base_query), engine, params=params)

        if df.empty:
            return jsonify({
                "summary": {
                    "total_time_spent_seconds": 0,
                    "total_questions_viewed": 0,
                    "total_subjects_seen": 0,
                    "avg_time_per_question": 0
                },
                "subject_usage": [],
                "daily_usage": [],
                "difficulty_pattern": [],
                "recent_activity": []
            })

        df["question_text"] = df["question_text"].fillna("")
        df["subject"] = df["subject"].fillna("Others")
        df["action_type"] = df["action_type"].fillna("view_question")
        df["time_spent_seconds"] = pd.to_numeric(df["time_spent_seconds"], errors="coerce").fillna(0).astype(int)

        total_time_spent_seconds = int(df["time_spent_seconds"].sum())
        total_questions_viewed = int((df["action_type"] == "view_question").sum())
        total_subjects_seen = int(df["subject"].nunique())
        avg_time_per_question = round(
            total_time_spent_seconds / total_questions_viewed, 2
        ) if total_questions_viewed > 0 else 0

        subject_usage_df = (
            df.groupby("subject")
            .agg(
                questions_viewed=("question_text", "count"),
                total_time_spent=("time_spent_seconds", "sum")
            )
            .reset_index()
            .sort_values(by="questions_viewed", ascending=False)
        )

        df["viewed_at"] = pd.to_datetime(df["viewed_at"], errors="coerce")
        df = df.dropna(subset=["viewed_at"])
        df["view_date"] = df["viewed_at"].dt.date.astype(str)

        daily_usage_df = (
            df.groupby("view_date")
            .agg(
                total_time_spent=("time_spent_seconds", "sum"),
                questions_viewed=("question_text", "count")
            )
            .reset_index()
            .sort_values(by="view_date", ascending=True)
        )

        df["difficulty"] = df["question_text"].apply(detect_difficulty)

        difficulty_df = (
            df.groupby("difficulty")
            .size()
            .reset_index(name="count")
            .sort_values(by="count", ascending=False)
        )

        recent_activity_df = df.sort_values(by="viewed_at", ascending=False).head(8)

        return jsonify({
            "summary": {
                "total_time_spent_seconds": total_time_spent_seconds,
                "total_questions_viewed": total_questions_viewed,
                "total_subjects_seen": total_subjects_seen,
                "avg_time_per_question": avg_time_per_question
            },
            "subject_usage": subject_usage_df.to_dict(orient="records"),
            "daily_usage": daily_usage_df.to_dict(orient="records"),
            "difficulty_pattern": difficulty_df.to_dict(orient="records"),
            "recent_activity": recent_activity_df[
                ["user_name", "question_text", "subject", "action_type", "time_spent_seconds", "viewed_at"]
            ].to_dict(orient="records")
        }), 200

    except Exception as e:
        print("User analytics error:", e)
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Home
# ---------------------------
@app.route("/")
def home():
    return "Flask Server Running Successfully"

# ---------------------------
# Run Server
# ---------------------------
if __name__ == "__main__":
    app.run(debug=True)