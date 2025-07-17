"""
URL configuration for siqcs_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from . import views
from . import auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', views.api_root, name='api_root'),
    path('api/', include('core.urls')),
    path('api/', include('groups.urls')),
    # 认证相关接口
    path('api/auth/login/', auth_views.admin_login, name='admin_login'),
    path('api/auth/logout/', auth_views.admin_logout, name='admin_logout'),
    path('api/auth/check/', auth_views.check_auth, name='check_auth'),
]
