package main

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

type BrokenLink struct {
	URL    string `json:"url"`
	Status int    `json:"status"`
}

// Url represents the crawled page structure
type Url struct {
	ID                uint   `gorm:"primaryKey"`
	Url               string `gorm:"type:text;not null"`
	HTMLVersion       string
	Title             string
	H1Count           int
	H2Count           int
	H3Count           int
	H4Count           int
	H5Count           int
	H6Count           int
	InternalLinks     int
	ExternalLinks     int
	BrokenLinksCount  int `json:"BrokenLinksCount"` // Number of broken links (for table)
	LoginFormDetected bool
	Status            string       `gorm:"type:enum('queued','running','done','error');default:'queued'"`
	BrokenLinks       []BrokenLink `gorm:"-" json:"BrokenLinks"` //List of broken links with status codes (not saved in DB)
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// InitDB connects to the DB and migrates the Url model
func InitDB() {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true",
		AppConfig.DBUser,
		AppConfig.DBPass,
		AppConfig.DBHost,
		AppConfig.DBPort,
		AppConfig.DBName,
	)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	err = db.AutoMigrate(&Url{})
	if err != nil {
		log.Fatal("AutoMigration failed: ", err)
	}

	fmt.Println("Connected to database and auto-migrated Url table.")
	DB = db
}
