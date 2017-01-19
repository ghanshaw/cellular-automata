from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from . import calculation
from .models import Pattern

# Create your views here.
def start(request):

	still_lifes = Pattern.objects.filter(type='still life')
	oscillators = Pattern.objects.filter(type='oscillators')
	spaceships = Pattern.objects.filter(type='spaceships')
	infinite_growth = Pattern.objects.filter(type='infinite growth')

	context = {
		'is_game': True,
		'still_lifes': still_lifes,
		'oscillators': oscillators,
		'spaceships': spaceships,
		'infinite_growth': infinite_growth
	}
	return render(request, 'game_of_life/game.html', context)
