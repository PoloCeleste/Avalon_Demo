from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

from pathlib import Path

TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"])
)

FORMAT_TO_TEMPLATE_SUFFIX = {
    "p": "portrait",
    "l": "landscape",
    "l2": "landscape_2col",
}

def render_timetable_pdf(context: dict, format_type: str = "landscape") -> bytes:
    suffix = FORMAT_TO_TEMPLATE_SUFFIX.get(format_type, "l")
    template_name = f"timetable_{suffix}.html"
    try:
        tmpl = env.get_template(template_name)
    except Exception:
        tmpl = env.get_template("timetable_landscape.html")
        
    html = tmpl.render(**context)
    pdf_bytes = HTML(string=html).write_pdf()
    return pdf_bytes