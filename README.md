# Резюме — Владимир Калмыков

Статическая страница для GitHub Pages. Русская версия в корне, английская в `en/`.

## Локальный просмотр

Откройте `index.html` в браузере или поднимите любой статический сервер из корня репозитория:

```bash
npx --yes serve .
```

## PDF

Страница печатается в A4. Собрать файл можно скриптом — он поднимает локальный сервер и прогоняет страницу через Chrome или Edge:

```bash
node scripts/to-pdf.mjs resume-ru.pdf /
node scripts/to-pdf.mjs resume-en.pdf /en/
```

Нужен установленный Chrome или Edge. Если браузер стоит в нестандартном месте:

```bash
set BROWSER_PATH=C:\path\to\chrome.exe
node scripts/to-pdf.mjs
```

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub и запушьте эту ветку (`main`).
2. Settings → Pages → **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`.
4. Сохраните. Через минуту страница будет по адресу:

- `https://<user>.github.io/<repo>/` — если репозиторий обычный
- `https://<user>.github.io/` — если репозиторий называется `<user>.github.io`

Файл `.nojekyll` отключает обработку Jekyll, чтобы Pages отдавал HTML как есть.

## Что внутри

| Файл | Назначение |
| --- | --- |
| `index.html` | Русская страница |
| `en/index.html` | Английская страница |
| `css/styles.css` | Сетка, темы, мобильная вёрстка, печать |
| `js/theme.js` | Системная тема + ручной переключатель |
| `assets/avatar.webp` | Фото, сжатое из `avatar.png` |
| `scripts/to-pdf.mjs` | Сборка PDF через Chrome/Edge |
| `resume-ru.pdf` / `resume-en.pdf` | Готовые PDF |

Тема берётся из системных настроек, затем запоминается в `localStorage` после ручного переключения.

Исходники `avatar.png` и `resume.txt` на страницу не попадают.

Переключатель языка и ссылка на PDF — в правом верхнем углу фото.
