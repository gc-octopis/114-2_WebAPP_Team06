from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import math
import random
from django.db import transaction
from django.db.models import Q
from .models import CalendarEvent, Announcement, UserPreference, LinkCategory, LinkItem, FeedbackPost, ContactMessage
from .serializers import CalendarEventSerializer, AnnouncementSerializer, LinkCategorySerializer, LinkItemSerializer, FeedbackPostSerializer, ContactMessageSerializer
from .search_service import SemanticSearchService


FEEDBACK_AVATAR_COLORS = [
    "#ab3e3e", "#da894f", "#d6b659", "#457e5a", "#309c90",
    "#35b9de", "#87915d", "#8a5eb4", "#d380a9", "#313841",
]

def _normalize_language(lang: str) -> str:
    value = (lang or 'zh').strip().lower()
    if value in ['zh', 'zh-tw', 'zh_tw']:
        return 'zh'
    if value == 'en':
        return 'en'
    return ''


class CalendarEventListView(APIView):
    """
    API endpoint to list calendar events.
    
    Query parameters:
    - lang: 'zh' or 'en' (required)
    - start_date: 'YYYY-MM-DD' (optional, filter events from this date)
    - end_date: 'YYYY-MM-DD' (optional, filter events until this date)
    """

    def get(self, request):
        try:
            # Get language parameter
            lang = request.query_params.get('lang', 'zh')
            if lang not in ['zh', 'en']:
                return Response(
                    {'error': 'Invalid language. Use "zh" or "en".'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get optional date filters
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')

            # Build query
            queryset = CalendarEvent.objects.filter(language=lang)

            # Apply date filters if provided
            if start_date:
                try:
                    start_date_obj = datetime.fromisoformat(start_date).date()
                    queryset = queryset.filter(date_start__gte=start_date_obj)
                except ValueError:
                    return Response(
                        {'error': 'Invalid start_date format. Use YYYY-MM-DD.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if end_date:
                try:
                    end_date_obj = datetime.fromisoformat(end_date).date()
                    queryset = queryset.filter(date_start__lte=end_date_obj)
                except ValueError:
                    return Response(
                        {'error': 'Invalid end_date format. Use YYYY-MM-DD.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Serialize and return
            serializer = CalendarEventSerializer(queryset, many=True)
            return Response({
                'count': queryset.count(),
                'language': lang,
                'events': serializer.data
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnnouncementListView(APIView):
    """
    API endpoint to list announcements.

    Query parameters:
    - lang: 'zh' or 'en' (optional, default 'zh')
    - category: category exact match (optional)
    - page: page number, starts from 1 (optional, default 1)
    - page_size: items per page (optional, default 10, max 100)
    """

    def get(self, request):
        try:
            lang = _normalize_language(request.query_params.get('lang', 'zh'))
            if not lang:
                return Response(
                    {'error': 'Invalid language. Use "zh" or "en".'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            announcements_qs = Announcement.objects.filter(language=lang)
            source_language = lang

            # Keep behavior aligned with old frontend fallback:
            # use Chinese announcements when English source is empty/missing.
            if lang == 'en' and not announcements_qs.exists():
                announcements_qs = Announcement.objects.filter(language='zh')
                source_language = 'zh'

            announcements_qs = announcements_qs.order_by('-date', '-id')

            # Collect all categories before filtering so frontend can build selector.
            all_categories = sorted({
                item
                for item in announcements_qs.values_list('category', flat=True)
                if str(item).strip()
            })

            category = (request.query_params.get('category') or '').strip()
            filtered_qs = announcements_qs
            if category:
                filtered_qs = filtered_qs.filter(category__iexact=category)

            page_raw = request.query_params.get('page', '1')
            page_size_raw = request.query_params.get('page_size', '10')
            try:
                page = int(page_raw)
                page_size = int(page_size_raw)
            except ValueError:
                return Response(
                    {'error': 'Invalid page or page_size. Use positive integers.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if page < 1 or page_size < 1:
                return Response(
                    {'error': 'Invalid page or page_size. Use positive integers.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            page_size = min(page_size, 100)
            total_count = filtered_qs.count()
            total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0

            if total_pages > 0 and page > total_pages:
                page = total_pages

            start_index = (page - 1) * page_size
            end_index = start_index + page_size
            paged_qs = filtered_qs[start_index:end_index]
            paged_announcements = AnnouncementSerializer(paged_qs, many=True).data

            return Response({
                'count': total_count,
                'language': lang,
                'source_language': source_language,
                'category': category,
                'categories': all_categories,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages,
                'announcements': paged_announcements,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserPreferenceView(APIView):
    """
    API endpoint to get or update user preferences.
    """

    def get(self, request):
        user_id = request.headers.get('X-User-Id')
        if not user_id:
            return Response({'error': 'X-User-Id header is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        pref, _ = UserPreference.objects.get_or_create(user_id=user_id)
        return Response({'pinned_links': pref.pinned_links})

    def post(self, request):
        user_id = request.headers.get('X-User-Id')
        if not user_id:
            return Response({'error': 'X-User-Id header is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        pinned_links = request.data.get('pinned_links')
        if not isinstance(pinned_links, list):
            return Response({'error': 'pinned_links must be a list'}, status=status.HTTP_400_BAD_REQUEST)

        pref, _ = UserPreference.objects.get_or_create(user_id=user_id)
        pref.pinned_links = pinned_links
        pref.save()
        return Response({'pinned_links': pref.pinned_links})

class LinkListView(APIView):
    """
    Returns the full list of categories and links, identical to links.json.
    """
    def get(self, request):
        categories = LinkCategory.objects.all()
        serializer = LinkCategorySerializer(categories, many=True)
        return Response(serializer.data)

class HybridSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        # --- 1. LEXICAL SEARCH (Keyword) ---
        # Look for exact or partial matches in labels
        lexical_results = LinkItem.objects.filter(
            Q(label__icontains=query) | Q(label_en__icontains=query)
        )
        
        # --- 2. SEMANTIC SEARCH (Vector) ---
        query_embedding = SemanticSearchService.encode_query(query)
        all_links = LinkItem.objects.exclude(embeddings__isnull=True)
        
        semantic_scores = {}
        for link in all_links:
            score = SemanticSearchService.cosine_similarity(query_embedding, link.embeddings[0])
            if score > 0.3: # Threshold
                semantic_scores[link.id] = score

        # --- 3. HYBRID FUSION (Simplified Weighted Scoring) ---
        # For small datasets, a weighted sum is often more predictable than RRF
        final_rankings = []
        
        # Combine all unique links found in either search
        all_found_ids = set(list(lexical_results.values_list('id', flat=True)) + list(semantic_scores.keys()))
        
        for link_id in all_found_ids:
            link = LinkItem.objects.get(id=link_id)
            
            # Boost score if it was a keyword match
            lexical_boost = 0.5 if link in lexical_results else 0.0
            # Get the vector score
            vector_score = semantic_scores.get(link_id, 0.0)
            
            # Final formula: adjust weights to your liking
            final_score = (vector_score * 0.7) + (lexical_boost * 0.3)
            
            final_rankings.append({
                'link': link,
                'score': final_score
            })

        # Sort by final score
        final_rankings.sort(key=lambda x: x['score'], reverse=True)
        top_results = [r['link'] for r in final_rankings[:10]]
        
        serializer = LinkItemSerializer(top_results, many=True)
        return Response(serializer.data)


class FeedbackPostListCreateView(APIView):
    """
    API endpoint for anonymous feedback board.

    GET:
    - page: page number, starts from 1 (optional, default 1)
    - page_size: items per page (optional, default 10, max 50)

    POST body:
    - nickname: optional display name
    - parent_id: optional parent post ID (when creating a reply)
    - title: required
    - content: required
    """

    def get(self, request):
        try:
            page_raw = request.query_params.get('page', '1')
            page_size_raw = request.query_params.get('page_size', '10')

            try:
                page = int(page_raw)
                page_size = int(page_size_raw)
            except ValueError:
                return Response(
                    {'error': 'Invalid page or page_size. Use positive integers.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if page < 1 or page_size < 1:
                return Response(
                    {'error': 'Invalid page or page_size. Use positive integers.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            page_size = min(page_size, 50)
            queryset = FeedbackPost.objects.filter(parent__isnull=True).prefetch_related('replies')
            total_count = queryset.count()
            total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0

            if total_pages > 0 and page > total_pages:
                page = total_pages

            start_index = (page - 1) * page_size
            end_index = start_index + page_size
            serializer = FeedbackPostSerializer(queryset[start_index:end_index], many=True)

            return Response({
                'count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages,
                'posts': serializer.data,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        nickname = (request.data.get('nickname') or '').strip()[:80]
        content = (request.data.get('content') or '').strip()
        parent_id_raw = request.data.get('parent_id')

        if not content:
            return Response({'error': 'content is required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(content) > 3000:
            return Response({'error': 'content is too long (max 3000 characters)'}, status=status.HTTP_400_BAD_REQUEST)

        parent = None
        if parent_id_raw not in (None, ''):
            try:
                parent_id = int(parent_id_raw)
            except (TypeError, ValueError):
                return Response({'error': 'parent_id must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

            parent = FeedbackPost.objects.filter(id=parent_id).first()
            if parent is None:
                return Response({'error': 'parent post not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            post = FeedbackPost.objects.create(
                parent=parent,
                nickname=nickname or 'Anonymous',
                avatar_color=random.choice(FEEDBACK_AVATAR_COLORS),
                title='',
                content=content,
            )

            while FeedbackPost.objects.filter(parent__isnull=True).count() > 40:
                oldest_post = FeedbackPost.objects.filter(parent__isnull=True).order_by('created_at', 'id').first()
                if oldest_post is None:
                    break
                oldest_post.delete()

        serializer = FeedbackPostSerializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ContactMessageCreateView(APIView):
    """
    API endpoint for contact form submissions.
    Only POST is supported — messages are viewed via Django Admin.

    POST body:
    - name: optional sender name (max 100)
    - email: optional email address
    - message: required message content (max 3000)
    """

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.validated_data.get('message', '').strip()
        if not message:
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(message) > 3000:
            return Response({'error': 'message is too long (max 3000 characters)'}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({'success': True}, status=status.HTTP_201_CREATED)