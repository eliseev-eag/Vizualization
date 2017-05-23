from django import forms

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
        fields = ('name', 'start_date', 'end_date', 'event_type', 'toponyms', 'persons')
        labels = {
            'name': '',
            'start_date': 'Дата начала',
            'end_date': 'Дата окончания',
            'event_type': 'Тип события',
            'toponyms': 'Встречаемые топонимы',
            'persons': 'Действующие лица'
        }
