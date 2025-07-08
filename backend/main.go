package main

import (
	"github.com/PuerkitoBio/goquery"
	"github.com/gin-contrib/cors"

	"github.com/gin-gonic/gin"

	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

func main() {
	// 1. Load environment variables from .env
	LoadEnv()
	InitDB()

	/* TEMPORARY TEST CALL:
	fmt.Println("Crawling ....")
	analyzed, err := crawlURL("https://gitashreemahato.github.io/portfolio-website/work.html")
	if err != nil {
		fmt.Println("Crawl failed:", err)
	} else {
		fmt.Println("Crawl successful:")
		fmt.Printf("Title: %s\n", analyzed.Title)
		fmt.Printf("HTML Version: %s\n", analyzed.HTMLVersion)
		fmt.Printf("H1: %d H2: %d H3: %d H4: %d H5: %d H6: %d\n",
			analyzed.H1Count, analyzed.H2Count, analyzed.H3Count,
			analyzed.H4Count, analyzed.H5Count, analyzed.H6Count)
	} */

	//2. Print a confirmation
	fmt.Println("Config loaded. Running server on port:", AppConfig.Port)
	// 3. start Gin server
	router := gin.Default()

	// cors
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})
	router.POST("/urls", CreateUrl)
	router.GET("/urls", GetAllUrls)
	router.GET("/urls/:id", GetUrlById)
	router.PUT("/urls/:id", RequeueUrlByID)
	router.DELETE("/urls", DeleteUrlsBulk)
	router.DELETE("/urls/:id", DeleteUrlById)

	// 4. Use port from config
	router.Run(":" + AppConfig.Port)
}

// crawlURL fetches and analyzes a webpage
func crawlURL(target string) (Url, error) {
	var result Url
	result.Url = target
	var brokenLinks []BrokenLink
	brokenLock := sync.Mutex{}
	var wg sync.WaitGroup

	// 1. Fetch page
	resp, err := http.Get(target)
	if err != nil {
		result.Status = "error"
		return result, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		fmt.Println("Received error status:", resp.Status)
		result.Status = "error"
		return result, nil
	}

	// 2. Parse HTML with goquery
	doc, err := goquery.NewDocumentFromReader(resp.Body)

	if err != nil {
		result.Status = "error"
		return result, err
	}
	result.Title = doc.Find("title").Text()

	result.Status = "done"

	doc.Find("*").EachWithBreak(func(i int, s *goquery.Selection) bool {
		if goquery.NodeName(s) == "html" {
			if s.Nodes[0].Namespace == "" {
				result.HTMLVersion = "HTML5"
			} else {
				result.HTMLVersion = "Unknown"
			}
			return false
		}
		return true
	})
	// Step: Analyze links
	internalCount := 0
	externalCount := 0

	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists || href == "" || href == "#" {
			return
		}

		// Normalize
		href = strings.TrimSpace(href)

		// Skip empty/malformed
		if strings.HasPrefix(href, "javascript:") {
			return
		}

		// Determine internal vs external
		if strings.HasPrefix(href, "/") || strings.Contains(href, target) {
			internalCount++
		} else {
			externalCount++
		}

		// Check if link is broken
		wg.Add(1)
		go func(link string) {
			defer wg.Done()
			resp, err := http.Head(link)
			status := 0
			if err != nil {
				status = 0 // failed to connect
			} else {
				status = resp.StatusCode
			}
			if err != nil || status >= 400 {
				brokenLock.Lock()
				brokenLinks = append(brokenLinks, BrokenLink{
					URL:    link,
					Status: status,
				})
				brokenLock.Unlock()
			}
		}(href)

		// Detect if login form exists
		if doc.Find(`input[type="password"]`).Length() > 0 {
			result.LoginFormDetected = true
		} else {
			result.LoginFormDetected = false
		}

	})
	wg.Wait()
	result.H1Count = doc.Find("h1").Length()
	result.H2Count = doc.Find("h2").Length()
	result.H3Count = doc.Find("h3").Length()
	result.H4Count = doc.Find("h4").Length()
	result.H5Count = doc.Find("h5").Length()
	result.H6Count = doc.Find("h6").Length()

	result.BrokenLinks = brokenLinks
	result.InternalLinks = internalCount
	result.ExternalLinks = externalCount
	result.BrokenLinksCount = len(brokenLinks)

	result.LoginFormDetected = true

	fmt.Println("Link Analysis:")
	fmt.Println("Internal Links:", result.InternalLinks)
	fmt.Println("External Links:", result.ExternalLinks)
	fmt.Println("Broken Links:", result.BrokenLinks)

	return result, nil

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

	// Run crawler in background
	go func(id uint, target string) {
		analyzed, err := crawlURL(target)
		if err != nil {
			fmt.Println("Crawl failed for:", target, err)
			return
		}
		// Update DB with analyzed result
		analyzed.ID = id
		DB.Model(&Url{}).Where("id = ?", id).Updates(analyzed)

		fmt.Println("Crawl complete for", target)
		fmt.Println("Internal:", analyzed.InternalLinks, "External:", analyzed.ExternalLinks, "Broken:", analyzed.BrokenLinks)
	}(newUrl.ID, newUrl.Url)

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

// re-run a URL analysis
func RequeueUrlByID(c *gin.Context) {
	id := c.Param("id")
	var url Url

	// Find the URL by ID
	if err := DB.First(&url, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "URL not found"})
		return
	}

	// Update the status
	url.Status = "queued"
	if err := DB.Save(&url).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(200, gin.H{
		"message": "URL status reset to 'queued'",
		"url":     url,
	})
}
