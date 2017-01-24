from random import randint
from .models import Pattern
from django.core.serializers.json import DjangoJSONEncoder
import json
from collections import Counter
import copy
import time

class Conway():
	def __init__(self, rows=10, cols=10):

		self.rows = rows
		self.cols = cols

		# 2D array storing moore totals for each cell
		self.moore_total = []

		# Generation dict stores 2D array of cells,
		# generation year and population
		self.generation = {
			'grid': [],
			'year': 0,
			'pop': 0
		}

		self.predictions = []
		self.make_generation(rows, cols)


	def make_generation(self, rows, cols):
		self.rows = rows
		self.cols = cols
		for i in range(self.rows):
			self.generation['grid'].append([])
			self.moore_total.append([])
			for j in range(self.cols):
				self.generation['grid'][i].append(0)
				self.moore_total[i].append(0)



	def gen_make(self):
		self.next = self.make_grid(self.rows, self.cols)



	def random(self):
		self.clear()
		for i in range(self.rows):
			for j in range(self.cols):
				if randint(0, 1):
					self.generation['grid'][i][j] = 1


	# Step through another generations
	def step(self):

		# moore_total = []

		for row in range(self.rows):
			# moore_total.append([])
			for col in range(self.cols):

				if self.generation['grid'][row][col]:

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
						if self.rows > r >= 0 and self.cols > c >= 0:
							self.moore_total[r][c] += 1

		# Reset population
		self.generation['pop'] = 0

		# Increment year
		self.generation['year'] += 1

		for row in range(self.rows):
			for col in range(self.cols):
				moore_total = self.moore_total[row][col]
				self.moore_total[row][col] = 0

				# if cell is alive
				if self.generation['grid'][row][col]:

					if moore_total < 2:
						self.generation['grid'][row][col] = 0
					elif moore_total == 2 or moore_total == 3:
						self.generation['grid'][row][col] = 1
						self.generation['pop'] += 1
					elif moore_total >= 4:
						self.generation['grid'][row][col] = 0

				# if cell is dead
				else:
					if moore_total == 3:
						self.generation['grid'][row][col] = 1
						self.generation['pop'] += 1


	def predict(self, num=10):
		del(self.predictions)
		self.predictions = []
		for i in range(num):
			#newList = list(self.generation['grid'])
			self.predictions.append(copy.deepcopy(self.generation))
			#self.predictions.append(self.generation['grid'])
			self.step()


	def add_pattern(self, row, col, pattern):

		pattern_matrix = Pattern.objects.get(name=pattern)
		print(pattern_matrix.grid)
		pattern_matrix = json.JSONDecoder().decode(pattern_matrix.grid)

		print('(rows, col)' + str((self.rows, self.cols)))

		for i in range(len(pattern_matrix)):
			for j in range(len(pattern_matrix[0])):

				cell_change = pattern_matrix[i][j] - self.generation['grid'][row + i][col + j]
				self.generation['pop'] += cell_change
				self.generation['grid'][row + i][col + j] = pattern_matrix[i][j]

		return


	def activate_cells(self, new_cells):

		# print(new_cells)

		for el in new_cells:
			# print(el)
			self.generation['grid'][el['row']][el['col']] = 1

	def clear(self):
		for i in range(self.rows):
			for j in range(self.cols):
				self.generation['grid'][i][j] = 0

		self.generation['year'] = 0
		self.generation['pop'] = 0


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

# def start(grid=None):
#
# 	global myGrid
#
# 	if grid is None:
# 		grid = Grid(10, 5)
# 		# Randomize grid
# 		myGrid = grid
# 		grid.random()
#
# 	myGrid = grid
# 	return myGrid


myGrid = Conway(50, 75)
# myGrid.random()
# print(myGrid)
# startTime = time.time()
# myGrid.predict()
# endTime = time.time()
# print(myGrid.str_predictions())
# print('Prediciton Time: ' + str(endTime - startTime))
#
# # jsonify(myGrid)
#
# # myGrid.add_pattern(10, 5, 'block')
#
# exploder = Conway()
# exploder.generation['grid'][5][5] = 1
# exploder.generation['grid'][6][4] = 1
# exploder.generation['grid'][6][5] = 1
# exploder.generation['grid'][6][6] = 1
# exploder.generation['grid'][7][4] = 1
# exploder.generation['grid'][7][6] = 1
# exploder.generation['grid'][8][5] = 1


# print((i,j) == (29, 27))
