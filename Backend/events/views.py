from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from .models import CalendarEvent
from .serializers import CalendarEventSerializer


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
