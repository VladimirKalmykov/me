"""Check that the four editorial resumes remain readable and self-contained."""

from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "output" / "pdf"
LINKS = {
    "https://t.me/xperier",
    "mailto:vladimirkalmykov16@yandex.ru",
    "https://github.com/VladimirKalmykov",
    "https://www.linkedin.com/in/vladimirkalmykov/",
    "https://vladimirkalmykov.github.io/me/",
}

for profile in ("frontend", "fullstack"):
    for lang in ("ru", "en"):
        path = PDF_DIR / f"{profile}-{lang}.pdf"
        reader = PdfReader(path)
        assert len(reader.pages) == 2, path
        assert all(abs(float(page.mediabox.width) - 595.276) < 1 for page in reader.pages), path
        assert all(abs(float(page.mediabox.height) - 841.89) < 1 for page in reader.pages), path
        first, second = (page.extract_text() for page in reader.pages)
        assert len(reader.pages[0].images) == 1, f"Missing first-page portrait: {path}"
        assert len(first) > 1000 and len(second) > 1000, path
        assert "Storybook" not in first + second, path
        if lang == "ru":
            assert first.index("Владимир Калмыков") < first.index("Профиль") < first.index("Избранные результаты") < first.index("Опыт"), path
            assert second.index("Касперского") < second.index("SmartPack") < second.index("Infotech") < second.index("Образование"), path
            assert "архитектуру" in second and "1 млрд кодов" in second, path
        else:
            assert first.index("Vladimir Kalmykov") < first.index("Profile") < first.index("Selected results") < first.index("Experience"), path
            assert second.index("Kaspersky") < second.index("SmartPack") < second.index("Infotech") < second.index("Education"), path
            assert "architecture" in second and "one billion marking codes" in second, path
        found = {
            annotation.get_object().get("/A", {}).get("/URI")
            for page in reader.pages
            for annotation in page.get("/Annots", [])
        }
        assert LINKS <= found, (path, LINKS - found)
        print(f"{path.name}: 2 A4 pages, selectable text, reading order and links OK")
