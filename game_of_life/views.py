from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from .models import Pattern


# Create your views here.
def start(request):

	# Get pattern details from Pattern model
	still_lifes = Pattern.objects.filter(type='still life')
	oscillators = Pattern.objects.filter(type='oscillators')
	spaceships = Pattern.objects.filter(type='spaceships')
	infinite_growth = Pattern.objects.filter(type='infinite growth')

	# Discalimer to be included in tooltip
	simulation_info = '''
		This website uses newer web technologies such as WebSockets, flexboxes and D3.js. Consider upgrading or
		switching your browser to the latest version available to ensure the best user experience.
	'''

	context = {
		'still_lifes': still_lifes,
		'oscillators': oscillators,
		'spaceships': spaceships,
		'infinite_growth': infinite_growth,
		'simulation_info': simulation_info
	}
	return render(request, 'game_of_life/game.html', context)
