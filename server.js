const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.use(
  express.json({
    limit: "10mb"
  })
);

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "HTML to PNG Renderer"
  });
});


app.post("/render", async (req, res) => {

  let browser;

  try {

    const { html } = req.body;

    if (!html) {
      return res.status(400).json({
        error: "HTML is required"
      });
    }


    browser = await chromium.launch({
      headless: true
    });


    const page = await browser.newPage({
      viewport: {
        width: 1400,
        height: 1000
      },
      deviceScaleFactor: 2
    });


    await page.setContent(html, {
      waitUntil: "networkidle"
    });


    const report =
      page.locator(".report");


    const image =
      await report.screenshot({
        type: "png"
      });


    res.set({
      "Content-Type": "image/png"
    });


    res.send(image);


  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });


  } finally {

    if (browser) {
      await browser.close();
    }

  }

});


const PORT =
  process.env.PORT || 3000;


app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
