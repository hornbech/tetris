from datetime import datetime, timezone
from app import db


class Score(db.Model):
    __tablename__ = "scores"

    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(20), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    lines = db.Column(db.Integer, nullable=False)
    level = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "player_name": self.player_name,
            "score": self.score,
            "lines": self.lines,
            "level": self.level,
            "created_at": self.created_at.isoformat(),
        }
