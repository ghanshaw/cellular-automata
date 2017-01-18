from random import randint
from django.core.serializers.json import DjangoJSONEncoder

class Grid():

	def __init__(self, length=10, height=10):
		self.grid = self.make_grid(length, height)
		self.length = length
		self.height = height

	def make_grid(self, length, height):
		grid = []
		self.length = length
		self.height = height
		for i in range(self.length):
			grid.append([])
			for j in range(self.height):
				grid[i].append(0)
		return grid

	def generations(self):
		self.generations = []


	def gen_make(self):
		self.next = self.make_grid(self.length, self.height)



	def give_life(self):
		for i in range(self.length):
			for j in range(self.height):
				if randint(0,1):
					self.grid[i][j] = 1

	# Step through another generations
	def apply_rules(self, row, col):
		self.moore_total = 0
		for i in range(row - 1, row + 2):
			for j in range(col - 1, col + 2):
				#print((i, j))
				if i >= 0 and j >= 0 and i < self.length and j < self.height and ((i,j) != (row, col)):
					#print((i, j))
					self.moore_total += self.grid[i][j]
					#print(self.moore_total)

		total = self.moore_total


		# Populate the new grid according to the rules

		# if cell is alive
		if self.grid[row][col]:
			if total < 2:
				self.next[row][col] = 0
			elif total == 2 or total == 3:
				self.next[row][col] = 1
			elif total >= 4:
				self.next[row][col] = 0
		# if cell is dead
		else:
			if total == 3:
				self.next[row][col] = 1




	def gen_step(self):
		# Make a new grid
		self.gen_make()

		# Apply rules to each cell in grid
		for i in range(self.length):
			for j in range(self.height):
				self.apply_rules(i, j)

		# Replace grid
		self.grid = self.next



	def __str__(self):
		self.grid_str = ''
		print(len(self.grid[0]))
		for i in range(len(self.grid[0])):
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
		grid = Grid(45, 45)
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

i = 29
j = 27

exploder = Grid()
exploder.grid[5][5] = 1
exploder.grid[6][4] = 1
exploder.grid[6][5] = 1
exploder.grid[6][6] = 1
exploder.grid[7][4] = 1
exploder.grid[7][6] = 1
exploder.grid[8][5] = 1


#print((i,j) == (29, 27))









