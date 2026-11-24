"use client";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="site dark"><div className="wrap content"><h1>Ошибка</h1><p>Не удалось отобразить страницу.</p><button onClick={()=>reset()}>Попробовать снова</button></div></main>}
