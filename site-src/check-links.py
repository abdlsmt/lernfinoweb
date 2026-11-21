"""Check local destinations used in the static site, including sitemap and demo audio."""

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "https://lernfino.com"
SITE_HOSTS = {"lernfino.com", "www.lernfino.com"}


class Page(HTMLParser):
    def __init__(self, file):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.refs = []
        self.feed(file.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if attributes.get("id"):
            self.ids.add(attributes["id"])
        self.refs.extend(attributes[key] for key in ("href", "src") if attributes.get(key))

    handle_startendtag = handle_starttag


pages = {}
for file in ROOT.rglob("index.html"):
    if "site-src" not in file.parts and ".git" not in file.parts:
        pages[file] = Page(file)

failures = set()
total = 0


def verify(source, link):
    global total
    if urlsplit(link).scheme not in ("", "http", "https"):
        return
    base = f"{ORIGIN}/{source.relative_to(ROOT).as_posix()}"
    url = urlsplit(urljoin(base, link))
    if url.hostname not in SITE_HOSTS:
        return
    total += 1
    name = unquote(url.path).lstrip("/")
    target = ROOT / name
    if target.is_dir():
        target = target / "index.html"
    if not target.is_file():
        failures.add((source, link, "missing file"))
    elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
        failures.add((source, link, "missing fragment"))


for source, page in pages.items():
    for link in page.refs:
        verify(source, link)

sitemap = ROOT / "sitemap.xml"
for item in ElementTree.parse(sitemap).iter():
    if item.tag.endswith("}loc") and item.text:
        verify(sitemap, item.text)
    elif item.attrib.get("href"):
        verify(sitemap, item.attrib["href"])

demo = ROOT / "site-src/demo.json"
for records in json.loads(demo.read_text(encoding="utf-8")).values():
    for record in records.values():
        if record.get("audioFile"):
            verify(ROOT / "index.html", record["audioFile"])

for sheet in (ROOT / "styles.css", ROOT / "home.css"):
    for link in re.findall(r"url\(\s*['\"]?([^\s)'\"]+)", sheet.read_text(encoding="utf-8")):
        verify(sheet, link)

for source, link, reason in sorted(failures):
    print(f"{source.relative_to(ROOT)}: {link} ({reason})", file=sys.stderr)
print(f"{len(pages)} pages, {total} local references, {len(failures)} broken links")
sys.exit(bool(failures))
