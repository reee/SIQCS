from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def admin_login(request):
    """管理员登录接口"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return Response(
                {'error': '用户名和密码不能为空'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 验证用户
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'error': '用户名或密码错误'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # 检查是否为管理员
        if not user.is_superuser:
            return Response(
                {'error': '只有管理员可以登录'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 登录用户
        login(request, user)
        
        return Response({
            'message': '登录成功',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
            }
        })
        
    except json.JSONDecodeError:
        return Response(
            {'error': '请求数据格式错误'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'登录失败: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def admin_logout(request):
    """管理员登出接口"""
    try:
        logout(request)
        return Response({'message': '登出成功'})
    except Exception as e:
        return Response(
            {'error': f'登出失败: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    """检查用户认证状态"""
    try:
        if request.user.is_authenticated and request.user.is_superuser:
            return Response({
                'authenticated': True,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'email': request.user.email,
                    'is_superuser': request.user.is_superuser,
                }
            })
        else:
            return Response({
                'authenticated': False,
                'user': None
            })
    except Exception as e:
        return Response(
            {'error': f'检查认证状态失败: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
