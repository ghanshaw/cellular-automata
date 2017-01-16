from random import randint
from django.core.serializers.json import DjangoJSONEncoder

class Board():

	def __init__(self, length=10, height=10):
		self.board = self.make_board(length, height)

	def make_board(self, length, height):
		board = []
		self.length = length
		self.height = height
		for i in range(self.length):
			board.append([])
			for j in range(self.height):
				board[i].append(0)
		return board

	def generations(self):
		self.generations = []


	def gen_make(self):
		self.next = self.make_board(self.length, self.height)



	def give_life(self):
		for i in range(self.length):
			for j in range(self.height):
				if randint(0,1):
					self.board[i][j] = 1

	# Step through another generations
	def apply_rules(self, row, col):
		self.moore_total = 0
		for i in range(row - 1, row + 2):
			for j in range(col - 1, col + 2):
				#print((i, j))
				if i >= 0 and j >= 0 and i < self.length and j < self.height and ((i,j) != (row, col)):
					#print((i, j))
					self.moore_total += self.board[i][j]
					#print(self.moore_total)

		total = self.moore_total


		# Populate the new board according to the rules

		# if cell is alive
		if self.board[row][col]:
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
		# Make a new board
		self.gen_make()

		# Apply rules to each cell in board
		for i in range(self.length):
			for j in range(self.height):
				self.apply_rules(i, j)

		# Replace board
		self.board = self.next



	def __str__(self):
		self.board_str = ''
		print(len(self.board[0]))
		for i in range(len(self.board[0])):
			self.board_str += str(self.board[i]) + '\n'
		return self.board_str

	def get_board(self):
		return self.board


'''
    1. Any live cell with fewer than two live neighbours dies, as if caused by underpopulation.
    2. Any live cell with two or three live neighbours lives on to the next generation.
    3. Any live cell with more than three live neighbours dies, as if by overpopulation.
    4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
'''

def start(board=None):

	global myBoard

	if board is None:
		board = Board(45, 45)
		# Randomize board
		myBoard = board
		board.give_life()

	myBoard = board
	return myBoard

def step(board):

	# Apply rules to a generation
	board.gen_step()
	return board

def jsonify(board=None):

	if board is None:
		raise BaseException

	#return DjangoJSONEncoder().encode(board.board)

#board = Board()

start()

print(myBoard)
step(myBoard)
#jsonify(myBoard)

i = 29
j = 27

exploder = Board()
exploder.board[5][5] = 1
exploder.board[6][4] = 1
exploder.board[6][5] = 1
exploder.board[6][6] = 1
exploder.board[7][4] = 1
exploder.board[7][6] = 1
exploder.board[8][5] = 1


#print((i,j) == (29, 27))









