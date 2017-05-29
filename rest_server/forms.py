from django import forms
from django.forms import SelectMultiple
from django.utils.translation import ugettext_lazy

from rest_server.models import Event


class EventSearchForm(forms.ModelForm):
    event_type = forms.MultipleChoiceField(choices=[], required=False, label='Тип события',
                                           widget=SelectMultiple(attrs={'size': 2}))

    start_date = forms.DateField(required=False, label='С')
    end_date = forms.DateField(required=False, label='До')
    name = forms.CharField(required=False, label=None)

    class Meta:
        model = Event
        fields = ('start_date', 'end_date', 'event_type', 'toponyms', 'persons', 'name')
        labels = {
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

    def clean(self):
        cleaned_data = super(EventSearchForm, self).clean()
        form_empty = True
        for field_value in cleaned_data.values():
            if field_value and field_value[0] != '':
                form_empty = False
                break
        if form_empty:
            raise forms.ValidationError(ugettext_lazy("Пожалуйста, введите название или выберите фильтры"))
        return cleaned_data  # Important that clean should return cleaned_data!
