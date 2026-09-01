const express = require("express");
const { chromium } = require("playwright");

const app = express();


/*
 * =====================================
 * НАСТРОЙКИ EXPRESS
 * =====================================
 */

app.use(
  express.json({
    limit: "10mb"
  })
);


/*
 * =====================================
 * ПРОВЕРКА РАБОТЫ СЕРВЕРА
 * =====================================
 */

app.get("/", (req, res) => {

  res.json({
    status: "OK",
    service: "HTML to PNG Renderer"
  });

});


/*
 * =====================================
 * ГЕНЕРАЦИЯ PNG
 * =====================================
 */

app.post("/render", async (req, res) => {

  let browser = null;

  try {

    const html = req.body.html;


    /*
     * Проверяем HTML
     */

    if (!html) {

      return res.status(400).json({
        error: "HTML is required"
      });

    }


    /*
     * Проверяем наличие .report
     */

    if (
      !String(html).includes(
        'class="report"'
      )
    ) {

      return res.status(400).json({

        error:
          'HTML does not contain class="report"',

        htmlPreview:
          String(html).substring(
            0,
            500
          )

      });

    }


    /*
     * Запускаем браузер
     */

    browser =
      await chromium.launch({

        headless: true

      });


    /*
     * Создаём страницу
     */

    const page =
      await browser.newPage({

        viewport: {

          width: 1400,

          height: 1000

        },

        deviceScaleFactor: 2

      });


    /*
     * Загружаем HTML
     */

    await page.setContent(

      html,

      {

        waitUntil:
          "domcontentloaded"

      }

    );


    /*
     * Ждём появления отчёта
     */

    await page.waitForSelector(

      ".report",

      {

        state:
          "attached",

        timeout:
          10000

      }

    );


    /*
     * Получаем отчёт
     */

    const report =
      page.locator(
        ".report"
      );


    /*
     * Проверяем количество элементов
     */

    const reportCount =
      await report.count();


    if (reportCount === 0) {

      throw new Error(
        "Element .report not found after HTML rendering"
      );

    }


    /*
     * Делаем PNG
     */

    const image =
      await report.screenshot({

        type:
          "png"

      });


    /*
     * Отправляем изображение
     */

    res.set({

      "Content-Type":
        "image/png"

    });


    res.send(
      image
    );


  } catch (error) {

    console.error(
      "RENDER ERROR:",
      error
    );


    res.status(500).json({

      error:
        error.message

    });


  } finally {

    if (browser) {

      try {

        await browser.close();

      } catch (error) {

        console.error(
          "Browser close error:",
          error
        );

      }

    }

  }

});


/*
 * =====================================
 * ЗАПУСК СЕРВЕРА
 * =====================================
 */

const PORT =
  process.env.PORT || 3000;


app.listen(

  PORT,

  () => {

    console.log(

      "Server running on port " +
      PORT

    );

  }

);
