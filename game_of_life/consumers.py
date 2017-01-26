from django.http import HttpResponse
from channels.handler import AsgiHandler
from .calculation import Conway
from django.core.serializers.json import DjangoJSONEncoder
import json
from channels.sessions import channel_session, enforce_ordering
from time import time
import math




def ws_connect(message):
	print('Just connected')


#@enforce_ordering(slight=False)
@channel_session
def ws_receive(message):

	start_time = time()

	# Get message from client side
	message_dict = json.JSONDecoder().decode(message.content['text'])

	order = message.content['order']


	if 'generations' in message.channel_session:

		generations = message.channel_session['generations']
		# start_time = message.channel_session['start_time']

		if message_dict['serverCommand'] == 'getPredictions':

			# Retrieve game (with latest generation)
			conway = message.channel_session['conway']

			# Retrieve year
			year = int(message_dict['year'])

			# Compute number of predictions left to create
			num_predictions = year + 30 - conway.generation['year']

			if num_predictions > 0:
				# Generate new predictions
				conway.predict(num_predictions)

				# Delete last year from generations array
				del message.channel_session['generations'][-1]

				# Add generations to generations array
				message.channel_session['generations'].extend(conway.predictions)

			message_json = {
				'content': 'predictions',
				'predictions': generations[year:year + 30],
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'order': order
			}


		elif message_dict['serverCommand'] == 'clear':

			# Retrieve game (with latest generation)
			conway = message.channel_session['conway']

			# Clear game
			conway.clear()

			# Create response message
			message_json = {
				'content': 'generation',
				'generation': conway.generation,
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'order': order
			}

			# Empty generations array
			message.channel_session['generations'] = []

		elif message_dict['serverCommand'] == 'addPattern':

			# Retrieve game (with latest generation)
			conway = message.channel_session['conway']

			# Retrieve pattern and placement from message
			row = message_dict['row']
			col = message_dict['col']
			pattern = message_dict['pattern']
			year = message_dict['year']

			# Retrieve generation at specific year
			# Delete generations from that year forward (including that year)
			gen = message.channel_session['generations'][year]
			del message.channel_session['generations'][year:]

			# Erase future
			conway.erase_future(year)

			# Reset conway game to that year
			conway.generation = gen

			# Add pattern to game
			conway.add_pattern(row, col, pattern)

			# Generate predictions
			conway.predict(30)

			# Create response message
			message_json = {
				'content': 'predictions',
				'predictions': conway.predictions,
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'order': order
			}

			# Add generations to generations array
			message.channel_session['generations'].extend(conway.predictions)

		elif message_dict['serverCommand'] == 'activateCells':

			# Retrieve game (with latest generation)
			conway = message.channel_session['conway']

			# Retrieve array of new cells, and year
			new_cells = message_dict['newCells']
			year = message_dict['year']

			# Retrieve generation at specific year
			# Delete generations from that year forward (including that year)
			gen = message.channel_session['generations'][year]
			del message.channel_session['generations'][year:]

			# Erase future
			conway.erase_future(year)

			# Reset conway game to that year
			conway.generation = gen

			# Add pattern to game
			conway.activate_cells(new_cells)

			# Generate predictions
			conway.predict(30)

			# Create response message
			message_json = {
				'content': 'predictions',
				'predictions': conway.predictions,
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'order': order
			}

			# Add generations to generations array
			message.channel_session['generations'].extend(conway.predictions)

		elif message_dict['serverCommand'] == 'randomize':

			# Retrieve game (with latest generation)
			conway = message.channel_session['conway']

			# Retrieve year
			year = message_dict['year']

			# Retrieve generation at specific year
			# Delete generations from that year forward (including that year)
			gen = message.channel_session['generations'][year]
			del message.channel_session['generations'][year:]

			# Erase future
			conway.erase_future(year)

			# Reset conway game to that year
			conway.generation = gen

			# Randomize board, while preserving year
			conway.randomize(year)

			# Generate predictions
			conway.predict(30)

			# Create response message
			message_json = {
				'content': 'predictions',
				'predictions': conway.predictions,
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'order': order
			}

			# Add generations to generations array
			message.channel_session['generations'].extend(conway.predictions)



	else:
		if message_dict['serverCommand'] == 'initGrid':

			# Create generations array
			message.channel_session['generations'] = []

			# Initialize Grid object
			conway = Conway(message_dict['rows'], message_dict['cols'])

			# Add default pattern to Grid
			center_row = math.floor(message_dict['rows']/2)
			center_col = math.floor(message_dict['cols']/2)
			conway.add_pattern(center_row, center_col, 'lightweight spaceship')

			# Generate predictions
			conway.predict(30)

			# Create response message
			message_json = {
				'content': 'predictions',
				'predictions': conway.predictions,
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'order': order
			}

			# Add generation to generations array
			message.channel_session['generations'].extend(conway.predictions)


	# Add grid to session

	assert len(conway.gen_timeline) == len(message.channel_session['generations'])

	message.channel_session['start_time'] = start_time
	message.channel_session['conway'] = conway

	# Jsonify Data
	message_json = DjangoJSONEncoder().encode(message_json)

	# Send data to client
	message.reply_channel.send({
		"text": message_json,
	})



# elif message_dict['serverCommand'] == 'step':
# 	step_enter = time()
# 	grid.step()
# 	step_leave = time()
# 	print('Step Time: ', step_leave - step_enter)
#
# elif message_dict['serverCommand'] == 'random':
# 	print('Command: Random Grid')
# 	grid.random()
