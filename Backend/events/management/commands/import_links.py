# Backend/events/management/commands/import_links.py
"""
從 Frontend/public/links.json 匯入連結至資料庫。

links.json 格式（由 scripts/fetch_myntu_links.py 產生）：
[
  {
    "id": "students",
    "icon": "🎓",
    "label": "學生專區",
    "label_en": "Students",
    "links": [
      {
        "label":    "中文名稱",
        "label_en": "English name (空字串表示英文版不顯示)",
        "url":      "https://...",
        "url_en":   "https://... (英文版專屬連結，可與中文相同)",
        "icon":     "https://my.ntu.edu.tw/nasattach/xxx.png"
      },
      ...
    ]
  },
  ...
]
"""
import json
import os
from django.core.management.base import BaseCommand
from events.models import LinkCategory, LinkItem

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None


class Command(BaseCommand):
    help = 'Import links from Frontend/public/links.json into the database'

    def handle(self, *args, **kwargs):
        # 解析路徑：Backend/events/management/commands/ → Backend/ → repo root/
        base_dir = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        )
        project_root = os.path.dirname(base_dir)
        links_path = os.path.join(project_root, 'Frontend', 'public', 'links.json')

        self.stdout.write(f"Reading {links_path} ...")
        with open(links_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # ── 載入 sentence-transformers（選用） ─────────────────
        model = None
        if SentenceTransformer is not None:
            self.stdout.write(
                "Loading sentence-transformers model "
                "(paraphrase-multilingual-MiniLM-L12-v2)..."
            )
            model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        else:
            self.stdout.write(
                self.style.WARNING(
                    'sentence_transformers not installed; skipping vector embeddings.'
                )
            )

        # ── 清空舊資料（只在有模型時才清，避免沒模型時清掉 embeddings）
        if model is not None:
            self.stdout.write("Clearing old link data...")
            LinkCategory.objects.all().delete()

        # ── 匯入 ───────────────────────────────────────────────
        self.stdout.write("Importing links...")
        total_links = 0

        for cat_data in data:
            cat_id = cat_data['id']

            if model is not None:
                category = LinkCategory.objects.create(
                    slug=cat_id,
                    icon=cat_data.get('icon', ''),
                    label=cat_data.get('label', ''),
                    label_en=cat_data.get('label_en', ''),
                )
            else:
                category, _ = LinkCategory.objects.update_or_create(
                    slug=cat_id,
                    defaults={
                        'icon':     cat_data.get('icon', ''),
                        'label':    cat_data.get('label', ''),
                        'label_en': cat_data.get('label_en', ''),
                    },
                )

            for link in cat_data.get('links', []):
                label_zh = link.get('label', '')
                label_en = link.get('label_en', '')

                # 向量嵌入：中文名稱 + 英文名稱（如果有）
                item_embeddings: list = []
                if model is not None:
                    texts_to_embed = [label_zh]
                    if label_en:
                        texts_to_embed.append(label_en)
                    item_embeddings = [model.encode(t).tolist() for t in texts_to_embed]

                if model is not None:
                    LinkItem.objects.create(
                        category=category,
                        label=label_zh,
                        label_en=label_en,
                        url=link.get('url', ''),
                        icon=link.get('icon', ''),
                        keywords='',         # 新格式不再維護 keywords
                        embeddings=item_embeddings,
                    )
                else:
                    LinkItem.objects.update_or_create(
                        url=link.get('url', ''),
                        defaults={
                            'category':   category,
                            'label':      label_zh,
                            'label_en':   label_en,
                            'icon':       link.get('icon', ''),
                            'keywords':   '',
                            'embeddings': item_embeddings,
                        },
                    )
                total_links += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Successfully imported {total_links} links '
                f'across {len(data)} categories.'
            )
        )