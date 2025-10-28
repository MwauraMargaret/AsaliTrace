from django.shortcuts import render

def home(request):
    return render(request, 'asalitrace/home.html', {
        'title': 'AsaliTrace - Honey Supply Chain Tracker'
    })