import { getLang, setLang, t } from "../i18n";
import { h } from "./dom";

export interface Shell {
  root: HTMLElement;
  view: HTMLElement;
  setRoute(name: string): void;
  refreshNet(): void;
  showUpdate(onApply: () => void): void;
}

/** Build the persistent chrome (header, connectivity badge, language toggle, home link). */
export function buildShell(app: HTMLElement, onLang: () => void): Shell {
  let route = "home";
  const view = h("main", { id: "view", tabindex: "-1" });
  const banner = h("div", { class: "update", role: "status", hidden: true });
  const badge = h("span", { class: "badge", role: "status", "aria-live": "polite" });
  const langBtn = h("button", { type: "button", class: "lang", onclick: () => {
    setLang(getLang() === "en" ? "hi" : "en");
    onLang();
  } });
  const homeLink = h("a", { class: "homelink", href: "#/" });
  const title = h("strong", { class: "apptitle" });
  const sub = h("small", {});

  const refreshNet = () => {
    const on = navigator.onLine;
    badge.className = `badge ${on ? "on" : "off"}`;
    badge.textContent = `${on ? "● " : "✈ "}${t(on ? "net.online" : "net.offline")}`;
  };
  const labels = () => {
    document.documentElement.lang = getLang();
    title.textContent = t("app.name");
    sub.textContent = t("app.subtitle");
    langBtn.textContent = t("lang.switch");
    langBtn.setAttribute("lang", getLang() === "en" ? "hi" : "en");
    homeLink.textContent = `← ${t("nav.back")}`;
    homeLink.hidden = route === "home";
    refreshNet();
  };
  const header = h("header", {}, h("div", { class: "brand" }, title, sub), h("div", { class: "tools" }, badge, langBtn));
  app.replaceChildren(header, banner, homeLink, view);
  labels();
  window.addEventListener("online", refreshNet);
  window.addEventListener("offline", refreshNet);
  return {
    root: app,
    view,
    setRoute(n) {
      route = n;
      labels();
    },
    refreshNet: labels,
    showUpdate(onApply) {
      banner.hidden = false;
      banner.replaceChildren(h("span", {}, t("update.ready")), h("button", { type: "button", onclick: onApply }, t("update.btn")));
    },
  };
}
