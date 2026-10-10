"""Build four reading-first, two-page A4 resumes from shared verified facts."""

from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
pdfmetrics.registerFont(TTFont("Geologica", str(ROOT / "assets" / "fonts" / "Geologica-Regular.ttf")))
pdfmetrics.registerFont(TTFont("GeologicaSemi", str(ROOT / "assets" / "fonts" / "Geologica-Semibold.ttf")))

PAGE_W, PAGE_H = A4
MARGIN = 48
CONTENT_W = PAGE_W - 2 * MARGIN
INK = colors.HexColor("#17232c")
MUTED = colors.HexColor("#4b5d66")
ACCENT = colors.HexColor("#176e79")
RULE = colors.HexColor("#cbd7dc")
FONT_NAME = "Geologica"
FONT_SEMI = "GeologicaSemi"
PORTFOLIO = "https://vladimirkalmykov.github.io/me/"


COPY = {
    "ru": {
        "name": "Владимир Калмыков",
        "contact": [
            ("Telegram", "t.me/xperier", "https://t.me/xperier"),
            ("Почта", "vladimirkalmykov16@yandex.ru", "mailto:vladimirkalmykov16@yandex.ru"),
            ("GitHub", "github.com/VladimirKalmykov", "https://github.com/VladimirKalmykov"),
            ("Портфолио", "vladimirkalmykov.github.io/me", PORTFOLIO),
        ],
        "profile": "Профиль",
        "results": "Избранные результаты",
        "experience": "Опыт",
        "earlier": "Ранее",
        "technology": "Технологии и компетенции",
        "education": "Образование и языки",
        "page": "стр.",
        "early_text": "Коммерческая разработка с 2010 года: самостоятельные проекты полного цикла, работа с заказчиками и нестандартные интеграции. Подробная хронология приведена с декабря 2016 года.",
        "education_text": "Дизайн среды, Институт современных бизнес-технологий и систем управления, Москва. Русский - родной; английский - B2.",
        "roles": {
            "prettifai": ("Prettifai", "ноя 2025 - сейчас", "Собственный экспериментальный продукт"),
            "yougile": ("YouGile", "окт 2024 - окт 2025", "Старший программист"),
            "kaspersky": ("Лаборатория Касперского", "июн 2023 - окт 2024", "Старший программист"),
            "smartpack": ("SmartPack", "июл 2020 - июл 2022", "Руководитель разработки интерфейсов"),
            "infotech": ("Infotech", "дек 2016 - июл 2020", "Руководитель core-команды"),
        },
        "experience_text": {
            "prettifai": "Проектирую редактор визуальных сценариев и интерфейсы сложных AI-процессов; в коде есть граф исполнения, кэширование узлов и выборочный перезапуск. Также реализованы фоновые задачи, интеграции провайдеров и платежные сценарии.",
            "yougile": "Инициировал модернизацию платформы расширений: React, TypeScript, Rollup, SDK, поэтапный CI. Работал над сложными Workflow и Timetracker. За время моей работы экосистема выросла с 3 до 23 расширений благодаря усилиям команды.",
            "kaspersky": "Разработка и диагностика интерфейса Security Center в большой enterprise-системе с жёсткими ограничениями безопасности и доступа к инструментам.",
            "smartpack": "Собрал команду из шести разработчиков. Создал UI kit, сайт с практическими гайдами и примерами, SDK и выпуск внутренних пакетов. AST-инструмент помог локализовать три приложения примерно за четыре дня вместо оценённого месяца ручной работы. Разработал Android-приложение для ТСД с React Native и нативным Java-модулем.",
            "infotech": "Выстроил дизайн-систему, UI kit, SDK и архитектурные стандарты как общую основу для трёх продуктовых команд.",
        },
    },
    "en": {
        "name": "Vladimir Kalmykov",
        "contact": [
            ("Telegram", "t.me/xperier", "https://t.me/xperier"),
            ("Email", "vladimirkalmykov16@yandex.ru", "mailto:vladimirkalmykov16@yandex.ru"),
            ("GitHub", "github.com/VladimirKalmykov", "https://github.com/VladimirKalmykov"),
            ("Portfolio", "vladimirkalmykov.github.io/me", PORTFOLIO),
        ],
        "profile": "Profile",
        "results": "Selected results",
        "experience": "Experience",
        "earlier": "Earlier work",
        "technology": "Technology and strengths",
        "education": "Education and languages",
        "page": "page",
        "early_text": "Commercial software development since 2010, including end-to-end projects, direct client work, and unusual integrations. The detailed chronology begins in December 2016.",
        "education_text": "Environmental Design, Institute of Modern Business Technologies and Management Systems, Moscow. Russian - native; English - B2.",
        "roles": {
            "prettifai": ("Prettifai", "Nov 2025 - present", "Independent experimental product"),
            "yougile": ("YouGile", "Oct 2024 - Oct 2025", "Senior Software Engineer"),
            "kaspersky": ("Kaspersky", "Jun 2023 - Oct 2024", "Senior Software Engineer"),
            "smartpack": ("SmartPack", "Jul 2020 - Jul 2022", "Head of UI Development"),
            "infotech": ("Infotech", "Dec 2016 - Jul 2020", "Core Team Lead"),
        },
        "experience_text": {
            "prettifai": "I design a visual workflow editor and interfaces for complex AI processes. The code includes an execution graph, node caching, and selective reruns. Background jobs, provider integrations, and payment flows are also implemented.",
            "yougile": "Initiated modernization of the extensions platform with React, TypeScript, Rollup, an SDK, and incremental CI. Contributed to complex Workflow and Timetracker extensions. During my tenure the ecosystem grew from 3 to 23 extensions through the team's work.",
            "kaspersky": "Developed and diagnosed Security Center frontend behavior in a large enterprise system with strict security and tooling constraints.",
            "smartpack": "Built and led a six-person frontend team. Created a UI kit, a custom guide site with practical examples, SDK packages, and an internal release process. An AST tool helped localize three applications in about four days against an estimated month of manual work. Built a React Native terminal app with a native Java module.",
            "infotech": "Created a design system, UI kit, SDK, and architecture standards used as a shared foundation by three product teams.",
        },
    },
}


PROFILES = {
    "frontend": {
        "ru": {
            "role": "Frontend Tech Lead / Software Architect",
            "summary": "16 лет коммерческой разработки. Создаю frontend-архитектуру, дизайн-системы и инструменты, с которыми командам проще выпускать и развивать продукты. Работал как инженер, архитектор и руководитель.",
            "results": [
                ("Платформа расширений YouGile", "Инициировал переход к React, TypeScript, SDK и поэтапной сборке. Модернизация заняла около двух недель; следующее расширение - около недели."),
                ("Команда и Developer Experience SmartPack", "Собрал команду из шести разработчиков; создал UI kit, сайт практических гайдов, SDK и процесс выпуска внутренних пакетов."),
                ("Автоматизация локализации", "AST-инструмент помог локализовать три приложения примерно за четыре дня вместо оценённого месяца ручной работы."),
            ],
            "tech": [
                "Frontend: TypeScript, JavaScript, React, Next.js, React Native, CSS, PostCSS.",
                "Архитектура: дизайн-системы, UI kit, SDK, микрофронтенды, ESM, Rollup, CI/CD.",
                "Руководство: формирование команды, технические стандарты, документация, работа между командами.",
            ],
        },
        "en": {
            "role": "Frontend Tech Lead / Software Architect",
            "summary": "16 years in commercial software development. I build frontend architecture, design systems, and developer tools that help teams ship and evolve products. My work spans hands-on engineering, architecture, and leadership.",
            "results": [
                ("YouGile extensions platform", "Initiated the move to React, TypeScript, an SDK, and incremental builds. The modernization took about two weeks; the next extension took about one week."),
                ("SmartPack developer experience", "Built a six-person frontend team and established a UI kit, a practical guide site, SDK packages, and an internal release process."),
                ("Localization automation", "An AST-based tool helped localize three applications in about four days against an estimated month of manual work."),
            ],
            "tech": [
                "Frontend: TypeScript, JavaScript, React, Next.js, React Native, CSS, PostCSS.",
                "Architecture: design systems, UI kits, SDKs, microfrontends, ESM, Rollup, CI/CD.",
                "Leadership: team building, technical standards, documentation, cross-team collaboration.",
            ],
        },
    },
    "fullstack": {
        "ru": {
            "role": "Senior Fullstack Developer / Product Engineer",
            "summary": "16 лет коммерческой разработки. Самостоятельно соединяю интерфейс, backend, фоновые процессы и продуктовую логику. Архитектурные решения проверяю на реальном сценарии пользователя и поддерживаемости системы.",
            "results": [
                ("Prettifai: продукт целиком", "В экспериментальном продукте разрабатываю редактор сценариев, граф исполнения, фоновые задачи, кэширование узлов, платежные потоки и интеграции AI-провайдеров."),
                ("Android-приложение для ТСД", "В SmartPack за примерно три недели собрал React Native приложение с Java-мостом для конкретного устройства и сканированием Data Matrix."),
                ("YouGile: расширяемая платформа", "Инициировал современную сборку и SDK для расширений; участвовал в сложных Workflow и Timetracker."),
            ],
            "tech": [
                "Product UI: TypeScript, React, Next.js, React Native, design systems.",
                "Backend: Node.js, API, PostgreSQL, Redis, очереди, фоновые процессы, платежи.",
                "Delivery: Docker, CI/CD, интеграции провайдеров, диагностика и архитектура.",
            ],
        },
        "en": {
            "role": "Senior Fullstack Developer / Product Engineer",
            "summary": "16 years in commercial software development. I connect product UI, backend services, background work, and business logic. I test architecture decisions against the actual user journey and long-term maintainability.",
            "results": [
                ("Prettifai: end-to-end product", "Building a workflow editor, execution graph, background jobs, node caching, payment flows, and AI provider integrations for an experimental product."),
                ("Android terminal app", "At SmartPack I built a React Native app in about three weeks, with a Java bridge for a specific device and Data Matrix scanning."),
                ("YouGile: extensible platform", "Initiated a modern build pipeline and SDK for extensions, and contributed to complex Workflow and Timetracker features."),
            ],
            "tech": [
                "Product UI: TypeScript, React, Next.js, React Native, design systems.",
                "Backend: Node.js, APIs, PostgreSQL, Redis, queues, background jobs, payments.",
                "Delivery: Docker, CI/CD, provider integrations, diagnostics, architecture.",
            ],
        },
    },
}


def wrap(text, size, max_width, font=FONT_NAME):
    lines = []
    current = ""
    for word in text.split():
        candidate = word if not current else current + " " + word
        if pdfmetrics.stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


class Page:
    def __init__(self, pdf, lang, page_number, role):
        self.pdf = pdf
        self.lang = lang
        self.copy = COPY[lang]
        self.y = PAGE_H - MARGIN
        self.pdf.setFillColor(colors.white)
        self.pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        if page_number == 2:
            self.text(self.copy["name"], 12, INK, font=FONT_SEMI)
            self.y -= 7
            self.text(role, 9, MUTED)
            self.y -= 14
            self.rule()
            self.y -= 12
        self.footer(page_number)

    def text(self, text, size=10, color=INK, x=MARGIN, max_width=CONTENT_W, leading=None, font=FONT_NAME):
        leading = leading or size * 1.5
        self.pdf.setFont(font, size)
        self.pdf.setFillColor(color)
        for line in wrap(text, size, max_width, font):
            self.pdf.drawString(x, self.y, line)
            self.y -= leading
        return self.y

    def rule(self):
        self.pdf.setStrokeColor(RULE)
        self.pdf.setLineWidth(.55)
        self.pdf.line(MARGIN, self.y, PAGE_W - MARGIN, self.y)

    def section(self, title):
        self.y -= 16
        self.rule()
        self.y -= 18
        self.text(title, 11, ACCENT, leading=16, font=FONT_SEMI)
        self.y -= 3

    def item(self, title, body):
        self.text(title, 10.4, INK, leading=16, font=FONT_SEMI)
        self.text(body, 10, MUTED, leading=15)
        self.y -= 9

    def experience(self, key):
        company, dates, role = self.copy["roles"][key]
        self.pdf.setFont(FONT_SEMI, 10.4)
        self.pdf.setFillColor(INK)
        self.pdf.drawString(MARGIN, self.y, company)
        self.pdf.setFont(FONT_NAME, 8.6)
        self.pdf.setFillColor(MUTED)
        self.pdf.drawRightString(PAGE_W - MARGIN, self.y, dates)
        self.y -= 16
        self.text(role, 9.4, ACCENT, leading=14)
        self.text(self.copy["experience_text"][key], 10, MUTED, leading=15)
        self.y -= 10

    def footer(self, page_number):
        self.pdf.setStrokeColor(RULE)
        self.pdf.setLineWidth(.5)
        self.pdf.line(MARGIN, 43, PAGE_W - MARGIN, 43)
        self.pdf.setFont(FONT_NAME, 8)
        self.pdf.setFillColor(MUTED)
        self.pdf.drawString(MARGIN, 29, "vladimirkalmykov.github.io/me")
        self.pdf.drawRightString(PAGE_W - MARGIN, 29, f"{self.copy['page']} {page_number} / 2")
        self.pdf.linkURL(PORTFOLIO, (MARGIN, 24, MARGIN + 175, 40), relative=0)


def contact_row(page):
    x = MARGIN
    page.pdf.setFont(FONT_NAME, 9)
    for index, (label, value, url) in enumerate(page.copy["contact"]):
        if index == 2:
            page.y -= 16
            x = MARGIN
        line = f"{label}: {value}"
        width = pdfmetrics.stringWidth(line, FONT_NAME, 9)
        page.pdf.setFillColor(ACCENT)
        page.pdf.drawString(x, page.y, line)
        page.pdf.linkURL(url, (x, page.y - 2, x + width, page.y + 10), relative=0)
        x += width + 24
    page.y -= 24


def build(profile, lang):
    copy = COPY[lang]
    selected = PROFILES[profile][lang]
    destination = OUT / f"{profile}-{lang}.pdf"
    pdf = canvas.Canvas(str(destination), pagesize=A4, pageCompression=1)
    pdf.setTitle(f"{copy['name']} - {selected['role']}")
    pdf.setAuthor(copy["name"])

    page = Page(pdf, lang, 1, selected["role"])
    page.text(copy["name"], 24, INK, leading=32, font=FONT_SEMI)
    page.y -= 1
    page.text(selected["role"], 11.5, ACCENT, leading=17, font=FONT_SEMI)
    page.y -= 5
    contact_row(page)
    page.section(copy["profile"])
    page.text(selected["summary"], 10, INK, leading=15)
    page.section(copy["results"])
    for title, body in selected["results"]:
        page.item(title, body)
    page.section(copy["experience"])
    page.experience("prettifai")
    page.experience("yougile")
    if page.y < 57:
        raise ValueError(f"Page 1 overflow in {destination.name}: y={page.y:.1f}")
    pdf.showPage()

    page = Page(pdf, lang, 2, selected["role"])
    for key in ("kaspersky", "smartpack", "infotech"):
        page.experience(key)
    page.section(copy["earlier"])
    page.text(copy["early_text"], 10, MUTED, leading=15)
    page.section(copy["technology"])
    for line in selected["tech"]:
        page.text(line, 10, INK, leading=15)
        page.y -= 6
    page.section(copy["education"])
    page.text(copy["education_text"], 10, MUTED, leading=15)
    if page.y < 57:
        raise ValueError(f"Page 2 overflow in {destination.name}: y={page.y:.1f}")
    pdf.save()
    print(f"{destination.name}: page 1 + page 2, page 2 ending at {page.y:.1f} pt")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for profile in ("frontend", "fullstack"):
        for lang in ("ru", "en"):
            build(profile, lang)
