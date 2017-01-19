from random import randint
from django.core.serializers.json import DjangoJSONEncoder



class Patterns():
	pattern_dict = {

		'block' : [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
		'beehive' : [[0, 0, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0], [0, 1, 0, 0, 1, 0], [0, 0, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0]],

	}

	def __init__(self):
		pass

	def get_pattern(self, pattern):

		if pattern in Patterns.pattern_dict:
			print('ok')

		try:
			return Patterns.pattern_dict[pattern]
		except KeyError:
			raise




class Grid():

	patterns = Patterns()

	def __init__(self, rows=10, cols=10):
		self.grid = self.make_grid(rows, cols)
		self.rows = rows
		self.cols = cols



	def make_grid(self, rows, cols):
		grid = []
		self.rows = rows
		self.cols = cols
		for i in range(self.rows):
			grid.append([])
			for j in range(self.cols):
				grid[i].append(0)
		return grid

	def generations(self):
		pass


	def gen_make(self):
		self.next = self.make_grid(self.rows, self.cols)



	def give_life(self):
		for i in range(self.rows):
			for j in range(self.cols):
				if randint(0,1):
					self.grid[i][j] = 1

	# Step through another generations
	def apply_rules(self, row, col):
		moore_total = 0

		for i in range(row - 1, row + 2):
			for j in range(col - 1, col + 2):
				#print((i, j))
				if i >= 0 and j >= 0 and i < self.rows and j < self.cols and ((i,j) != (row, col)):
					#print((i, j))
					moore_total += self.grid[i][j]
					#print(self.moore_total)


		# Populate the new grid according to the rules

		# if cell is alive
		if self.grid[row][col]:
			if moore_total < 2:
				self.next[row][col] = 0
			elif moore_total == 2 or moore_total == 3:
				self.next[row][col] = 1
			elif moore_total >= 4:
				self.next[row][col] = 0
		# if cell is dead
		else:
			if moore_total == 3:
				self.next[row][col] = 1




	def gen_step(self):
		# Make a new grid
		self.gen_make()

		# Apply rules to each cell in grid
		for i in range(self.rows):
			for j in range(self.cols):
				self.apply_rules(i, j)

		# Replace grid
		self.grid = self.next


	def add_pattern(self, row, col, pattern):
		pattern_matrix = Grid.patterns.get_pattern(pattern)

		print('(rows, col)' + str((self.rows, self.cols)))

		for i in range(len(pattern_matrix)):
			for j in range(len(pattern_matrix[0])):
				self.grid[row + i][col + j] = pattern_matrix[i][j]

		return



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

def start(grid=None):

	global myGrid

	if grid is None:
		grid = Grid(10, 5)
		# Randomize grid
		myGrid = grid
		grid.give_life()

	myGrid = grid
	return myGrid

def step(grid):

	# Apply rules to a generation
	grid.gen_step()
	return grid

def jsonify(grid=None):

	if grid is None:
		raise BaseException

	#return DjangoJSONEncoder().encode(grid.grid)

#grid = Grid()

start()

print(myGrid)
step(myGrid)
#jsonify(myGrid)

#myGrid.add_pattern(10, 5, 'block')

exploder = Grid()
exploder.grid[5][5] = 1
exploder.grid[6][4] = 1
exploder.grid[6][5] = 1
exploder.grid[6][6] = 1
exploder.grid[7][4] = 1
exploder.grid[7][6] = 1
exploder.grid[8][5] = 1


#print((i,j) == (29, 27))












