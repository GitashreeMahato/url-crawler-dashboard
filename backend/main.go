package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load environment variables from .env
	LoadEnv()
	InitDB()
	//2. Print a confirmation
	fmt.Println("Config loaded. Running server on port:", AppConfig.Port)
	// 3. start Gin server
	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})
	router.POST("/urls", CreateUrl)
	// 4. Use port from config
	router.Run(":" + AppConfig.Port)
}
func CreateUrl(c *gin.Context) {
	var newUrl Url

	// Bind JSON to struct
	if err := c.ShouldBindJSON(&newUrl); err != nil {
		c.JSON(400, gin.H{"error": "Invalid JSON"})
		return
	}

	newUrl.Status = "queued"

	// Save to DB
	if err := DB.Create(&newUrl).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to save URL"})
		return
	}

	c.JSON(201, newUrl)
}
