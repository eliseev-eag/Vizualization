from datetime import datetime

from django.db.models import ExpressionWrapper, fields, Count, Max, Min
from django.db.models import F
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from rest_server.forms import EventSearchForm
from rest_server.models import Event


def index(request):
    event_search_form = EventSearchForm()
    return render(request, 'index.html', {'form': event_search_form})


@csrf_exempt
def get_events(request, start_date, end_date):
    start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
    end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

    timeline_length = ((end_date - start_date) * 0.02)
    duration = ExpressionWrapper(F('end_date') - F('start_date'), output_field=fields.DurationField())

    events = Event.objects.filter(end_date__gte=start_date,
                                  start_date__lte=end_date,
                                  parent_event__isnull=True)
    if request.method != "POST":
        events = events.annotate(duration=duration).filter(duration__gte=timeline_length)
    else:
        events = search_filters(request, events)
    values = events.values('id', 'start_date', 'end_date', 'name', 'event_type', 'parent_event')
    return JsonResponse({'events': list(values)})


def get_nested(request, parent_event_id):
    parent_event = Event.objects.get(pk=parent_event_id)
    events = Event.objects.filter(parent_event=parent_event)
    values = events.values('id', 'start_date', 'end_date', 'name', 'event_type', 'parent_event')
    return JsonResponse({'events': list(values)})


def get_event_types(request):
    event_types = Event.objects.values_list('event_type').distinct()
    return JsonResponse(list(event_types), safe=False)


def search_filters(request, events):
    form = EventSearchForm(request.POST)
    if not form.is_valid():
        return events
    name = form.cleaned_data.get('name')
    start_date = form.cleaned_data.get('start_date')
    end_date = form.cleaned_data.get('end_date')
    event_types = form.cleaned_data.get('event_type')
    persons = form.cleaned_data.get('persons')
    toponyms = form.cleaned_data.get('toponyms')

    if name:
        events = events.filter(name__icontains=name)
    if start_date:
        events = events.filter(start_date__gte=start_date)
    if end_date:
        events = events.filter(end_date__lte=end_date)
    if event_types:
        events = events.filter(event_type__in=event_types)
    if toponyms:
        for toponym in toponyms:
            events = events.filter(toponym=toponym)
    if persons:
        for person in persons:
            events = events.filter(person=person)
    return events


@csrf_exempt
def search(request):
    if request.method != "POST":
        return None

    form = EventSearchForm(request.POST)
    if not form.is_valid():
        return None

    events = Event.objects.all()
    events = search_filters(request, events)
    dates_boundary_values = events.aggregate(Max('end_date'), Min('start_date'))
    count = int(request.POST['count'])
    events = events.order_by('start_date')[:count]
    values = events.values('id', 'start_date', 'end_date', 'name', 'event_type', 'parent_event')
    return JsonResponse({'events': list(values), 'max_date': dates_boundary_values['end_date__max'],
                         'min_date': dates_boundary_values['start_date__min']})
