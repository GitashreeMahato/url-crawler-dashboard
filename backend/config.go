package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port   string
	DBUser string
	DBPass string
	DBHost string
	DBPort string
	DBName string
}

var AppConfig Config

func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Println(".env file is not found. Using system env variables.")
	}
	AppConfig = Config{
		Port:   getEnv("PORT", "8080"),
		DBUser: getEnv("DB_USER", "root"),
		DBPass: getEnv("DB_PASS", ""),
		DBHost: getEnv("DB_HOST", "127.0.0.1"),
		DBPort: getEnv("DB_PORT", "3306"),
		DBName: getEnv("DB_NAME", "urlcrawler"),
	}
}
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
