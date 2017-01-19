from django.http import HttpResponse
from channels.handler import AsgiHandler
from . import calculation
from django.core.serializers.json import DjangoJSONEncoder
import json
from channels.sessions import channel_session


def ws_connect(message):
	print('Just connected')

@channel_session
def ws_receive(message):
	print('Just received')

	print(message.content)
	message_dict = json.JSONDecoder().decode(message.content['text'])
	print(message_dict)

	if 'grid' in message.channel_session:
		if 'command' in message_dict:
			if message_dict['command'] == 'dropPattern':
				row = message_dict['row']
				col = message_dict['col']
				pattern = message_dict['pattern']

				grid = message.channel_session['grid']
				grid.add_pattern(row, col, pattern)

		print('Angel of my soul');


	if 'grid' not in message.channel_session:
		print('Making grid')
		#if message_dict['start']:
		#grid = calculation.start()

		exploder = calculation.Grid(message_dict['rows'], message_dict['cols'])
		exploder.grid[10][10] = 1
		exploder.grid[11][9] = 1
		exploder.grid[11][10] = 1
		exploder.grid[11][11] = 1
		exploder.grid[12][9] = 1
		exploder.grid[12][11] = 1
		exploder.grid[13][10] = 1
		grid = exploder


	else:
		print('Stepping grid')
		grid = message.channel_session['grid']
		grid.gen_step()


	print("Grid created/updated")
	message.channel_session['grid'] = grid

	print("Put grid in a python object")
	message_json = {
		'proceed': True,
		'grid' : grid.get_grid(),
	}

	print("Jsonify the grid")
	# Jsonify Data
	message_json = DjangoJSONEncoder().encode(message_json)


	print(message_json)

	print("Send data to client")
	message.reply_channel.send({
		"text": message_json,
		#'info': info
	})


