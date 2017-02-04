from random import randint
from .models import Pattern
from django.core.serializers.json import DjangoJSONEncoder
import json
from collections import Counter
import copy
from time import time
from collections import defaultdict
import math

class Conway():
	def __init__(self, rows=10, cols=10):


		#self.rows = rows
		#self.cols = cols

		# 2D array storing moore totals for each cell
		#self.moore_total = []

		# Generation dict stores 2D array of cells,
		# generation year and population
		self.generation = {
			'cells': set(),
			'year': 0,
			'pop': 0
		}

		self.gen_timeline = []
		self.max_year = 2000
		self.max_pop = 5000
		self.limit = {
			'year': -1,
			'param': None
		}


		self.predictions = []


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
		# else:
		# 	self.limit = {
		# 		'year': -1,
		# 		'param': None
		# 	}
		# return False



	def randomize(self, gridRows, gridCols):

		# Arbitraty area around visible rows/cols to randomize
		expand_factor = 1.2;
		self.generation['cells'].clear();

		for r in range(math.floor(gridRows * expand_factor)):
			for c in range(math.floor(gridCols * expand_factor)):
				if randint(0, 1):
					self.generation['cells'].add((r, c))

		self.generation['pop'] = len(self.generation['cells'])
		self.record_history()
		self.check_limit()


	# Step through another generations
	def step(self):

		moore_total = defaultdict(int)

		for cell in iter(self.generation['cells']):

			row, col = cell

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

			for r, c in moore_neighborhood:
				moore_total[(r, c)] += 1

		living_cells = set()

		for cell in moore_total:
			# if cell is alive
			if cell in self.generation['cells']:

				if moore_total[cell] == 2 or moore_total[cell] == 3:
					living_cells.add(cell)

			# if cell is dead
			else:
				if moore_total[cell] == 3:
					living_cells.add(cell)


		self.generation['cells'] = living_cells
		self.generation['pop'] = len(living_cells)
		self.generation['year'] += 1

		# Record history
		self.record_history()
		self.check_limit()


	def predict(self, num=10):
		start_time = time()
		# Delete existing predictions
		del self.predictions
		self.predictions = []

		# Append current generation
		self.append_prediction()

		for i in range(num):
			self.step()
			self.append_prediction()

		end_time = time()
		print('Predict Time: ' + str(end_time - start_time) + ' s')


	# Append current generation to predictions list
	def append_prediction(self):
		self.predictions.append(copy.deepcopy(self.generation))


	def add_pattern(self, row_offset, col_offset, pattern):

		pattern_cells = Pattern.objects.get(name=pattern)
		rows = pattern_cells.rows
		columns = pattern_cells.columns
		pattern_cells = json.JSONDecoder().decode(pattern_cells.cells)

		# Clear space first
		for i in range(rows):
			for j in range(columns):

				row = i + row_offset
				col = j + col_offset

				cell = (row, col)

				# If cell is alive in generation, kill it
				if cell in self.generation['cells']:
					self.generation['cells'].remove(cell)

		# Add cells in pattern to generation
		for row, col in pattern_cells:

			row += row_offset
			col += col_offset

			self.generation['cells'].add((row, col))

		self.generation['pop'] = len(self.generation['cells'])
		self.record_history()
		self.check_limit()
		return

	def record_history(self):

		year = self.generation['year']
		pop = self.generation['pop']

		try:
			self.gen_timeline[year] = pop
		except IndexError:
			if len(self.gen_timeline) == year:
				self.gen_timeline.append(pop)
			else:
				print("You're adding a generation that shouldn't exist.")
				print("Year is {} and Population is {}".format(year, pop))
				raise

		return

	def erase_future(self, year):

		del self.gen_timeline[year:]

		# If the limit is known and in the future, discard it (that future is null now)
		if self.limit['year'] >= year:
			self.limit = {
				'year': -1,
				'param': None
			}

	def activate_cells(self, new_cells):

		for cell in new_cells:
			self.generation['cells'].add(tuple(cell))

		self.generation['pop'] = len(self.generation['cells'])
		self.record_history()
		self.check_limit()
		return

	def clear(self):
		self.generation['cells'].clear()
		self.generation['year'] = 0
		self.generation['pop'] = 0
		self.record_history()


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






	def __str__(self):
		grid_str = ''
		for i in range(len(self.generation['grid'])):
			grid_str += str(self.generation['grid'][i]) + '\n'
		return grid_str




	def str_predictions(self):
		self.pred_str = ''
		for i in range(len(self.predictions)):
			predict = self.predictions[i]
			for j in range(len(predict)):
				self.pred_str += '     ' + str(predict[j]) + '\n'
			self.pred_str += '(' + str(id(predict)) + ')' + '------------------------------' + '\n'
		return self.pred_str




	def get_grid(self):
		return self.generation['grid']


'''
    1. Any live cell with fewer than two live neighbours dies, as if caused by underpopulation.
    2. Any live cell with two or three live neighbours lives on to the next generation.
    3. Any live cell with more than three live neighbours dies, as if by overpopulation.
    4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
'''


# conway = Conway()
# new_cells = {'2.2', '2.4', '2.5', '2.6', '3.2', '3.3', '5.5', '7.7', '9.9'}
# conway.activate_cells(new_cells)
# print(conway.cells_to_str())
# conway.step()
# conway.predict(10)
# print(conway.cells_to_str())




# def make_generation(self, rows, cols):
# 	self.rows = rows
# 	self.cols = cols
# 	for i in range(self.rows):
# 		self.generation['grid'].append([])
# 		self.moore_total.append([])
# 		for j in range(self.cols):
# 			self.generation['grid'][i].append(0)
# 			self.moore_total[i].append(0)