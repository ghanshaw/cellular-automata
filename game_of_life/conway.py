from random import randint
from .models import Pattern
import json
import copy
from time import time
from collections import defaultdict
import math

# Conway class implement Conway's Game of Life
class Conway():

	# Initialize Conway class
	def __init__(self, rows=10, cols=10):

		# Generation dict stores set of living cells,
		# generation year and population
		self.generation = {
			'cells': set(),
			'year': 0,
			'pop': 0
		}

		# Timeline (all activity since year 0) of game represented with a list,
		# stores population at every year (index)
		self.gen_timeline = []

		# Predictions list stores generations across a range of years
		self.predictions = []

		# (Arbitrary) limits imposed on simulation
		self.max_year = 2000
		self.max_pop = 5000
		self.limit = {
			'year': -1,
			'param': None
		}


	# Check if game has reached limits imposed on simulation
	def check_limit(self):
		# Limit has been reached already
		if self.limit['year'] != -1:
			return

		# Check if limit has been reached
		if self.generation['year'] >= self.max_year:
			self.limit['param'] = 'year'
			self.limit['year'] = self.generation['year']
		elif self.generation['pop'] >= self.max_pop:
			self.limit['param'] = 'population'
			self.limit['year'] = self.generation['year']
		return


	# Step through another generation
	def step(self):

		# Store all cells with positive total in moore neighborhood
		moore_total = defaultdict(int)

		# Iterate through living cells
		for cell in iter(self.generation['cells']):

			# Extract row and col
			row, col = cell

			# Define moore neighborhood of that cell
			moore_neighborhood = [
				(row - 1, col - 1),
				(row - 1, col),
				(row - 1, col + 1),
				(row, col - 1),
				(row, col + 1),
				(row + 1, col - 1),
				(row + 1, col),
				(row + 1, col + 1),
			]

			# For every moore neighbor, increment her moore neighboorhood total
			# Not total of cell currently being evaluated
			for r, c in moore_neighborhood:
				moore_total[(r, c)] += 1

		# Empty set for new living cells
		living_cells = set()

		# Iterate through all cells with positive moore neighborhood
		for cell in moore_total:

			# If that cell is also alive
			if cell in self.generation['cells']:

				# Apply rules of game, and add to new set of living cells
				if moore_total[cell] == 2 or moore_total[cell] == 3:
					living_cells.add(cell)

			# If cell is dead
			else:

				# Apply rules of game, and add to new set of living cells
				if moore_total[cell] == 3:
					living_cells.add(cell)

		# Replace generation set with new set, update generation details
		self.generation['cells'] = living_cells
		self.generation['pop'] = len(living_cells)
		self.generation['year'] += 1

		# Update timeline and check against simulation limits
		self.record_history()
		self.check_limit()
		return


	# Generate predictions, step through game num times and store in predictions list
	def predict(self, num=10):

		# Track execution time of method
		start_time = time()

		# Delete existing predictions
		del self.predictions
		self.predictions = []

		# Append current generation
		self.append_prediction()

		# Generate num predictions
		for i in range(num):
			self.step()
			self.append_prediction()

		# Print execution time of method
		end_time = time()
		print('Predict Time: ' + str(end_time - start_time) + ' s')
		return


	# Append current generation to predictions list
	def append_prediction(self):
		self.predictions.append(copy.deepcopy(self.generation))
		return


	# Add activated cells to game
	def activate_cells(self, new_cells):

		# Iterate through cells, tupelize and add to game
		for cell in new_cells:
			self.generation['cells'].add(tuple(cell))

		# Update population, update timeline and check against limits
		self.generation['pop'] = len(self.generation['cells'])
		self.record_history()
		self.check_limit()
		return


	# Add pattern to game at specific location
	def add_pattern(self, row_offset, col_offset, pattern):

		# Get pattern from Pattern model
		pattern_cells = Pattern.objects.get(name=pattern)
		rows = pattern_cells.rows
		columns = pattern_cells.columns
		pattern_cells = json.JSONDecoder().decode(pattern_cells.cells)

		# Clear space first
		for i in range(rows):
			for j in range(columns):

				# Get row and column
				row = i + row_offset
				col = j + col_offset

				cell = (row, col)

				# If cell is alive in generation, kill it
				if cell in self.generation['cells']:
					self.generation['cells'].remove(cell)

		# Add cells in pattern to generation
		for row, col in pattern_cells:

			# Get row and column
			row += row_offset
			col += col_offset

			self.generation['cells'].add((row, col))

		# Update population, update timeline, check again limits
		self.generation['pop'] = len(self.generation['cells'])
		self.record_history()
		self.check_limit()
		return


	# Update timeline
	def record_history(self):

		# Get year and population
		year = self.generation['year']
		pop = self.generation['pop']

		# Add population to timeline at year index
		try:
			self.gen_timeline[year] = pop
		# If index isn't defined, append to list
		except IndexError:
			if len(self.gen_timeline) == year:
				self.gen_timeline.append(pop)
			# Sanity check
			else:
				print("You're adding a generation that shouldn't exist.")
				print("Year is {} and Population is {}".format(year, pop))
				raise

		return


	# Randomize living cells within defined range of coordinates
	def randomize(self, grid_rows, grid_cols):

		# Arbitrary area around visible rows/cols to randomize
		expand_factor = 1.2

		# Clear life from game
		self.generation['cells'].clear()

		# Loop through defined area, randomly adding living cells
		for r in range(math.floor(grid_rows * expand_factor)):
			for c in range(math.floor(grid_cols * expand_factor)):
				if randint(0, 1):
					self.generation['cells'].add((r, c))

		# Update population, update timeline, check against limits
		self.generation['pop'] = len(self.generation['cells'])
		self.record_history()
		self.check_limit()
		return


	# Erase timeline from year to end (inclusive)
	def erase_future(self, year):

		del self.gen_timeline[year:]

		# If the limit is known and in the future, discard it (that future is null now)
		if self.limit['year'] >= year:
			self.limit = {
				'year': -1,
				'param': None
			}
		return

	# Clear game (living cells, year, population, timeline)
	def clear(self):
		self.generation['cells'].clear()
		self.generation['year'] = 0
		self.generation['pop'] = 0
		self.record_history()
		return


	# Represent cells as a string
	def cells_to_str(self):
		max_row = 0
		max_col = 0

		for cell in iter(self.generation['cells']):
			row, col = cell.split('.')
			max_row = max(max_row, int(row))
			max_col = max(max_col, int(col))

		str_grid = ""

		for i in range(max_row + 10):
			list_row = []
			for j in range(max_col+ 10):
				cell_id = str(i) + '.' + str(j)
				if cell_id in self.generation['cells']:
					list_row.append(1)
				else:
					list_row.append(0)
			str_grid += str(list_row) + '\n'

		return str_grid


	# String representation of game
	def __str__(self):
		return "Population: {}, Year: {}".format(self.generation['pop'], self.generation['year'])
