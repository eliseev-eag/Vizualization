from django import forms
from django.forms import CheckboxSelectMultiple, SelectMultiple, Select

from rest_server.models import Event


class EventSearchForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(EventSearchForm, self).__init__(*args, **kwargs)
        for field in iter(self.fields):
            self.fields[field].widget.attrs.update({
                'class': 'form-control'
            })

    class Meta:
        model = Event
        fields = ('start_date', 'end_date', 'event_type', 'toponyms', 'persons', 'name')
        labels = {
            'name': '',
            'start_date': 'Дата начала',
            'end_date': 'Дата окончания',
            'event_type': 'Тип события',
            'toponyms': 'Встречаемые топонимы',
            'persons': 'Действующие лица'
        }
        widgets = {
            'event_type': SelectMultiple(choices=(('sport', 'Спортивные события',), ('war', 'Военные события')),
                                         attrs={'size': 2}),
            'toponyms': SelectMultiple(attrs={'size': 2}),
            'persons': SelectMultiple(attrs={'size': 2}),
        }
