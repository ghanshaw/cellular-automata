from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from . import calculation

# Create your views here.
def start(request):
	#template = loader.get_template('game_of_life/game.html')
	context = {
		'is_game': True
	}
	return render(request, 'game_of_life/game.html')
	#return HttpResponse(template.render(context, request))
