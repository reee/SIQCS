from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GroupInfoViewSet, StudentGroupAssignmentViewSet

# 创建路由器
router = DefaultRouter()
router.register(r'groups', GroupInfoViewSet)
router.register(r'assignments', StudentGroupAssignmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
