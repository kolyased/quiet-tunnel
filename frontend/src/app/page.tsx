"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDownToLine, Check, ChevronDown, Code2, Globe2, KeyRound, LockKeyhole, Moon, QrCode, Shield, Sun } from "lucide-react";
import QRCode from "qrcode";
import { buildDemoConfig, createKeyPair } from "@/lib/config";

type Platform = "Android" | "iOS" | "Windows" | "macOS" | "Linux";
const words = {
  ru: { nav: "Инструкция", about: "О проекте", hero: "Твой ключ. Твоё подключение.", sub: "Персональная конфигурация WireGuard. Приватный ключ создаётся в браузере и остаётся на вашем устройстве.", demo: "Демонстрационный режим", unavailable: "Регистрация Cloudflare отключена: публичная автоматизированная регистрация не подтверждена официальной документацией и условиями сервиса.", format: "Формат конфигурации", os: "Ваше устройство", name: "Название туннеля", agree: "Я принимаю условия Cloudflare и понимаю, что демонстрационная конфигурация не подключается к VPN.", terms: "Условия Cloudflare", create: "Показать пример конфигурации", demoNotice: "Это пример формата, не рабочий VPN-профиль. Параметры сервера вымышлены.", privacy: "Приватный ключ создан локально и не отправлялся на сервер.", guide: "Как подключить", download: "Скачать .conf", copy: "Копировать", copied: "Скопировано", show: "Показать конфигурацию", clear: "Удалить из страницы", features: "Приватность по умолчанию", noAccount: "Без аккаунта", open: "Открытый исходный код", local: "Ключи остаются на устройстве", footer: "Неофициальный проект. Не связан с Cloudflare, WireGuard или Amnezia.", network: "Регистрация недоступна", demoLabel: "Демо-пример", advanced: "Дополнительные настройки", mtu: "MTU", dns: "DNS", mode: "Режим адресов", termsRequired: "Подтвердите условия, чтобы продолжить", platforms: "Поддерживаемые клиенты", mock: "Создать демонстрационный пример", qr: "QR-код локально", lang: "Язык", theme: "Тема" },
  en: { nav: "Setup guide", about: "About", hero: "Your key. Your connection.", sub: "A personal WireGuard configuration. Your private key is created in your browser and stays on your device.", demo: "Demo mode", unavailable: "Cloudflare registration is disabled: public automated registration is not confirmed by official documentation or service terms.", format: "Configuration format", os: "Your device", name: "Tunnel name", agree: "I accept Cloudflare’s terms and understand the demo configuration cannot connect to a VPN.", terms: "Cloudflare terms", create: "Preview demo configuration", demoNotice: "This is a format example, not a working VPN profile. Server parameters are fictional.", privacy: "Private key was generated locally and never sent to the server.", guide: "Setup guide", download: "Download .conf", copy: "Copy", copied: "Copied", show: "Show configuration", clear: "Clear from page", features: "Privacy by default", noAccount: "No account", open: "Open source", local: "Keys stay on your device", footer: "Unofficial project. Not affiliated with Cloudflare, WireGuard, or Amnezia.", network: "Registration unavailable", demoLabel: "Demo preview", advanced: "Advanced settings", mtu: "MTU", dns: "DNS", mode: "Address mode", termsRequired: "Accept the terms to continue", platforms: "Supported clients", mock: "Create demo preview", qr: "QR code generated locally", lang: "Language", theme: "Theme" }
};

export default function Home() {
  const [lang, setLang] = useState<"ru" | "en">("ru");
  const [dark, setDark] = useState(true);
  const [format, setFormat] = useState<"wireguard" | "amneziawg">("wireguard");
  const [platform, setPlatform] = useState<Platform>("Android");
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState("");
  const [qr, setQr] = useState("");
  const [copyText, setCopyText] = useState("Копировать");
  const [name, setName] = useState("Quiet Tunnel · Demo");
  const [mtu, setMtu] = useState(1280);
  const [advanced, setAdvanced] = useState(false);
  const t = words[lang];
  const config = useMemo(() => result, [result]);

  async function generate() {
    if (!accepted) return;
    const pair = createKeyPair();
    const demo = buildDemoConfig(pair.privateKey, pair.publicKey, { name, format, platform, mtu });
    setResult(demo);
    setQr(await QRCode.toDataURL(demo, { width: 220, margin: 2, color: { dark: "#0b1018", light: "#ffffff" } }));
    // Drop references promptly; JavaScript engines do not guarantee memory zeroization.
    pair.privateKey.fill(0);
  }
  function download() {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([config], { type: "text/plain" })); a.download = "quiet-tunnel-demo.conf"; a.click(); URL.revokeObjectURL(a.href);
  }
  async function copy() { await navigator.clipboard.writeText(config); setCopyText(t.copied); setTimeout(() => setCopyText(t.copy), 1500); }

  return <main className={dark ? "site dark" : "site light"}>
    <header className="topbar wrap">
      <Link className="brand" href="/" aria-label="Quiet Tunnel home"><span className="mark"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2.5 35 11v18L20 37.5 5 29V11L20 2.5Z"/><path d="M13 27V16.5a7 7 0 0 1 14 0V27M17 27v-8a3 3 0 0 1 6 0v8M20 24v7"/></svg></span><span>quiet tunnel</span></Link>
      <nav><a href="/guide">{t.nav}</a><a href="/about">{t.about}</a><a href="https://github.com/kolyased/quiet-tunnel" aria-label="GitHub"><Code2 size={18}/></a></nav>
      <div className="tools"><button className="icon-button" onClick={()=>setLang(lang === "ru" ? "en" : "ru")} aria-label={t.lang}><Globe2 size={17}/><span>{lang.toUpperCase()}</span></button><button className="icon-button" onClick={()=>setDark(!dark)} aria-label={t.theme}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div>
    </header>
    <div className="wrap content">
      <section className="hero"><div className="eyebrow"><span className="pulse"/> PRIVACY FIRST <span className="version">v0.1</span></div><h1>{t.hero}</h1><p>{t.sub}</p></section>
      <div className="notice"><span className="notice-icon"><Shield size={19}/></span><div><strong>{t.demo}</strong><p>{t.unavailable}</p></div><span className="demo-pill">DEMO</span></div>
      <section className="generator" aria-labelledby="generator-title">
        <div className="section-head"><div><span className="step">01 — CONFIGURE</span><h2 id="generator-title">{lang === "ru" ? "Создать конфигурацию" : "Create configuration"}</h2></div><span className="lock"><LockKeyhole size={15}/> LOCAL KEY</span></div>
        <div className="field"><label>{t.format}</label><div className="choice-row"><button className={format === "wireguard"?"choice selected":"choice"} onClick={()=>setFormat("wireguard")}><span className="radio"/><span><b>WireGuard</b><small>{lang === "ru"?"Стандартный формат":"Standard format"}</small></span></button><button className={format === "amneziawg"?"choice selected":"choice"} onClick={()=>setFormat("amneziawg")}><span className="radio"/><span><b>AmneziaWG</b><small>{lang === "ru"?"Режим WireGuard без обфускации":"WireGuard mode, no obfuscation"}</small></span></button></div><p className="help">{lang === "ru"?"AmneziaWG не добавляет маскировку при подключении к обычному WireGuard-серверу.":"AmneziaWG does not add obfuscation when connecting to a standard WireGuard server."}</p></div>
        <div className="field"><label>{t.os}</label><div className="platforms">{(["Android","iOS","Windows","macOS","Linux"] as Platform[]).map(x=><button key={x} className={platform===x?"platform active":"platform"} onClick={()=>setPlatform(x)}>{x}</button>)}</div></div>
        <div className="field"><label htmlFor="conf-name">{t.name}</label><input id="conf-name" value={name} maxLength={48} onChange={e=>setName(e.target.value)}/></div>
        <button className="advanced-toggle" onClick={()=>setAdvanced(!advanced)} aria-expanded={advanced}>{t.advanced}<ChevronDown size={17} className={advanced?"rotate":""}/></button>
        {advanced&&<div className="advanced-fields"><label>{t.mtu}<input type="number" min={1280} max={1420} value={mtu} onChange={e=>setMtu(Math.min(1420,Math.max(1280,Number(e.target.value))))}/></label><span>{t.dns}: 1.1.1.1</span><span>{t.mode}: IPv4 / IPv6</span><button onClick={()=>{setName("Quiet Tunnel · Demo");setMtu(1280);setFormat("wireguard");setPlatform("Android")}}>{lang==="ru"?"Сбросить":"Reset"}</button></div>}
        <label className="consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>{t.agree} <a href="https://www.cloudflare.com/terms/" target="_blank" rel="noreferrer">{t.terms}</a></span></label>
        <button className="primary" disabled={!accepted} onClick={generate}><KeyRound size={18}/>{t.mock}</button>
        {!accepted&&<p className="consent-hint">{t.termsRequired}</p>}
        <p className="privacy-line"><LockKeyhole size={14}/>{t.privacy}</p>
      </section>
      {config&&<section className="result"><div className="result-top"><div><span className="step">02 — {t.demoLabel.toUpperCase()}</span><h2>{name}</h2></div><button className="icon-button" onClick={()=>{setResult("");setQr("");setExpanded(false)}} aria-label={t.clear}>×</button></div><div className="result-warning">{t.demoNotice}</div><div className="result-actions"><button onClick={download}><ArrowDownToLine size={16}/>{t.download}</button><button onClick={copy}><Check size={16}/>{copyText}</button><button onClick={()=>setExpanded(!expanded)}><KeyRound size={16}/>{expanded?(lang==="ru"?"Скрыть":"Hide"):t.show}</button><button onClick={()=>document.getElementById("instructions")?.scrollIntoView({behavior:"smooth"})}><QrCode size={16}/>{t.guide}</button></div>{expanded&&<pre className="config-text">{config}</pre>}<details className="qr"><summary><QrCode size={17}/>{t.qr}</summary>{qr&&<Image src={qr} alt="Local demo QR code" width={220} height={220} unoptimized/>}</details><p className="ephemeral">{lang==="ru"?"После перезагрузки страницы результат исчезнет, если не сохранить файл.":"The result is lost on refresh unless you save the file."}</p></section>}
      <section className="benefits"><h2>{t.features}</h2><div className="benefit-grid"><div><LockKeyhole/><b>{t.local}</b></div><div><Code2/><b>{t.open}</b></div><div><Shield/><b>{t.noAccount}</b></div></div></section>
      <section className="guide" id="instructions"><span className="step">03 — NEXT STEP</span><h2>{t.guide}</h2><p>{lang==="ru"?"Для реального подключения установите WireGuard или AmneziaWG из официального магазина. Демо-файл Quiet Tunnel не подключается к серверу.":"For a real connection, install WireGuard or AmneziaWG from the official store. Quiet Tunnel demo files do not connect to a server."}</p><div className="guide-links"><a href="https://www.wireguard.com/install/" target="_blank" rel="noreferrer">WireGuard ↗</a><a href="https://docs.amnezia.org/ru/documentation/amnezia-wg/" target="_blank" rel="noreferrer">AmneziaWG ↗</a></div></section>
      <footer><Link className="brand small" href="/"><span className="mark"><svg viewBox="0 0 40 40"><path d="M20 2.5 35 11v18L20 37.5 5 29V11L20 2.5Z"/><path d="M13 27V16.5a7 7 0 0 1 14 0V27M17 27v-8a3 3 0 0 1 6 0v8M20 24v7"/></svg></span><span>quiet tunnel</span></Link><span>{t.footer}</span><span>MIT · v0.1</span></footer>
    </div>
  </main>;
}
