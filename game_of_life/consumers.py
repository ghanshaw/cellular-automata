from django.http import HttpResponse
from channels.handler import AsgiHandler
from . import calculation
from django.core.serializers.json import DjangoJSONEncoder
import json
from channels.sessions import channel_session
from time import time
import math



def ws_connect(message):
	print('Just connected')

@channel_session
def ws_receive(message):

	start_time = time()

	# Get message from client side
	message_dict = json.JSONDecoder().decode(message.content['text'])


	if 'grid' in message.channel_session:

		grid = message.channel_session['grid']
		start_time = message.channel_session['start_time']

		if message_dict['serverCommand'] == 'step':
			step_enter = time()
			grid.step()
			step_leave = time()
			print('Step Time: ', step_leave - step_enter)

		elif message_dict['serverCommand'] == 'random':
			print('Command: Random Grid')
			grid.random()

		elif message_dict['serverCommand'] == 'clear':
			grid.clear()

		elif message_dict['serverCommand'] == 'predict':

			# Generate predictions
			grid.predict()

			# Create response message
			message_json = {
				'type': 'prediction',
				'grid': grid.predictions,
				'command': message_dict['clientCommand']
			}

		elif message_dict['serverCommand'] == 'addPattern':
			print(message_dict)

			row = message_dict['row']
			col = message_dict['col']
			pattern = message_dict['pattern']
			grid.add_pattern(row, col, pattern)


		elif message_dict['serverCommand'] == 'activateCells':

			new_cells = message_dict['newCells']
			grid.activate_cells(new_cells)
			#grid.predict(10)


	else:
		if message_dict['serverCommand'] == 'initGrid':

			# Initialize Grid object
			grid = calculation.Grid(message_dict['rows'], message_dict['cols'])

			# Add default pattern to Grid
			center_row = math.floor(message_dict['rows']/2)
			center_col = math.floor(message_dict['cols']/2)
			grid.add_pattern(center_row, center_col, 'lightweight spaceship')

			# Generate predictions
			grid.predict(30)

			# Create response message
			message_json = {
				'type': 'prediction',
				'grid': grid.predictions,
				'command': message_dict['clientCommand']
			}


	# Add grid to session
	message.channel_session['grid'] = grid
	message.channel_session['start_time'] = start_time

	# Jsonify Data
	message_json = DjangoJSONEncoder().encode(message_json)

	# Send data to client
	message.reply_channel.send({
		"text": message_json,
	})


