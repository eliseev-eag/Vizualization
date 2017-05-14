from django.db import models


# Create your models here.
class Event(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=15000)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return self.name


class RelationshipOfEvents(models.Model):
    id = models.AutoField(primary_key=True)
    parent_event = models.ForeignKey(Event, related_name='parent_event')
    child_event = models.ForeignKey(Event,related_name='child_event')
    REASON = 'reason'
    RESULT = 'result'
    RELATIONSHIP_DIRECTION_CHOICES = (
        (REASON, 'reason'),
        (RESULT, 'result')
    )
    relationship_direction = models.CharField(max_length=6, choices=RELATIONSHIP_DIRECTION_CHOICES)
