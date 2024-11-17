const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
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

// 翻譯功能，使用 Google Translate 非官方接口
async function translateText(text) {
  try {
    const url = `${GOOGLE_TRANSLATE_URL}?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      method: "GET",
    });

    const data = await response.json();

    // 結果數組的第一部分包含翻譯的文本
    return data[0].map((item) => item[0]).join("") || "翻譯失敗";
  } catch (error) {
    console.error("翻譯失敗：", error);
    return "翻譯失敗";
  }
}

// 判斷文本是否為繁體中文
function isTraditionalChinese(text) {
  const traditionalChineseRegex = /[\u4E00-\u9FFF]/;
  return traditionalChineseRegex.test(text);
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
        // 偵測原文是否為繁體中文
        if (isTraditionalChinese(text)) {
          console.log("原文為繁體中文，跳過翻譯。");
          return;
        }

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

        // 自動移除「翻譯失敗」內容
        if (translatedText === "翻譯失敗") {
          setTimeout(() => {
            translationElement.remove();
          }, 3000); // 3秒後自動移除
        }
      }
    }
  }
});

// 捕捉滑鼠懸停的段落
document.addEventListener("mouseover", (event) => {
  lastHoveredElement = event.target.closest("p, div, span"); // 適配常見段落標籤
});
