package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"prediksi-tanaman/database"
	"prediksi-tanaman/middleware"
	"prediksi-tanaman/models"

	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// Allowed MIME types for avatar uploads
var allowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

const (
	maxNameLength     = 100
	minPasswordLength = 8
	maxPasswordLength = 72              // bcrypt limit
	maxAvatarSize     = 2 * 1024 * 1024 // 2 MB
	bcryptCost        = 12
	jwtExpiry         = 24 * time.Hour
)

// validatePassword enforces strong password policy
func validatePassword(password string) string {
	if len(password) < minPasswordLength {
		return fmt.Sprintf("Password minimal %d karakter", minPasswordLength)
	}
	if len(password) > maxPasswordLength {
		return fmt.Sprintf("Password maksimal %d karakter", maxPasswordLength)
	}
	var hasUpper, hasLower, hasDigit bool
	for _, ch := range password {
		switch {
		case ch >= 'A' && ch <= 'Z':
			hasUpper = true
		case ch >= 'a' && ch <= 'z':
			hasLower = true
		case ch >= '0' && ch <= '9':
			hasDigit = true
		}
	}
	if !hasUpper {
		return "Password harus mengandung minimal 1 huruf besar (A-Z)"
	}
	if !hasLower {
		return "Password harus mengandung minimal 1 huruf kecil (a-z)"
	}
	if !hasDigit {
		return "Password harus mengandung minimal 1 angka (0-9)"
	}
	return ""
}

type AuthHandler struct {
	JWTSecret string
}

func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{JWTSecret: jwtSecret}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req models.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format request tidak valid"})
	}

	// Trim whitespace
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	// Validate name
	if req.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Nama wajib diisi"})
	}
	if len(req.Name) > maxNameLength {
		return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("Nama maksimal %d karakter", maxNameLength)})
	}

	// Validate email
	if req.Email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email wajib diisi"})
	}
	if !emailRegex.MatchString(req.Email) {
		return c.Status(400).JSON(fiber.Map{"error": "Format email tidak valid"})
	}

	// Validate password strength
	if errMsg := validatePassword(req.Password); errMsg != "" {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memproses password"})
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	result, err := database.DB.ExecContext(ctx,
		"INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
		req.Name, req.Email, string(hashed),
	)
	if err != nil {
		return c.Status(409).JSON(fiber.Map{"error": "Email sudah terdaftar"})
	}

	userID, err := result.LastInsertId()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat akun"})
	}

	user := models.User{
		ID: userID, Name: req.Name, Email: req.Email, CreatedAt: time.Now(),
	}

	database.InsertAuditLog(userID, "register", c.IP(), string(c.Request().Header.UserAgent()), "Registered new account")

	token, err := h.generateToken(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat token otentikasi"})
	}

	return c.Status(201).JSON(models.AuthResponse{Token: token, User: user})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format request tidak valid"})
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email dan password wajib diisi"})
	}

	var user models.User
	var hashedPassword string

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	err := database.DB.QueryRowContext(ctx,
		"SELECT id, name, email, password, avatar_url, created_at FROM users WHERE email = ?", req.Email,
	).Scan(&user.ID, &user.Name, &user.Email, &hashedPassword, &user.AvatarURL, &user.CreatedAt)
	if err != nil {
		// Cannot log failed attempt with user ID since user is not found, log with IP in details
		database.InsertAuditLog(0, "login_failed", c.IP(), string(c.Request().Header.UserAgent()), fmt.Sprintf("Email not found: %s", req.Email))
		return c.Status(401).JSON(fiber.Map{"error": "Email atau password salah"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		database.InsertAuditLog(user.ID, "login_failed", c.IP(), string(c.Request().Header.UserAgent()), "Incorrect password")
		return c.Status(401).JSON(fiber.Map{"error": "Email atau password salah"})
	}

	database.InsertAuditLog(user.ID, "login_success", c.IP(), string(c.Request().Header.UserAgent()), "")

	token, err := h.generateToken(user.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat token otentikasi"})
	}

	return c.JSON(models.AuthResponse{Token: token, User: user})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var user models.User
	err := database.DB.QueryRow(
		"SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?", userID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.AvatarURL, &user.CreatedAt)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Pengguna tidak ditemukan"})
	}

	return c.JSON(user)
}

func (h *AuthHandler) UpdateName(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req struct {
		Name string `json:"name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format request tidak valid"})
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Nama wajib diisi"})
	}
	if len(req.Name) > maxNameLength {
		return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("Nama maksimal %d karakter", maxNameLength)})
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if _, err := database.DB.ExecContext(ctx, "UPDATE users SET name = ? WHERE id = ?", req.Name, userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui nama"})
	}

	var user models.User
	if err := database.DB.QueryRowContext(ctx,
		"SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?", userID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.AvatarURL, &user.CreatedAt); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data pengguna"})
	}

	token, err := h.generateToken(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat token otentikasi"})
	}
	return c.JSON(models.AuthResponse{Token: token, User: user})
}

func (h *AuthHandler) UpdatePassword(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format request tidak valid"})
	}
	if req.OldPassword == "" || req.NewPassword == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Password lama dan baru wajib diisi"})
	}
	if errMsg := validatePassword(req.NewPassword); errMsg != "" {
		return c.Status(400).JSON(fiber.Map{"error": errMsg})
	}

	var hashedPassword string
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := database.DB.QueryRowContext(ctx, "SELECT password FROM users WHERE id = ?", userID).Scan(&hashedPassword); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Pengguna tidak ditemukan"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.OldPassword)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Password lama salah"})
	}

	newHashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcryptCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memproses password baru"})
	}

	if _, err = database.DB.ExecContext(ctx, "UPDATE users SET password = ? WHERE id = ?", string(newHashed), userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui password"})
	}

	database.InsertAuditLog(userID, "password_changed", c.IP(), string(c.Request().Header.UserAgent()), "Password changed successfully")

	return c.JSON(fiber.Map{"message": "Password berhasil diubah"})
}

func (h *AuthHandler) UpdateAvatar(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req struct {
		AvatarURL string `json:"avatar_url"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Format request tidak valid"})
	}

	req.AvatarURL = strings.TrimSpace(req.AvatarURL)
	if len(req.AvatarURL) > 500 {
		return c.Status(400).JSON(fiber.Map{"error": "URL avatar terlalu panjang"})
	}

	if _, err := database.DB.Exec("UPDATE users SET avatar_url = ? WHERE id = ?", req.AvatarURL, userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memperbarui avatar"})
	}

	var user models.User
	if err := database.DB.QueryRow(
		"SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?", userID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.AvatarURL, &user.CreatedAt); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data pengguna"})
	}

	token, err := h.generateToken(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat token otentikasi"})
	}
	return c.JSON(models.AuthResponse{Token: token, User: user})
}

func (h *AuthHandler) UploadAvatar(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	file, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "File upload gagal atau tidak ditemukan"})
	}

	// Validate file size
	if file.Size > maxAvatarSize {
		return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("Ukuran file avatar maksimal %d MB", maxAvatarSize/(1024*1024))})
	}

	// Validate content type
	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membaca file"})
	}
	defer src.Close()

	buf := make([]byte, 512)
	if _, err = src.Read(buf); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membaca file header"})
	}
	contentType := http.DetectContentType(buf)
	if !allowedImageTypes[contentType] {
		return c.Status(400).JSON(fiber.Map{"error": "Tipe file tidak diizinkan. Gunakan JPEG, PNG, WebP, atau GIF"})
	}

	// Create upload directory
	uploadDir := "../frontend/public/uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat direktori upload"})
	}

	// Sanitize filename — use only userID + timestamp
	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	filename := fmt.Sprintf("avatar_%d_%d%s", userID, time.Now().Unix(), ext)
	savePath := filepath.Join(uploadDir, filename)

	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan file"})
	}

	avatarURL := fmt.Sprintf("/uploads/%s", filename)

	if _, err = database.DB.Exec("UPDATE users SET avatar_url = ? WHERE id = ?", avatarURL, userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan avatar ke database"})
	}

	var user models.User
	if err := database.DB.QueryRow(
		"SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?", userID,
	).Scan(&user.ID, &user.Name, &user.Email, &user.AvatarURL, &user.CreatedAt); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data pengguna"})
	}

	token, err := h.generateToken(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal membuat token otentikasi"})
	}
	return c.JSON(models.AuthResponse{Token: token, User: user})
}

func (h *AuthHandler) generateToken(userID int64) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(jwtExpiry).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.JWTSecret))
}
