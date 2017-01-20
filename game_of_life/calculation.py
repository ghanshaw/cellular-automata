from random import randint
# from .models import Pattern
from django.core.serializers.json import DjangoJSONEncoder
import json
from collections import Counter


class Grid():
	def __init__(self, rows=10, cols=10):

		self.rows = rows
		self.cols = cols
		self.moore_total = []
		self.grid = []
		self.next = []
		self.make_grids(rows, cols)



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

					# self.grid = self.next
					# self.next = self.moore_total



					# coord = { 'row': row - self.cols, 'col': col - 1 }
					# if (coord['row'] >= 0 and coord['row'] < grid.rows and coord['col'] >= 0 and coord['col'] < grid.cols):
					# 	pass
					#
					# moore_total += self.grid[row - self.cols][col - 1]
					# moore_total += self.grid[row - self.cols][col]
					# moore_total += self.grid[row - self.cols][col + 1]
					# moore_total += self.grid[row][col - 1]
					# moore_total += self.grid[row][col]
					# moore_total += self.grid[row][col + 1]
					# moore_total += self.grid[row + self.cols][col - 1]
					# moore_total += self.grid[row + self.cols][col]
					# moore_total += self.grid[row + self.cols][col + 1]


					# for i in range(row - 1, row + 2):
					# 	for j in range(col - 1, col + 2):
					# 		#print((i, j))
					# 		if i >= 0 and j >= 0 and i < self.rows and j < self.cols and ((i,j) != (row, col)):
					# 			#print((i, j))
					# 			moore_total += self.grid[i][j]
					# 			#print(self.moore_total)
					#
					#
					# # Populate the new grid according to the rules
					#
					# # if cell is alive
					#



	def step2(self):
		print('step function')
		# Make a new grid
		self.gen_make()

		# Apply rules to each cell in grid
		for i in range(self.rows):
			for j in range(self.cols):
				self.apply_rules(i, j)

			# Replace grid



	# def add_pattern(self, row, col, pattern):
	#
	# 	pattern_matrix = Pattern.objects.get(name=pattern)
	# 	print(pattern_matrix.grid)
	# 	pattern_matrix = json.JSONDecoder().decode(pattern_matrix.grid)
	#
	#
	# 	print('(rows, col)' + str((self.rows, self.cols)))
	#
	# 	for i in range(len(pattern_matrix)):
	# 		for j in range(len(pattern_matrix[0])):
	# 			self.grid[row + i][col + j] = pattern_matrix[i][j]
	#
	# 	return

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


myGrid = Grid(5, 5)
myGrid.random()
print(myGrid)
myGrid.step()
myGrid.step()
myGrid.step()
print(myGrid)

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
