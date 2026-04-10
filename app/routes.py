from flask import Blueprint, request, jsonify, render_template
from app import db
from app.models import Score

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/api/scores", methods=["GET"])
def get_scores():
    limit = request.args.get("limit", 10, type=int)
    limit = min(limit, 100)
    scores = Score.query.order_by(Score.score.desc()).limit(limit).all()
    return jsonify([s.to_dict() for s in scores])


@main.route("/api/scores", methods=["POST"])
def post_score():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    player_name = data.get("player_name", "").strip()
    if not player_name or len(player_name) > 20:
        return jsonify({"error": "player_name required (max 20 chars)"}), 400

    score_val = data.get("score")
    lines_val = data.get("lines")
    level_val = data.get("level")

    if not all(isinstance(v, int) and v >= 0 for v in [score_val, lines_val, level_val]):
        return jsonify({"error": "score, lines, level must be non-negative integers"}), 400

    entry = Score(
        player_name=player_name,
        score=score_val,
        lines=lines_val,
        level=level_val,
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201
