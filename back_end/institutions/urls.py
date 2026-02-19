from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('finder/', views.finder, name='finder'),
    path('career/', views.career, name='career'),
    path('compare/', views.compare, name='compare'),
    path('tools/', views.tools, name='tools'),
]
