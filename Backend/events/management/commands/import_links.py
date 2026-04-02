# Backend/events/management/commands/import_links.py
import json
import os
from django.core.management.base import BaseCommand
from events.models import LinkCategory, LinkItem

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

class Command(BaseCommand):
    help = 'Imports links from JSON, merges English labels, and generates vector embeddings'

    def handle(self, *args, **kwargs):
        # Resolve paths assuming the script is run from inside the Backend folder
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        project_root = os.path.dirname(base_dir) # Go up one more level to repo root
        
        zh_path = os.path.join(project_root, 'Frontend', 'public', 'links.json')
        en_path = os.path.join(project_root, 'Frontend', 'public', 'links.en.json')

        self.stdout.write("Reading JSON files...")
        with open(zh_path, 'r', encoding='utf-8') as f:
            zh_data = json.load(f)
        with open(en_path, 'r', encoding='utf-8') as f:
            en_data = json.load(f)

        # Create a dictionary lookup for English categories by ID
        en_cat_lookup = {cat['id']: cat for cat in en_data}

        model = None
        if SentenceTransformer is not None:
            self.stdout.write("Loading sentence-transformers model (this might take a moment)...")
            # paraphrase-multilingual-MiniLM-L12-v2 is lightweight and excellent for Chinese + English
            model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        else:
            self.stdout.write(self.style.WARNING('sentence_transformers is not installed; syncing labels without regenerating embeddings.'))

        if model is not None:
            self.stdout.write("Clearing old link data...")
            LinkCategory.objects.all().delete()

        self.stdout.write("Processing and embedding data...")
        for zh_cat in zh_data:
            cat_id = zh_cat['id']
            en_cat = en_cat_lookup.get(cat_id, {})

            # 1. Create or update Category
            if model is not None:
                category = LinkCategory.objects.create(
                    slug=cat_id,
                    icon=zh_cat['icon'],
                    label=zh_cat['label'],
                    label_en=en_cat.get('label_en', '')
                )
            else:
                category, _ = LinkCategory.objects.update_or_create(
                    slug=cat_id,
                    defaults={
                        'icon': zh_cat['icon'],
                        'label': zh_cat['label'],
                        'label_en': en_cat.get('label_en', ''),
                    }
                )

            # Create a lookup for english links by URL (URLs act as unique identifiers)
            en_links_lookup = {link['url']: link for link in en_cat.get('links', [])}

            # 2. Process and Create Links
            for zh_link in zh_cat['links']:
                en_link = en_links_lookup.get(zh_link['url'], {})
                label_en = en_link.get('label_en', '')

                # Combine Chinese and English labels for a richer search vector
                text_to_embed = zh_link['label']
                if label_en:
                    text_to_embed += f" {label_en}"

                embedding_vector = None
                if model is not None:
                    # Generate embedding and convert to standard Python list for JSONField
                    embedding_vector = model.encode(text_to_embed).tolist()

                if model is not None:
                    LinkItem.objects.create(
                        category=category,
                        label=zh_link['label'],
                        label_en=label_en,
                        url=zh_link['url'],
                        icon=zh_link['icon'],
                        embedding=embedding_vector
                    )
                else:
                    LinkItem.objects.update_or_create(
                        category=category,
                        url=zh_link['url'],
                        defaults={
                            'label': zh_link['label'],
                            'label_en': label_en,
                            'icon': zh_link['icon'],
                        }
                    )

        self.stdout.write(self.style.SUCCESS('Successfully imported, merged, and vectorized all links!'))