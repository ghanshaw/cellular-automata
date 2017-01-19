from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from . import calculation

# Create your views here.
def start(request):

	#template = loader.get_template('game_of_life/game.html')

	patternUrl = 'game_of_life/images/still_lifes/';



	context = {
		'is_game': True,
		'still_lifes': [
			{
				'pattern': 'block',
				'src': 'game_of_life/images/still_lifes/{}.svg'.format('block')
			},
			{
				'pattern': 'flower',
				'src': 'game_of_life/images/still_lifes/{}.svg'.format('flower')
			},
			{
				'pattern': 'beehive',
				'src': 'game_of_life/images/still_lifes/{}.svg'.format('beehive')
			},
			{
				'pattern': 'loaf',
				'src': 'game_of_life/images/still_lifes/{}.svg'.format('loaf')
			},
			{
				'pattern': 'block',
				'src': 'game_of_life/images/still_lifes/{}.svg'.format('boat')
			},
		]

	}
	return render(request, 'game_of_life/game.html', context)
	#return HttpResponse(template.render(context, request))
