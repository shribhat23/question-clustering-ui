import os
import re
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import create_engine, text

import spacy
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)

# ---------------------------
# Load NLP Models
# ---------------------------
nlp = spacy.load("en_core_web_sm")
model = SentenceTransformer("all-MiniLM-L6-v2")

# ---------------------------
# Upload Folder
# ---------------------------
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ---------------------------
# MySQL Connection
# ---------------------------
engine = create_engine(
    "mysql+pymysql://root:shribhat1350@localhost/clustering_db"
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

TOPIC_EXAMPLES = {
    "Mathematics": [
        "Find the LCM of 60 and 25",
        "Define LCM",
        "Define algebraic sum",
        "Solve x + 2 = 5",
        "Calculate the area of a circle",
        "Find the HCF of 24 and 36",
        "Explain probability"
    ],
    "Physics": [
        "Define force",
        "What is velocity?",
        "State Ohm's law"
    ],
    "Chemistry": [
        "Define atom",
        "Explain chemical bonding",
        "Define acid and base"
    ],
    "Biology": [
        "Define cell",
        "Explain photosynthesis",
        "What is respiration?"
    ],
    "Python": [
        "What is Python?",
        "Explain for loop in Python",
        "What is a function in Python?"
    ],
    "Java": [
        "What is Java?",
        "What is JVM?",
        "Define constructor in Java"
    ],
    "C Programming": [
        "What is C language?",
        "Explain pointers in C",
        "Define array in C"
    ],
    "C++ Programming": [
        "What is C++?",
        "What is polymorphism in C++?",
        "Define constructor in C++"
    ],
    "Object Oriented Programming": [
        "What is Object Oriented Programming?",
        "Explain OOP concepts",
        "Explain inheritance and polymorphism"
    ],
    "Data Structures": [
        "What is stack?",
        "Define linked list",
        "What is binary tree?"
    ],
    "DBMS": [
        "What is DBMS?",
        "Explain normalization",
        "Define primary key"
    ],
    "Operating System": [
        "What is operating system?",
        "Define deadlock",
        "What is paging?"
    ],
    "Computer Networks": [
        "What is computer network?",
        "Explain OSI model",
        "What is TCP/IP?"
    ],
    "Web Development": [
        "What is HTML?",
        "Explain CSS",
        "What is JavaScript?"
    ],
    "Data Mining": [
        "What is Data Mining?",
        "Define clustering",
        "Applications of Data Mining"
    ],
    "Natural Language Processing": [
        "What is NLP?",
        "Explain tokenization",
        "Applications of NLP"
    ],
    "Computer Vision": [
        "What is Computer Vision?",
        "Define object detection",
        "Explain image processing"
    ],
    "Artificial Intelligence": [
        "What is Artificial Intelligence?",
        "Define intelligent agent",
        "Applications of AI"
    ],
    "Machine Learning": [
        "What is Machine Learning?",
        "Explain supervised learning",
        "Define unsupervised learning"
    ],
    "Big Data": [
        "What is Big Data?",
        "Explain Hadoop",
        "Applications of Big Data"
    ],
    "Cloud Computing": [
        "What is Cloud Computing?",
        "Explain SaaS",
        "Define IaaS"
    ],
    "Others": [
        "General subject question"
    ]
}

# ---------------------------
# Keyword Bonus
# ---------------------------
KEYWORD_BONUS = {
    "Mathematics": [
        "lcm", "hcf", "algebra", "algebraic", "sum",
        "probability", "equation", "mean", "median", "mode",
        "area", "perimeter", "volume", "fraction", "ratio"
    ],
    "Physics": ["force", "velocity", "acceleration", "ohm", "motion"],
    "Chemistry": ["atom", "molecule", "acid", "base", "bond"],
    "Biology": ["cell", "photosynthesis", "respiration", "tissue"],
    "Python": ["python", "for loop", "while loop", "function"],
    "Java": ["java", "jvm", "constructor", "interface"],
    "C Programming": ["pointer", "printf", "scanf", "structure"],
    "C++ Programming": ["c++", "destructor", "template"],
    "Object Oriented Programming": ["oop", "inheritance", "polymorphism", "encapsulation"],
    "Data Structures": ["stack", "queue", "linked list", "tree", "graph"],
    "DBMS": ["dbms", "sql", "normalization", "primary key"],
    "Operating System": ["deadlock", "paging", "process", "thread"],
    "Computer Networks": ["osi", "tcp", "ip", "routing", "topology"],
    "Web Development": ["html", "css", "javascript", "responsive"],
    "Data Mining": ["data mining", "clustering", "classification", "association"],
    "Natural Language Processing": ["nlp", "tokenization", "stemming", "lemmatization"],
    "Computer Vision": ["opencv", "image", "segmentation", "object detection"],
    "Artificial Intelligence": ["ai", "agent", "expert system", "heuristic"],
    "Machine Learning": ["machine learning", "supervised", "unsupervised", "regression"],
    "Big Data": ["big data", "hadoop", "spark"],
    "Cloud Computing": ["cloud", "saas", "paas", "iaas"]
}

# ---------------------------
# Create subject prototype embeddings
# ---------------------------
subject_prototypes = {}
for topic, examples in TOPIC_EXAMPLES.items():
    embeddings = model.encode(examples)
    subject_prototypes[topic] = embeddings.mean(axis=0)

# ---------------------------
# Normalize Question
# ---------------------------
def normalize_question(question):
    question = question.strip().lower()
    question = re.sub(r"[^\w\s]", "", question)
    question = re.sub(r"\s+", " ", question)
    return question

# ---------------------------
# Ensure normalized_question column exists
# ---------------------------
def ensure_normalized_column():
    try:
        with engine.connect() as conn:
            columns = pd.read_sql("SHOW COLUMNS FROM questions", conn)

            if "normalized_question" not in columns["Field"].tolist():
                conn.execute(text(
                    "ALTER TABLE questions ADD COLUMN normalized_question VARCHAR(500)"
                ))
                conn.commit()

            df = pd.read_sql(
                "SELECT id, question_text, normalized_question FROM questions",
                conn
            )

            for _, row in df.iterrows():
                normalized_q = normalize_question(row["question_text"])

                if row["normalized_question"] != normalized_q:
                    conn.execute(text("""
                        UPDATE questions
                        SET normalized_question = :normalized_question
                        WHERE id = :id
                    """), {
                        "normalized_question": normalized_q,
                        "id": int(row["id"])
                    })

            conn.commit()

    except Exception as e:
        print("Warning:", e)

# ---------------------------
# Delete exact duplicate questions from DB
# ---------------------------
def delete_duplicate_questions():
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                DELETE q1
                FROM questions q1
                JOIN questions q2
                  ON q1.normalized_question = q2.normalized_question
                 AND q1.id > q2.id
            """))
            conn.commit()
    except Exception as e:
        print("Duplicate cleanup error:", e)

# ---------------------------
# Delete very-near semantic duplicates from DB
# Keeps different numeric questions separate
# ---------------------------
def delete_semantic_duplicate_questions(threshold=0.95):
    try:
        df = pd.read_sql(
            "SELECT id, question_text FROM questions ORDER BY id",
            engine
        )

        if df.empty or len(df) < 2:
            return 0

        questions = df["question_text"].tolist()
        ids = df["id"].tolist()
        embeddings = model.encode(questions)

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
            with engine.connect() as conn:
                for question_id in ids_to_delete:
                    result = conn.execute(
                        text("DELETE FROM questions WHERE id = :id"),
                        {"id": int(question_id)}
                    )
                    deleted_count += result.rowcount
                conn.commit()

        return deleted_count

    except Exception as e:
        print("Semantic duplicate cleanup error:", e)
        return 0

ensure_normalized_column()
delete_duplicate_questions()
delete_semantic_duplicate_questions()

# ---------------------------
# Extract Questions
# ---------------------------
def extract_questions(text_data):
    questions = []

    question_words = [
        "what", "why", "how", "when", "where", "who", "which",
        "define", "explain", "describe", "write", "list",
        "mention", "differentiate", "find", "calculate",
        "solve", "evaluate", "state", "discuss", "prove",
        "derive", "compare", "identify", "name"
    ]

    lines = text_data.splitlines()

    for line in lines:
        sentence = line.strip()

        if not sentence:
            continue

        sentence = re.sub(r"\s+", " ", sentence)

        if sentence.endswith("?"):
            questions.append(sentence)
            continue

        words = sentence.split()
        if len(words) == 0:
            continue

        if words[0].lower() in question_words:
            questions.append(sentence)

    return questions

# ---------------------------
# Remove exact duplicates from uploaded questions
# ---------------------------
def remove_internal_duplicates(questions):
    unique_questions = []
    seen = set()

    for question in questions:
        normalized_q = normalize_question(question)
        if normalized_q not in seen:
            seen.add(normalized_q)
            unique_questions.append(question)

    return unique_questions

# ---------------------------
# Duplicate Detection with Database
# Only exact + very-near semantic duplicates
# ---------------------------
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
    new_embedding = model.encode([question])[0]
    db_embeddings = model.encode(db_questions)

    similarities = cosine_similarity([new_embedding], db_embeddings)[0]
    return max(similarities) > threshold

# ---------------------------
# Find Similar Questions in DB
# ---------------------------
def find_similar_questions_in_db(question, threshold=0.60):
    try:
        df = pd.read_sql("SELECT question_text FROM questions", engine)
    except Exception:
        return []

    if df.empty:
        return []

    db_questions = df["question_text"].tolist()
    query_embedding = model.encode([question])[0]
    db_embeddings = model.encode(db_questions)

    scores = cosine_similarity([query_embedding], db_embeddings)[0]

    similar_questions = []
    seen = set()

    for db_question, score in zip(db_questions, scores):
        normalized_db_q = normalize_question(db_question)
        if score >= threshold and normalized_db_q not in seen:
            similar_questions.append(db_question)
            seen.add(normalized_db_q)

    return similar_questions

# ---------------------------
# Detect Topic for a Question
# ---------------------------
def detect_topic_for_question(question):
    question_lower = question.lower()
    question_embedding = model.encode([question])[0]

    subject_scores = {}

    for topic, prototype_embedding in subject_prototypes.items():
        score = cosine_similarity([question_embedding], [prototype_embedding])[0][0]
        subject_scores[topic] = float(score)

    for topic, keywords in KEYWORD_BONUS.items():
        for kw in keywords:
            if kw in question_lower:
                subject_scores[topic] += 0.15

    best_topic = max(subject_scores, key=subject_scores.get)
    best_score = subject_scores[best_topic]

    if best_score < 0.30:
        return "Others"

    return best_topic

# ---------------------------
# Group Questions by Topic
# ---------------------------
def group_questions_by_topic(questions):
    grouped = {topic: [] for topic in TOPIC_ORDER}
    seen_per_topic = {topic: set() for topic in TOPIC_ORDER}

    for question in questions:
        topic = detect_topic_for_question(question)
        normalized_q = normalize_question(question)

        if normalized_q not in seen_per_topic[topic]:
            grouped[topic].append(question)
            seen_per_topic[topic].add(normalized_q)

    grouped = {topic: qs for topic, qs in grouped.items() if qs}
    return grouped

# ---------------------------
# Single File Upload API
# ---------------------------
@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            text_data = f.read()
    except Exception as e:
        return jsonify({"error": f"File read error: {str(e)}"}), 500

    questions = extract_questions(text_data)

    if len(questions) == 0:
        return jsonify({
            "message": "File uploaded but no questions found",
            "results": []
        }), 200

    questions = remove_internal_duplicates(questions)

    saved_questions = []
    duplicate_questions = []

    with engine.connect() as conn:
        for q in questions:
            if is_duplicate_in_db(q, threshold=0.95):
                duplicate_questions.append(q)
                continue

            normalized_q = normalize_question(q)

            try:
                conn.execute(text("""
                    INSERT INTO questions (question_text, normalized_question, category)
                    VALUES (:question_text, :normalized_question, :category)
                """), {
                    "question_text": q,
                    "normalized_question": normalized_q,
                    "category": "Auto"
                })
                saved_questions.append(q)
            except Exception:
                duplicate_questions.append(q)

        conn.commit()

    delete_duplicate_questions()
    delete_semantic_duplicate_questions()

    all_matched_questions = []
    seen_all = set()

    for q in questions:
        normalized_q = normalize_question(q)
        if normalized_q not in seen_all:
            all_matched_questions.append(q)
            seen_all.add(normalized_q)

        similar_db_questions = find_similar_questions_in_db(q, threshold=0.60)

        for matched_q in similar_db_questions:
            normalized_matched = normalize_question(matched_q)
            if normalized_matched not in seen_all:
                all_matched_questions.append(matched_q)
                seen_all.add(normalized_matched)

    grouped_topics = group_questions_by_topic(all_matched_questions)

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

    df = pd.DataFrame(rows)

    if not df.empty:
        df.to_sql(
            "clustered_questions",
            engine,
            if_exists="replace",
            index=False
        )

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

    return jsonify({
        "message": "File uploaded, similar questions found, and results generated successfully",
        "questions_found": len(questions),
        "stored_in_db": len(saved_questions),
        "duplicates_found": len(duplicate_questions),
        "clusters_created": len(result),
        "results": result
    })

# ---------------------------
# Multiple Files Upload API
# ---------------------------
@app.route("/upload-multiple", methods=["POST"])
def upload_multiple_files():
    if "files" not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    files = request.files.getlist("files")

    if not files or files[0].filename == "":
        return jsonify({"error": "No selected files"}), 400

    all_questions = []

    for file in files:
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(filepath)

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                text_data = f.read()
        except Exception as e:
            return jsonify({"error": f"File read error in {file.filename}: {str(e)}"}), 500

        questions = extract_questions(text_data)
        all_questions.extend(questions)

    if len(all_questions) == 0:
        return jsonify({
            "message": "Files uploaded but no questions found",
            "results": []
        }), 200

    all_questions = remove_internal_duplicates(all_questions)

    saved_questions = []
    duplicate_questions = []

    with engine.connect() as conn:
        for q in all_questions:
            if is_duplicate_in_db(q, threshold=0.95):
                duplicate_questions.append(q)
                continue

            normalized_q = normalize_question(q)

            try:
                conn.execute(text("""
                    INSERT INTO questions (question_text, normalized_question, category)
                    VALUES (:question_text, :normalized_question, :category)
                """), {
                    "question_text": q,
                    "normalized_question": normalized_q,
                    "category": "Auto"
                })
                saved_questions.append(q)
            except Exception:
                duplicate_questions.append(q)

        conn.commit()

    delete_duplicate_questions()
    delete_semantic_duplicate_questions()

    all_matched_questions = []
    seen_all = set()

    for q in all_questions:
        normalized_q = normalize_question(q)
        if normalized_q not in seen_all:
            all_matched_questions.append(q)
            seen_all.add(normalized_q)

        similar_db_questions = find_similar_questions_in_db(q, threshold=0.60)

        for matched_q in similar_db_questions:
            normalized_matched = normalize_question(matched_q)
            if normalized_matched not in seen_all:
                all_matched_questions.append(matched_q)
                seen_all.add(normalized_matched)

    grouped_topics = group_questions_by_topic(all_matched_questions)

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

    df = pd.DataFrame(rows)

    if not df.empty:
        df.to_sql(
            "clustered_questions",
            engine,
            if_exists="replace",
            index=False
        )

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

    return jsonify({
        "message": "Multiple files uploaded and clustered successfully",
        "files_uploaded": len(files),
        "questions_found": len(all_questions),
        "stored_in_db": len(saved_questions),
        "duplicates_found": len(duplicate_questions),
        "clusters_created": len(result),
        "results": result
    })

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

    except Exception:
        return jsonify([])

# ---------------------------
# Add Question
# ---------------------------
@app.route("/add-question", methods=["POST"])
def add_question():
    data = request.json
    question_text = data.get("question_text", "").strip()
    category = data.get("category", "Manual")

    if not question_text:
        return jsonify({"error": "Question is required"}), 400

    if is_duplicate_in_db(question_text, threshold=0.95):
        return jsonify({"message": "Duplicate question detected"})

    normalized_q = normalize_question(question_text)

    query = text("""
        INSERT INTO questions (question_text, normalized_question, category)
        VALUES (:question_text, :normalized_question, :category)
    """)

    try:
        with engine.connect() as conn:
            conn.execute(query, {
                "question_text": question_text,
                "normalized_question": normalized_q,
                "category": category
            })
            conn.commit()

        delete_duplicate_questions()
        delete_semantic_duplicate_questions()

    except Exception:
        return jsonify({"message": "Duplicate question detected"})

    return jsonify({"message": "Question added successfully"})

# ---------------------------
# Get Questions
# ---------------------------
@app.route("/questions", methods=["GET"])
def get_questions():
    try:
        df = pd.read_sql("SELECT * FROM questions", engine)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Delete Question
# ---------------------------
@app.route("/delete-question/<int:id>", methods=["DELETE"])
def delete_question(id):
    query = text("""
        DELETE FROM questions
        WHERE id = :id
    """)

    with engine.connect() as conn:
        result = conn.execute(query, {"id": id})
        conn.commit()

    if result.rowcount == 0:
        return jsonify({"error": "Question not found"}), 404

    return jsonify({"message": "Question deleted"})

# ---------------------------
# Cleanup Duplicate Questions
# ---------------------------
@app.route("/cleanup-duplicates", methods=["DELETE"])
def cleanup_duplicates():
    try:
        delete_duplicate_questions()
        semantic_deleted = delete_semantic_duplicate_questions()

        return jsonify({
            "message": "Duplicate questions cleaned successfully from database",
            "semantic_deleted_count": semantic_deleted
        })

    except Exception as e:
        return jsonify({
            "error": f"Duplicate cleanup failed: {str(e)}"
        }), 500

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