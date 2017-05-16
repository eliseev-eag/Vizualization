import json

from django.http import JsonResponse
from django.shortcuts import render

from rest_server.models import Event


def get_events(request, start_date, end_date):
    events = Event.objects.filter(end_date__gte=start_date, start_date__lte=end_date, parent_event__isnull=True)
    values = events.values('id', 'start_date', 'end_date', 'name')
    return JsonResponse({'events': list(values)})


def index(request):
    return render(request, 'index.html')
