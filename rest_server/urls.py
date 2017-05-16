from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.index,name='index'),
    url(r'^events/(?P<start_date>\d{4}-\d{2}-\d{2})/(?P<end_date>\d{4}-\d{2}-\d{2})/$', views.get_events),
    url(r'^nested_events/(?P<parent_event_id>[0-9]+)', views.get_nested),
]
