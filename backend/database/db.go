package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func Init(dbPath string) error {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create db directory: %w", err)
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// ── Connection Pool Tuning ──
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(10)
	DB.SetConnMaxLifetime(30 * time.Minute)

	// ── SQLite Performance PRAGMAs ──
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA busy_timeout=5000",
		"PRAGMA synchronous=NORMAL",
		"PRAGMA cache_size=-20000",
		"PRAGMA foreign_keys=ON",
		"PRAGMA temp_store=MEMORY",
	}
	for _, p := range pragmas {
		if _, err := DB.Exec(p); err != nil {
			return fmt.Errorf("failed to set pragma %q: %w", p, err)
		}
	}

	return migrate()
}

func migrate() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS predictions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			n REAL NOT NULL,
			p REAL NOT NULL,
			k REAL NOT NULL,
			temperature REAL NOT NULL,
			humidity REAL NOT NULL,
			ph REAL NOT NULL,
			rainfall REAL NOT NULL,
			result TEXT NOT NULL,
			confidence REAL NOT NULL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS chat_messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
			content TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS audit_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER,
			action TEXT NOT NULL,
			ip_address TEXT NOT NULL DEFAULT '',
			user_agent TEXT NOT NULL DEFAULT '',
			details TEXT NOT NULL DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_predictions_user_date ON predictions(user_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_chat_user_date ON chat_messages(user_id, created_at ASC)`,
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_user_date ON audit_logs(user_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_action_date ON audit_logs(action, created_at DESC)`,
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			return fmt.Errorf("migration failed: %w\nQuery: %s", err, q)
		}
	}

	// Add avatar_url column if not present (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
	_, _ = DB.Exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''`)

	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}

// InsertAuditLog stores a security event for forensic analysis.
func InsertAuditLog(userID int64, action, ip, userAgent, details string) {
	_, _ = DB.Exec(
		"INSERT INTO audit_logs (user_id, action, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?)",
		userID, action, ip, userAgent, details,
	)
}
