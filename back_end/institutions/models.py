from django.db import models


class College(models.Model):
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    """Naac_Grade = models.CharField(max_length=50)"""
    def __str__(self):
        return self.name


class Course(models.Model):
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class CollegeCourse(models.Model):
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    fees_min = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.college.name} - {self.course.name}"
