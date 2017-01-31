from django.db import models

# Create your models here.
class Pattern(models.Model):
	cells = models.CharField(max_length=300)
	name = models.CharField(max_length=200, unique=True)
	type = models.CharField(max_length=100)
	period = models.CharField(max_length=200)
	src_root = models.CharField(max_length=100)
	file_type = models.CharField(max_length=10)
	src = models.CharField(max_length=200)
	rows = models.IntegerField(default=0);
	columns = models.IntegerField(default=0);

	def src(self):
		return self.src_root + self.name + '.' + self.file_type








