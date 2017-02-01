from django.http import HttpResponse
from channels.handler import AsgiHandler
from .conway import Conway
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

	# Intialize game
	if message_dict['serverCommand'] == 'initConway':

			# Create generations array
			message.channel_session['generations'] = []

			# Initialize Grid object
			conway = Conway(message_dict['rows'], message_dict['cols'])

			# Add default pattern to Grid
			center_row = math.floor(message_dict['rows']/2)
			center_col = math.floor(message_dict['cols']/2)
			conway.add_pattern(center_row, center_col, 'lightweight spaceship')
			# new_cells = [(2,2), (2,4), (2,5), (2,6), (3,2), (3,3), (5,5), (7,7), (9,9)]
			# conway.activate_cells(new_cells)

			# Generate predictions
			conway.predict(30)

			# Create response message
			message_json = {
				'content': 'predictions',
				'predictions': conway.predictions,
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'limit': conway.limit,
				'order': order
			}

			# Add generation to generations array
			message.channel_session['generations'].extend(conway.predictions)

	elif 'generations' in message.channel_session:

		# Retrieve variables from session
		generations = message.channel_session['generations']
		conway = message.channel_session['conway']

		if message_dict['serverCommand'] == 'getPredictions':

			# Retrieve year
			year = int(message_dict['year'])

			# Compute number of predictions left to create
			num_predictions = year + 30 - conway.generation['year']

			if num_predictions > 0:
				# Generate new predictions
				conway.predict(num_predictions)

				# Delete last year from generations array
				del generations[-1]

				# Add generations to generations array
				generations.extend(conway.predictions)

			message_json = {
				'content': 'predictions',
				'predictions': generations[year:year + 30],
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'limit': conway.limit,
				'order': order
			}

		elif message_dict['serverCommand'] == 'clear':

			# Erase future
			conway.erase_future(0)

			# Clear game
			conway.clear()

			# Create response message
			message_json = {
				'content': 'predictions',
				'predictions': [conway.generation],
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'limit': conway.limit,
				'order': order
			}

			# Empty generations array
			message.channel_session['generations'] = []
			message.channel_session['generations'].append(conway.generation)

		elif message_dict['serverCommand'] == 'addPattern':

			# Retrieve pattern and placement from message
			row = message_dict['row']
			col = message_dict['col']
			pattern = message_dict['pattern']
			year = message_dict['year']

			# Retrieve generation at specific year
			# Delete generations from that year forward (including that year)
			gen = generations[year]
			del generations[year:]

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
				'limit': conway.limit,
				'order': order
			}

			# Add generations to generations array
			generations.extend(conway.predictions)

		elif message_dict['serverCommand'] == 'activateCells':

			# Retrieve array of new cells, and year
			new_cells = message_dict['newCells']
			year = message_dict['year']

			# Retrieve generation at specific year
			# Delete generations from that year forward (including that year)
			gen = generations[year]
			del generations[year:]

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
				'limit': conway.limit,
				'order': order
			}

			# Add generations to generations array
			generations.extend(conway.predictions)

		elif message_dict['serverCommand'] == 'randomize':

			# Retrieve year, row and col
			year = message_dict['year']
			gridRows = message_dict['gridRows']
			gridCols = message_dict['gridCols']

			# Retrieve generation at specific year
			# Delete generations from that year forward (including that year)
			gen = generations[year]
			del generations[year:]

			# Erase future
			conway.erase_future(year)

			# Reset conway game to that year
			conway.generation = gen

			# Randomize board, while preserving year
			conway.randomize(gridRows, gridCols)

			# Generate predictions
			conway.predict(30)

			# Create response message
			message_json = {
				'content': 'predictions',
				'predictions': conway.predictions,
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'limit': conway.limit,
				'order': order
			}

			# Add generations to generations array
			generations.extend(conway.predictions)

	# Sanity check: confirm that conway and session are at same year
	assert len(conway.gen_timeline) == len(message.channel_session['generations'])
	
	# Update session with latest version of conway
	message.channel_session['conway'] = conway

	# # If limit reached, inform client
	# if conway.limit_reached():
	# 	message_json['limit'] = {
	# 		'year': conway.limit_year,
	# 		'param': conway.limit_param
	# 	}

	# Jsonify Data
	message_json = json.dumps(message_json, default=set_default)

	# Send data to client
	message.reply_channel.send({
		"text": message_json,
	})

	end_time = time()
	print('Consumers.py time : ' +  str(end_time - start_time) + ' s')


# Helper function to jsonify sets
def set_default(obj):
	if isinstance(obj, set):
		return list(obj)
	raise TypeError

# def limit_reached(conway, generations, year, order):
#
# 	message_json = {
# 		'content': 'predictions',
# 		'predictions': generations[year:year + 30],
# 		'clientCommand': 'limitReached',
# 		'genTimeline': conway.gen_timeline,
# 		'order': order,
# 		'limit': conway.limit
# 	}






