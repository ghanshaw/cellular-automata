from django.http import HttpResponse
from channels.handler import AsgiHandler
from . import calculation
from django.core.serializers.json import DjangoJSONEncoder
import json
from channels.sessions import channel_session
from time import time



def ws_connect(message):
	print('Just connected')

@channel_session
def ws_receive(message):



	# Get message from client side
	message_dict = json.JSONDecoder().decode(message.content['text'])

	# command_dict = {
	# 	'step': step,
	# 	'addPattern': add_pattern,
	# 	'random': random,
	# 	'activateCells': activate_cells
	# }
	#
	# # Aquire command
	# command = message_dict['command']

	if 'grid' in message.channel_session:

		grid = message.channel_session['grid']
		start_time = message.channel_session['start_time']

		if message_dict['command'] == 'step':
			step_enter = time()
			grid.step()
			step_leave = time()
			print('Step Time: ', step_leave - step_enter)

		elif message_dict['command'] == 'random':
			print('Command: Random Grid')
			grid.random()

		elif message_dict['command'] == 'clear':
			grid.clear()


		elif message_dict['command'] == 'addPattern':

			print(message_dict)

			row = message_dict['row']
			col = message_dict['col']
			pattern = message_dict['pattern']
			grid.add_pattern(row, col, pattern)


		elif message_dict['command'] == 'activateCells':

			new_cells = message_dict['newCells']
			grid.activate_cells(new_cells)


	else:
		start_time = time()
		print('Start Time: ', start_time)

		print('Making grid')
		exploder = calculation.Grid(message_dict['rows'], message_dict['cols'])
		exploder.grid[10][10] = 1
		exploder.grid[11][9] = 1
		exploder.grid[11][10] = 1
		exploder.grid[11][11] = 1
		exploder.grid[12][9] = 1
		exploder.grid[12][11] = 1
		exploder.grid[13][10] = 1
		grid = exploder

	# Add grid to session
	message.channel_session['grid'] = grid
	message.channel_session['start_time'] = start_time

	# Create response message
	message_json = {
		'proceed': True,
		'grid' : grid.get_grid(),
	}

	# Jsonify Data
	message_json = DjangoJSONEncoder().encode(message_json)


	# Send data to client
	message.reply_channel.send({
		"text": message_json,
	})


