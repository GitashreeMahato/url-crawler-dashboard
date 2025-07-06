package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load environment variables from .env
	LoadEnv()
	//2. Print a confirmation
	fmt.Println("Config loaded. Running server on port:", AppConfig.Port)
	// 3. start Gin server
	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})
	// 4. Use port from config
	router.Run(":" + AppConfig.Port)
}
