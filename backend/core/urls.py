from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet

# 创建路由器
router = DefaultRouter()
router.register(r'students', StudentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
