from datetime import datetime

from django.db.models import ExpressionWrapper, fields
from django.db.models import F
from django.http import JsonResponse
from django.shortcuts import render

from rest_server.models import Event


def index(request):
    return render(request, 'index.html')


def get_events(request, start_date, end_date):
    start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
    end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    timeline_length = ((end_date - start_date) * 0.008)
    duration = ExpressionWrapper(F('end_date') - F('start_date'), output_field=fields.DurationField())
    events = Event.objects.annotate(duration=duration).filter(end_date__gte=start_date,
                                                              start_date__lte=end_date,
                                                              duration__gte=timeline_length,
                                                              parent_event__isnull=True)
    values = events.values('id', 'start_date', 'end_date', 'name', 'event_type', 'parent_event')
    return JsonResponse({'events': list(values)})


def get_nested(request, parent_event_id):
    parent_event = Event.objects.get(pk=parent_event_id)
    events = Event.objects.filter(parent_event=parent_event)
    values = events.values('id', 'start_date', 'end_date', 'name', 'event_type', 'parent_event')
    return JsonResponse({'events': list(values)})
