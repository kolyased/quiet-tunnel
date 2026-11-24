# Quiet Tunnel — Тихий туннель

**Персональный генератор VPN-конфигураций.** Закрытое приложение для одного владельца; репозиторий открыт, сайт защищён паролем.

**Сайт:** https://quiet-tunnel.duckdns.org

Quiet Tunnel — независимый проект, не являющийся продуктом Cloudflare, WireGuard или Amnezia.

## Состояние

Приложение реализует модульную цепочку генерации: браузер создаёт X25519-пару, передаёт backend только публичный ключ, выбранный провайдер возвращает типизированные параметры, а браузер локально формирует WireGuard `.conf`, QR и файл. В репозитории есть `mock`, шаблон Cloudflare без сетевых запросов и режим `disabled`.

Mock позволяет проверить интерфейс и экспорт, но его endpoint находится в зарезервированном тестовом диапазоне и **не подключается к VPN**. Cloudflare-интеграция не реализована; production генерация выключена. Не вводите в production пароль генератора mock-конфигураций в расчёте на VPN-доступ.

## Возможности

- Вход одного владельца через scrypt-хеш и ограниченную по времени HttpOnly cookie.
- Локальная генерация ключей X25519. Приватный ключ не входит в API-запрос.
- Формирование конфигурации и QR только в браузере; скачивание, копирование и очистка результата.
- Динамические capabilities от backend, темы, RU/EN, адаптивный интерфейс и инструкции.
- Расширяемые адаптеры провайдеров с общей типизированной моделью.

На текущем этапе поддерживается экспорт WireGuard. AmneziaWG отключён, так как серверные параметры обфускации ни одним активным провайдером не подтверждены.

## Локальный запуск

Требуются Python 3.12+, Node.js 24+ и npm.

1. Создайте парольный хеш: `python3 scripts/hash_password.py`.
2. Создайте секрет сессии: `openssl rand -hex 32`.
3. В `backend/.env` или окружении задайте `APP_MODE=mock`, `VPN_PROVIDER=mock`, `AUTH_PASSWORD_HASH`, `AUTH_SESSION_SECRET`, `APP_ENV=development`, `ALLOWED_ORIGINS=http://127.0.0.1:3000`.
4. Запустите backend из `backend/`: `python -m pip install -r requirements.lock && uvicorn app.main:app --port 8000`.
5. В другом терминале запустите frontend: `cd frontend && npm ci && BACKEND_INTERNAL_URL=http://127.0.0.1:8000 npm run dev`.

Войдите паролем, подтвердите предупреждение mock и создайте фиктивный профиль. Для режима без генерации используйте `APP_MODE=disabled`.

## Проверки

```sh
cd frontend && npm ci && npm run lint && npx tsc --noEmit && npm test && npm run build
cd ../backend && pip install -r requirements.lock && ruff check app tests && pytest
```

E2E запускается `npm run e2e` из frontend; он запускает тестовый frontend и backend mock.

## Docker и VPS

Скопируйте `.env.example` в `.env`, задайте `APP_MODE=disabled`, `VPN_PROVIDER=cloudflare` (пока адаптер сообщает недоступность), `AUTH_PASSWORD_HASH`, `AUTH_SESSION_SECRET`, `APP_URL` и `ALLOWED_ORIGINS`. Ограничьте права: `chmod 600 .env`; затем `docker compose up -d --build`.

Production-контейнеры не публикуют backend-порт напрямую. Docker Compose обслуживает внутреннюю сеть приложения; существующий Caddy/Nginx остаётся внешним reverse proxy. VPS размещает только сайт и API: пользовательский VPN-трафик через него не маршрутизируется.

На действующем сервере проект расположен в `/opt/quiet-tunnel` и доступен по HTTPS. Управление:

```sh
./scripts/update.sh
./scripts/status.sh
./scripts/logs.sh
./scripts/rollback.sh
```

Подробности: [развёртывание](docs/DEPLOYMENT.md), [интеграция провайдера](docs/PROVIDER_INTEGRATION.md), [архитектура](docs/ARCHITECTURE.md), [безопасность](docs/SECURITY.md), [приватность](docs/PRIVACY.md), [исследование WARP](docs/RESEARCH.md).

## Приватность и ограничения

Backend не получает приватный ключ или полную конфигурацию. Сайт выдаёт JavaScript, которому пользователь должен доверять; открытый исходный код сам по себе не доказывает, что он совпадает с размещённой сборкой. QR содержит приватный ключ. Не пересылайте его посторонним. Не ведётся аналитика и не используется база профилей. Вход ограничен по попыткам, генерация ограничена по частоте.

Реальная интеграция провайдера, установление туннеля и сквозной VPN-трафик **не протестированы**. См. текущие ограничения в документации.

## Лицензия

MIT. См. [LICENSE](LICENSE).
