"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownToLine, Check, ChevronDown, Code2, Globe2, KeyRound, LockKeyhole,
  LogOut, Moon, QrCode, Shield, Sun,
} from "lucide-react";
import QRCode from "qrcode";
import { buildConfig, createKeyPair, encodePublicKey, type AppMode, type ConnectionParameters } from "@/lib/config";

type Platform = "Android" | "iOS" | "Windows" | "macOS" | "Linux";
type Capabilities = { mode: AppMode; provider: string; available: boolean; real_provider: boolean; formats: string[]; notice: string | null };
type Generated = { status: "created"; mode: AppMode; provider: string; format: string; parameters: ConnectionParameters; notice: string | null };

const copy = {
  ru: {
    nav: "Инструкция", about: "О проекте", title: "Персональный генератор VPN-конфигураций", intro: "Закрытый инструмент подготовки конфигураций. Приватный ключ создаётся на устройстве и не отправляется backend.",
    unavailable: "Генерация сейчас недоступна.", mock: "Тестовый провайдер", mockNotice: "Mock выдаёт фиктивные параметры из зарезервированных тестовых диапазонов. Такой профиль не подключается к VPN.",
    personalUnavailable: "Реальный провайдер не подключён. Personal режим остаётся закрытым до появления поддерживаемого адаптера.", disabled: "Генерация выключена настройками backend.", provider: "Провайдер", format: "Формат", wireguard: "WireGuard", awg: "AmneziaWG", awgUnavailable: "Провайдер не подтверждает AmneziaWG.", platform: "Устройство", name: "Название конфигурации", advanced: "Дополнительные настройки", mtu: "MTU", consent: "Понимаю, что mock-конфигурация не подключается к интернету.", generate: "Создать конфигурацию", working: "Получение параметров…", localKey: "ПРИВАТНЫЙ КЛЮЧ ЛОКАЛЬНО", error: "Не удалось создать профиль. Повторите попытку.", result: "Параметры получены", resultNotice: "Профиль сформирован, но это не подтверждает подключение VPN.", download: "Скачать .conf", copy: "Копировать", copied: "Скопировано", show: "Показать конфигурацию", hide: "Скрыть конфигурацию", clear: "Удалить профиль", qr: "Локальный QR-код", qrWarning: "QR содержит приватный ключ. Не показывайте его посторонним.", gone: "При обновлении страницы профиль исчезнет, если вы не скачали файл.", instructions: "Инструкция", guideText: "Подключитесь в клиенте, который импортирует WireGuard .conf. Mock-профиль использовать для подключения нельзя.", privacy: "Ключ и готовая конфигурация не отправляются на сервер.", theme: "Тема", language: "Язык", footer: "Персональный инструмент. Не является продуктом Cloudflare, WireGuard или Amnezia.", logout: "Выйти", copyKey: "Скопировано", status: "Состояние генератора", features: "Работа на устройстве", soleOwner: "Один владелец", source: "Открытый исходный код", profile: "Конфигурация", terms: "Я принимаю условия Cloudflare", termsUrl: "Условия Cloudflare", reset: "Сбросить",
  },
  en: {
    nav: "Guide", about: "About", title: "Personal VPN Configuration Generator", intro: "A private tool to prepare profiles. The private key is created on your device and never sent to the backend.",
    unavailable: "Generation is currently unavailable.", mock: "Test provider", mockNotice: "Mock returns fictional parameters from reserved test ranges. This profile cannot connect to a VPN.",
    personalUnavailable: "No real provider is connected. Personal mode stays unavailable until a supported adapter is configured.", disabled: "Generation is disabled by backend settings.", provider: "Provider", format: "Format", wireguard: "WireGuard", awg: "AmneziaWG", awgUnavailable: "Provider has not confirmed AmneziaWG support.", platform: "Device", name: "Profile name", advanced: "Advanced settings", mtu: "MTU", consent: "I understand mock profiles cannot connect to the internet.", generate: "Generate profile", working: "Getting connection parameters…", localKey: "PRIVATE KEY GENERATED LOCALLY", error: "Could not create a profile. Try again.", result: "Parameters received", resultNotice: "The profile was created; this does not confirm a VPN connection.", download: "Download .conf", copy: "Copy", copied: "Copied", show: "Show configuration", hide: "Hide configuration", clear: "Clear profile", qr: "Local QR code", qrWarning: "The QR contains your private key. Do not share it.", gone: "The profile is lost on refresh unless you download it.", instructions: "Guide", guideText: "Import a WireGuard .conf in a compatible client. Mock profiles cannot be used to connect.", privacy: "The key and completed profile are never sent to the server.", theme: "Theme", language: "Language", footer: "Personal tool. Not a Cloudflare, WireGuard, or Amnezia product.", logout: "Log out", copyKey: "Copied", status: "Generator status", features: "Runs on your device", soleOwner: "Single owner", source: "Open source", profile: "Configuration", terms: "I accept Cloudflare terms", termsUrl: "Cloudflare terms", reset: "Reset",
  },
};

export default function Home() {
  const [lang, setLang] = useState<"ru" | "en">("ru");
  const [dark, setDark] = useState(true);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [format, setFormat] = useState<"wireguard" | "amneziawg">("wireguard");
  const [platform, setPlatform] = useState<Platform>("Android");
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState("");
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("Quiet Tunnel");
  const [mtu, setMtu] = useState(1280);
  const [advanced, setAdvanced] = useState(false);
  const [copyText, setCopyText] = useState("Копировать");
  const t = copy[lang];

  useEffect(() => {
    let active = true;
    fetch("/api/v1/capabilities", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Capabilities unavailable");
        return await response.json() as Capabilities;
      })
      .then((data) => { if (active) setCapabilities(data); })
      .catch(() => { if (active) setCapabilities(null); });
    return () => { active = false; };
  }, []);

  const canGenerate = capabilities?.available === true && capabilities.formats.includes(format);

  async function generate() {
    if (!canGenerate || busy || !accepted) return;
    setBusy(true);
    setError("");
    setResult("");
    setQr("");
    let privateKey: Uint8Array | undefined;
    try {
      const pair = createKeyPair();
      privateKey = pair.privateKey;
      // Only the public key is included in this request. The private key stays in this call's browser memory.
      const response = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_key: encodePublicKey(pair.publicKey), format, platform: platform.toLowerCase(), terms_accepted: accepted }),
        cache: "no-store",
      });
      const payload = await response.json() as Generated | { detail?: { message?: string } };
      if (!response.ok || !("parameters" in payload)) {
        setError("detail" in payload ? payload.detail?.message ?? t.error : t.error);
        return;
      }
      const config = buildConfig(pair.privateKey, payload.parameters, {
        name,
        platform,
        mtu: advanced ? mtu : undefined,
        mode: payload.mode,
      });
      setResult(config);
      setQr(await QRCode.toDataURL(config, { width: 220, margin: 2, color: { dark: "#0b1018", light: "#ffffff" } }));
    } catch {
      setError(t.error);
    } finally {
      privateKey?.fill(0);
      setBusy(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([result], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 32) || "quiet-tunnel"}.conf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(result);
      setCopyText(t.copied);
      window.setTimeout(() => setCopyText(t.copy), 1500);
    } catch {
      setError(t.error);
    }
  }

  function clearResult() {
    setResult("");
    setQr("");
    setExpanded(false);
    setError("");
  }

  async function logout() {
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST", cache: "no-store" });
      if (response.ok) window.location.replace("/login");
    } catch {
      setError(t.error);
    }
  }

  const mode = capabilities?.mode;
  const statusMessage = !capabilities
    ? t.unavailable
    : mode === "mock"
      ? t.mockNotice
      : mode === "personal"
        ? capabilities.notice ?? t.personalUnavailable
        : t.disabled;

  return <main className={dark ? "site dark" : "site light"}>
    <header className="topbar wrap">
      <Link className="brand" href="/" aria-label="Quiet Tunnel"><span className="mark"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2.5 35 11v18L20 37.5 5 29V11L20 2.5Z"/><path d="M13 27V16.5a7 7 0 0 1 14 0V27M17 27v-8a3 3 0 0 1 6 0v8M20 24v7"/></svg></span><span>quiet tunnel</span></Link>
      <nav><a href="#instructions">{t.nav}</a><a href="/about">{t.about}</a><a href="https://github.com/kolyased/quiet-tunnel" aria-label="GitHub"><Code2 size={18}/></a></nav>
      <div className="tools"><button className="icon-button" onClick={() => setLang(lang === "ru" ? "en" : "ru")} aria-label={t.language}><Globe2 size={17}/><span>{lang.toUpperCase()}</span></button><button className="icon-button" onClick={() => setDark(!dark)} aria-label={t.theme}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-button" onClick={logout} aria-label={t.logout}><LogOut size={17}/></button></div>
    </header>
    <div className="wrap content">
      <section className="hero"><div className="eyebrow"><span className="pulse"/> PERSONAL VPN TOOL <span className="version">v0.3.0</span></div><h1>{t.title}</h1><p>{t.intro}</p></section>
      <div className={`notice ${mode === "mock" ? "" : "notice-muted"}`}><span className="notice-icon"><Shield size={19}/></span><div><strong>{t.status}: {mode?.toUpperCase() ?? "…"}</strong><p>{statusMessage}</p></div><span className="demo-pill">{capabilities?.provider ?? "—"}</span></div>

      <section className="generator" aria-labelledby="generator-title">
        <div className="section-head"><div><span className="step">01 — GENERATE</span><h2 id="generator-title">{t.profile}</h2></div><span className="lock"><LockKeyhole size={15}/>{t.localKey}</span></div>
        <div className="field"><label>{t.format}</label><div className="choice-row">
          <button className={format === "wireguard" ? "choice selected" : "choice"} onClick={() => setFormat("wireguard")}><span className="radio"/><span><b>{t.wireguard}</b><small>WireGuard .conf</small></span></button>
          <button className={format === "amneziawg" ? "choice selected" : "choice"} disabled={!capabilities?.formats.includes("amneziawg")} onClick={() => setFormat("amneziawg")}><span className="radio"/><span><b>{t.awg}</b><small>{capabilities?.formats.includes("amneziawg") ? "Provider-supported" : t.awgUnavailable}</small></span></button>
        </div><p className="help">{lang === "ru" ? "Параметры AmneziaWG должны поддерживаться сервером. Mock и обычный WireGuard не создают обфускацию." : "AmneziaWG parameters must be supported by the server. Mock and standard WireGuard do not provide obfuscation."}</p></div>
        <div className="field"><label>{t.platform}</label><div className="platforms">{(["Android", "iOS", "Windows", "macOS", "Linux"] as Platform[]).map((item) => <button key={item} className={platform === item ? "platform active" : "platform"} onClick={() => setPlatform(item)}>{item}</button>)}</div></div>
        <div className="field"><label htmlFor="profile-name">{t.name}</label><input id="profile-name" value={name} maxLength={48} onChange={(event) => setName(event.target.value)}/></div>
        <button className="advanced-toggle" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>{t.advanced}<ChevronDown size={17} className={advanced ? "rotate" : ""}/></button>
        {advanced && <div className="advanced-fields"><label>{t.mtu}<input type="number" min={576} max={9000} value={mtu} onChange={(event) => setMtu(Math.min(9000, Math.max(576, Number(event.target.value))))}/></label><button onClick={() => { setName("Quiet Tunnel"); setMtu(1280); setFormat("wireguard"); setPlatform("Android"); setAccepted(false); }}>{t.reset}</button></div>}
        {(mode === "mock" || mode === "personal") && <label className="consent"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)}/><span>{mode === "mock" ? t.consent : <>{t.terms} (<a href="https://www.cloudflare.com/application/terms/" target="_blank" rel="noreferrer">{t.termsUrl}</a>)</>}</span></label>}
        <button className="primary" disabled={!canGenerate || busy || !accepted} onClick={generate}><KeyRound size={18}/>{busy ? t.working : t.generate}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <p className="privacy-line"><LockKeyhole size={14}/>{t.privacy}</p>
      </section>

      {result && <section className="result"><div className="result-top"><div><span className="step">02 — {t.result.toUpperCase()}</span><h2>{name}</h2></div><button className="icon-button" onClick={clearResult} aria-label={t.clear}>×</button></div><div className="result-warning">{mode === "mock" ? t.mockNotice : t.resultNotice}</div><div className="result-actions"><button onClick={download}><ArrowDownToLine size={16}/>{t.download}</button><button onClick={copyConfig}><Check size={16}/>{copyText}</button><button onClick={() => setExpanded(!expanded)}><KeyRound size={16}/>{expanded ? t.hide : t.show}</button><button onClick={clearResult}>{t.clear}</button></div>{expanded && <pre className="config-text">{result}</pre>}<details className="qr"><summary><QrCode size={17}/>{t.qr}</summary>{qr && <Image src={qr} alt="Local QR code containing the VPN configuration" width={220} height={220} unoptimized/>}<p className="help">{t.qrWarning}</p></details><p className="ephemeral">{t.gone}</p></section>}

      <section className="benefits"><h2>{t.features}</h2><div className="benefit-grid"><div><LockKeyhole/><b>{t.localKey}</b></div><div><Code2/><b>{t.source}</b></div><div><Shield/><b>{t.soleOwner}</b></div></div></section>
      <section className="guide" id="instructions"><span className="step">03 — NEXT STEP</span><h2>{t.instructions}</h2><p>{t.guideText}</p><div className="guide-links"><a href="https://www.wireguard.com/install/" target="_blank" rel="noreferrer">WireGuard ↗</a><a href="https://docs.amnezia.org/ru/documentation/amnezia-wg/" target="_blank" rel="noreferrer">AmneziaWG ↗</a></div></section>
      <footer><Link className="brand small" href="/"><span className="mark"><svg viewBox="0 0 40 40"><path d="M20 2.5 35 11v18L20 37.5 5 29V11L20 2.5Z"/><path d="M13 27V16.5a7 7 0 0 1 14 0V27M17 27v-8a3 3 0 0 1 6 0v8M20 24v7"/></svg></span><span>quiet tunnel</span></Link><span>{t.footer}</span><span>MIT · v0.3.0</span></footer>
    </div>
  </main>;
}
