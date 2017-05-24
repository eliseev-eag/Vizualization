from django import forms
from django.forms import SelectMultiple

from rest_server.models import Event


class EventSearchForm(forms.ModelForm):
    event_type = forms.MultipleChoiceField(choices=[], required=False, label='Тип события',
                                           widget=SelectMultiple(attrs={'size': 2}))

    start_date = forms.DateField(required=False, label='Дата начала')
    end_date = forms.DateField(required=False, label='Дата окончания')

    class Meta:
        model = Event
        fields = ('start_date', 'end_date', 'event_type', 'toponyms', 'persons', 'name')
        labels = {
            'name': '',
            'toponyms': 'Встречаемые топонимы',
            'persons': 'Действующие лица'
        }
        widgets = {
            'toponyms': SelectMultiple(attrs={'size': 2}),
            'persons': SelectMultiple(attrs={'size': 2}),
        }

    def __init__(self, *args, **kwargs):
        super(EventSearchForm, self).__init__(*args, **kwargs)
        for field in iter(self.fields):
            self.fields[field].widget.attrs.update({
                'class': 'form-control'
            })
        self.fields['event_type'].choices = Event.objects.values_list('event_type', 'event_type').distinct()
