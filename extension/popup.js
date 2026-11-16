// Popup dell'estensione Wantit.
// 1. Legge titolo e immagine della pagina aperta, per mostrare un'anteprima
// 2. Al click su "Salva" apre l'app Wantit con il link già pronto (/?add=...)
//    L'app fa lo scraping e mostra il modal di conferma.

const DEFAULT_APP_URL = "http://localhost:3000";

const $ = (id) => document.getElementById(id);

async function getAppUrl() {
  const { appUrl } = await chrome.storage.sync.get("appUrl");
  return (appUrl || DEFAULT_APP_URL).replace(/\/+$/, "");
}

async function main() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  $("appUrl").value = await getAppUrl();
  $("appUrl").addEventListener("change", (e) => {
    chrome.storage.sync.set({ appUrl: e.target.value.trim() });
  });

  if (!tab || !/^https?:/.test(tab.url || "")) {
    $("title").textContent = "Apri la pagina di un prodotto per salvarla.";
    $("save").disabled = true;
    return;
  }

  $("title").textContent = tab.title || tab.url;
  $("site").textContent = new URL(tab.url).hostname.replace(/^www\./, "");

  // Prova a leggere l'immagine og:image della pagina (solo per l'anteprima)
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const m = (p) => document.querySelector(`meta[property="${p}"], meta[name="${p}"]`)?.content;
        return { image: m("og:image") || m("twitter:image"), title: m("og:title") };
      },
    });
    if (result?.image) $("img").style.backgroundImage = `url("${result.image}")`;
    if (result?.title) $("title").textContent = result.title;
  } catch {
    // Alcune pagine (es. Chrome Web Store) non permettono di leggere il contenuto: pazienza
  }

  $("save").addEventListener("click", async () => {
    const appUrl = await getAppUrl();
    chrome.tabs.create({ url: `${appUrl}/?add=${encodeURIComponent(tab.url)}` });
    window.close();
  });
}

main();
