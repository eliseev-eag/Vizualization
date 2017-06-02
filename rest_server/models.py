from django.db import models


class Event(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=15000)
    start_date = models.DateField()
    end_date = models.DateField()
    parent_event = models.ForeignKey('self', null=True, blank=True)
    article_id = models.BigIntegerField(blank=True, null=True)
    event_type = models.CharField(max_length=15000, blank=True, default='(Без категории)')
    sentence = models.CharField(max_length=20000, blank=True)
    toponyms = models.ManyToManyField('Toponym', blank=True)
    persons = models.ManyToManyField('Person', blank=True)

    def __str__(self):
        return self.name


class Toponym(models.Model):
    name = models.CharField(max_length=15000)
    latitude = models.DecimalField(max_digits=15, decimal_places=12, blank=True, null=True)
    longitude = models.DecimalField(max_digits=15, decimal_places=12, blank=True, null=True)
    link_to_article = models.BigIntegerField(blank=True, null=True)
    events = models.ManyToManyField('Event', blank=True, through=Event.toponyms.through)

    def __str__(self):
        return self.name


class Person(models.Model):
    name = models.CharField(max_length=15000, blank=True)
    surname = models.CharField(max_length=15000)
    patron = models.CharField(max_length=15000, blank=True)
    link_to_article = models.BigIntegerField(blank=True, null=True)
    events = models.ManyToManyField('Event', blank=True, through=Event.persons.through)

    def __str__(self):
        return self.name + ' ' + self.surname + ' ' + self.patron


class RelationshipOfEvents(models.Model):
    id = models.AutoField(primary_key=True)
    parent_event = models.ForeignKey(Event)
    child_event = models.ForeignKey(Event, related_name='child_event')
    REASON = 'reason'
    RESULT = 'result'
    RELATIONSHIP_DIRECTION_CHOICES = (
        (REASON, 'reason'),
        (RESULT, 'result')
    )
    relationship_direction = models.CharField(max_length=6, choices=RELATIONSHIP_DIRECTION_CHOICES)
