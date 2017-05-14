from django.http import JsonResponse
from django.shortcuts import render


# Create your views here.
def index(request):
    response = {}
    response['test'] = 'test'
    response['hello'] = [1,2,3]
    response['inside'] = response.copy()
    return JsonResponse(response)
