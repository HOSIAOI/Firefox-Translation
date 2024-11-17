const API_KEY = "你的API金鑰"; // 在這裡填入你的 Google Cloud API 金鑰
const targetLang = "zh-TW";
let translateEnabled = true; // 默認為啟用

// 獲取插件啟用狀態
browser.storage.local.get("translateEnabled").then(({ translateEnabled: enabled }) => {
  translateEnabled = enabled ?? true; // 如果存儲中無狀態，則默認啟用
});

// 監聽狀態改變
browser.storage.onChanged.addListener((changes) => {
  if (changes.translateEnabled) {
    translateEnabled = changes.translateEnabled.newValue;
    console.log(`翻譯功能狀態更新為：${translateEnabled}`);
  }
});

// 翻譯功能，使用 Google 翻譯 API
async function translateText(text) {
  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text, // 要翻譯的文字
          target: targetLang, // 目標語言
          format: "text",
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("翻譯錯誤：", data.error.message);
      return "翻譯失敗";
    }

    return data.data.translations[0].translatedText; // 取得翻譯結果
  } catch (error) {
    console.error("翻譯失敗：", error);
    return "翻譯失敗";
  }
}

// 處理段落懸停和按下 Ctrl 鍵事件
let lastHoveredElement = null;

document.addEventListener("keydown", async (event) => {
  if (!translateEnabled) return; // 如果插件被禁用，則退出
  if (event.ctrlKey && lastHoveredElement) {
    const element = lastHoveredElement;

    // 檢查是否已有翻譯內容，或是否為譯文元素本身
    if (element.classList.contains("translation")) {
      console.log("跳過譯文內容，避免重複翻譯。");
      return;
    }

    const existingTranslation = element.querySelector(".translation");
    if (existingTranslation) {
      // 移除翻譯
      existingTranslation.remove();
    } else {
      // 執行翻譯並新增譯文
      const text = element.innerText.trim();
      if (text) {
        const translatedText = await translateText(text);

        // 插入譯文
        const translationElement = document.createElement("div");
        translationElement.className = "translation";
        translationElement.innerHTML = translatedText; // 支援 HTML 編碼的翻譯

        // 繼承原文段落的樣式
        const computedStyle = window.getComputedStyle(element);
        translationElement.style.cssText = computedStyle.cssText;
        translationElement.style.marginTop = "5px"; // 保持與原文間距
        translationElement.style.whiteSpace = "pre-wrap"; // 支援換行

        // 插入譯文到原文段落後方
        element.appendChild(translationElement);
      }
    }
  }
});

// 捕捉滑鼠懸停的段落
document.addEventListener("mouseover", (event) => {
  lastHoveredElement = event.target.closest("p, div, span"); // 適配常見段落標籤
});
