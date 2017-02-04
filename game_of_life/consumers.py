from django.http import HttpResponse
from channels.handler import AsgiHandler
from channels.sessions import channel_session, enforce_ordering
from .models import Pattern
from .conway import Conway
import json
from time import time
import math

# Connected to websocket.connect
def ws_connect(message):
    message.reply_channel.send({
        'accept': True
})

# Connected to websocket.receive
# @enforce_ordering(slight=False)
@channel_session
def ws_receive(message):

	# Track execution time of processing one message
	start_time = time()

	# Get message from client side
	message_dict = json.JSONDecoder().decode(message.content['text'])

	# Number of message so far
	order = message.content['order']

	# Initialize game
	if message_dict['serverCommand'] == 'initConway':

			# Create generations array
			message.channel_session['generations'] = []

			# Initialize Grid object
			conway = Conway(message_dict['rows'], message_dict['cols'])

			# Add default pattern to Grid
			center_row = math.floor(message_dict['rows']/2)
			center_col = math.floor(message_dict['cols']/2)

			# Extract pattern to add to game
			pattern_cells = Pattern.objects.get(name='pulsar')
			pattern_rows = pattern_cells.rows
			pattern_columns = pattern_cells.columns
			pattern_cells = json.JSONDecoder().decode(pattern_cells.cells)

			# Compute row/col pair to center pattern
			row_col = (center_row - math.floor(pattern_rows/2), center_col - math.floor(pattern_columns/2))

			# Add pattern to game
			conway.add_pattern(row_col[0],row_col[1], 'pulsar')

			# Generate predictions
			conway.predict(45)

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

		# Generating more predictions (adding to prediction buffer on client side)
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

			# Create response message
			message_json = {
				'content': 'predictions',
				'predictions': generations[year:year + 30],
				'clientCommand': message_dict['clientCommand'],
				'genTimeline': conway.gen_timeline,
				'limit': conway.limit,
				'order': order
			}

		# Clearing game (deleting all live cells, resetting timeline)
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

		# Add pattern to game at specific location
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
			conway.predict(45)

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

		# Add cells activated by client to game
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
			conway.predict(45)

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

		# Randomize living cells in visible range of grid
		elif message_dict['serverCommand'] == 'randomize':

			# Retrieve year, row and col
			year = message_dict['year']
			grid_rows = message_dict['gridRows']
			grid_cols = message_dict['gridCols']

			# Retrieve generation at specific year
			# Delete generations from that year forward (including that year)
			gen = generations[year]
			del generations[year:]

			# Erase future
			conway.erase_future(year)

			# Reset conway game to that year
			conway.generation = gen

			# Randomize board, while preserving year
			conway.randomize(grid_rows, grid_cols)

			# Generate predictions
			conway.predict(45)

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

	# Jsonify message
	message_json = json.dumps(message_json, default=set_default)

	# Send data to client
	message.reply_channel.send({
		"text": message_json,
	})

	# Finish tracking execution
	end_time = time()
	print('Consumers.py time: ' + str(end_time - start_time) + ' s')


# Helper function to jsonify sets
def set_default(obj):
	if isinstance(obj, set):
		return list(obj)
	raise TypeError






