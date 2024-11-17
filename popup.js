document.addEventListener("DOMContentLoaded", async () => {
  const toggleButton = document.getElementById("toggleButton");

  // 獲取當前翻譯狀態
  const { translateEnabled } = await browser.storage.local.get("translateEnabled");
  let enabled = translateEnabled ?? true; // 默認為啟用

  // 初始化按鈕文字和圖標
  updateUI();

  // 綁定按鈕點擊事件
  toggleButton.addEventListener("click", async () => {
    enabled = !enabled; // 切換狀態
    await browser.storage.local.set({ translateEnabled: enabled }); // 更新狀態到存儲
    updateUI();
  });

  function updateUI() {
    toggleButton.textContent = enabled ? "關閉翻譯" : "開啟翻譯";

    // 更新工具列圖標
    const iconPath = enabled ? "icons/icon-on.png" : "icons/icon-off.png";
    browser.action.setIcon({ path: iconPath });
  }
});
