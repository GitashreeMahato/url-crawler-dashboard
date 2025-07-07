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
	router.GET("/urls", GetAllUrls)
	router.GET("/urls/:id", GetUrlById)
	router.DELETE("/urls", DeleteUrlsBulk)
	router.DELETE("/urls/:id", DeleteUrlById)

	// 4. Use port from config
	router.Run(":" + AppConfig.Port)
}

// create urls
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

// get urls
func GetAllUrls(c *gin.Context) {
	var urls []Url

	if err := DB.Find(&urls).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch URLs"})
		return
	}

	c.JSON(200, urls)
}

// get url by id
func GetUrlById(c *gin.Context) {
	var url Url
	id := c.Param("id")
	if err := DB.First(&url, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "URL not found"})
		return
	}
	c.JSON(200, url)
}

// delete a URL by ID
func DeleteUrlById(c *gin.Context) {
	id := c.Param("id")
	result := DB.Delete(&Url{}, id)
	if result.RowsAffected == 0 {
		c.JSON(404, gin.H{"error": "URL not found"})
		return
	}

	if result.Error != nil {
		c.JSON(500, gin.H{"error": "Failed to delete URL"})
		return
	}

	c.JSON(200, gin.H{"message": "URL deleted successfully"})
}

// delete all urls
func DeleteUrlsBulk(c *gin.Context) {
	var ids []uint

	if err := c.ShouldBindJSON(&ids); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body. Expected array of IDs."})
		return
	}

	if len(ids) == 0 {
		c.JSON(400, gin.H{"error": "No IDs provided"})
		return
	}

	result := DB.Delete(&Url{}, ids)

	if result.Error != nil {
		c.JSON(500, gin.H{"error": "Failed to delete URLs"})
		return
	}

	c.JSON(200, gin.H{
		"message":       "URLs deleted successfully",
		"rows_affected": result.RowsAffected,
		"deleted_ids":   ids,
	})
}
