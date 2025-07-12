from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
def api_root(request):
    """API根路径，返回可用的API端点"""
    return Response({
        'message': '学生信息查询及收集系统 API',
        'version': '1.0.0',
        'endpoints': {
            'students': {
                'list': '/api/students/',
                'detail': '/api/students/{id}/',
                'statistics': '/api/students/statistics/',
                'bulk_create': '/api/students/bulk_create/',
                'student_groups': '/api/students/{id}/groups/'
            },
            'groups': {
                'list': '/api/groups/',
                'detail': '/api/groups/{id}/',
                'students': '/api/groups/{id}/students/',
                'statistics': '/api/groups/statistics/',
                'assign_student': '/api/groups/{id}/assign_student/',
                'remove_student': '/api/groups/{id}/remove_student/'
            },
            'assignments': {
                'list': '/api/assignments/',
                'detail': '/api/assignments/{id}/',
                'bulk_assign': '/api/assignments/bulk_assign/'
            },
            'admin': '/admin/'
        }
    })
