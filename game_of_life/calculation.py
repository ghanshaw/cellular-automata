from random import randint
from .models import Pattern
from django.core.serializers.json import DjangoJSONEncoder
import json
from collections import Counter
import copy
import time

class Grid():
	def __init__(self, rows=10, cols=10):

		self.rows = rows
		self.cols = cols
		self.moore_total = []
		self.grid = []
		self.next = []
		self.make_grids(rows, cols)
		self.predictions = []



	def make_grids(self, rows, cols):
		self.rows = rows
		self.cols = cols
		for i in range(self.rows):
			self.grid.append([])
			self.next.append([])
			self.moore_total.append([])
			for j in range(self.cols):
				self.grid[i].append(0)
				self.next[i].append(0)
				self.moore_total[i].append(0)
			# return grid



	def generations(self):
		pass


	def gen_make(self):
		self.next = self.make_grid(self.rows, self.cols)



	def random(self):
		self.clear()
		for i in range(self.rows):
			for j in range(self.cols):
				if randint(0, 1):
					self.grid[i][j] = 1


	# Step through another generations
	def step(self):

		# moore_total = []

		for row in range(self.rows):
			# moore_total.append([])
			for col in range(self.cols):

				if self.grid[row][col]:

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

						# for r in range(row - 1, row + 2):
						# 	for c in range(col - 1, col + 2):
						# 		if self.rows > r >= 0 and self.cols > c >= 0 and (r == row and c == col):

		#print(self.moore_total)

		for row in range(self.rows):
			for col in range(self.cols):
				moore_total = self.moore_total[row][col]
				self.moore_total[row][col] = 0

				# if cell is alive
				if self.grid[row][col]:

					if moore_total < 2:
						self.grid[row][col] = 0
					elif moore_total == 2 or moore_total == 3:
						self.grid[row][col] = 1
					elif moore_total >= 4:
						self.grid[row][col] = 0

				# if cell is dead
				else:
					if moore_total == 3:
						self.grid[row][col] = 1


	def predict(self, num=10):
		del(self.predictions)
		self.predictions = []
		for i in range(num):
			#newList = list(self.grid)
			self.predictions.append(copy.deepcopy(self.grid))
			#self.predictions.append(self.grid)
			self.step()


	def add_pattern(self, row, col, pattern):

		pattern_matrix = Pattern.objects.get(name=pattern)
		print(pattern_matrix.grid)
		pattern_matrix = json.JSONDecoder().decode(pattern_matrix.grid)


		print('(rows, col)' + str((self.rows, self.cols)))

		for i in range(len(pattern_matrix)):
			for j in range(len(pattern_matrix[0])):
				self.grid[row + i][col + j] = pattern_matrix[i][j]

		return


	def activate_cells(self, new_cells):

		# print(new_cells)

		for el in new_cells:
			# print(el)
			self.grid[el['row']][el['col']] = 1

	def clear(self):
		for i in range(self.rows):
			for j in range(self.cols):
				self.grid[i][j] = 0


	def __str__(self):
		self.grid_str = ''
		for i in range(len(self.grid)):
			self.grid_str += str(self.grid[i]) + '\n'
		return self.grid_str


	def str_predictions(self):
		self.pred_str = ''
		for i in range(len(self.predictions)):
			predict = self.predictions[i]
			for j in range(len(predict)):
				self.pred_str += '     ' + str(predict[j]) + '\n'
			self.pred_str += '(' + str(id(predict)) + ')' + '------------------------------' + '\n'
		return self.pred_str




	def get_grid(self):
		return self.grid


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


myGrid = Grid(50, 75)
myGrid.random()
print(myGrid)
startTime = time.time()
myGrid.predict()
endTime = time.time()
print(myGrid.str_predictions())
print('Prediciton Time: ' + str(endTime - startTime))

# jsonify(myGrid)

# myGrid.add_pattern(10, 5, 'block')

exploder = Grid()
exploder.grid[5][5] = 1
exploder.grid[6][4] = 1
exploder.grid[6][5] = 1
exploder.grid[6][6] = 1
exploder.grid[7][4] = 1
exploder.grid[7][6] = 1
exploder.grid[8][5] = 1


# print((i,j) == (29, 27))
