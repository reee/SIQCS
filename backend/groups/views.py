from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.http import HttpResponse
import os
import tempfile
from .models import GroupInfo, StudentGroupAssignment
from .serializers import (
    GroupInfoSerializer, 
    StudentGroupAssignmentSerializer,
    GroupStudentListSerializer
)
from core.services import GroupImportService, ExcelTemplateGenerator


class GroupInfoViewSet(viewsets.ModelViewSet):
    """分组信息API视图集"""
    
    queryset = GroupInfo.objects.all()
    serializer_class = GroupInfoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['group_name', 'group_teacher']
    search_fields = ['notification_number', 'group_name', 'group_teacher', 'report_location']
    ordering_fields = ['group_name', 'created_at']
    ordering = ['group_name']
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_excel(self, request):
        """从Excel文件导入分组信息"""
        if 'file' not in request.FILES:
            return Response(
                {'error': '请上传Excel文件'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        
        # 验证文件格式
        if not file.name.endswith(('.xlsx', '.xls')):
            return Response(
                {'error': '只支持Excel文件格式（.xlsx, .xls）'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 保存临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        try:
            # 导入数据
            import_service = GroupImportService()
            result = import_service.import_groups_from_excel(temp_file_path)
            
            return Response(result)
            
        except Exception as e:
            return Response(
                {'error': f'导入失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # 清理临时文件
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    @action(detail=False, methods=['get'])
    def download_template(self, request):
        """下载分组信息导入模板"""
        # 创建临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
            template_path = temp_file.name
        
        try:
            # 生成模板
            ExcelTemplateGenerator.generate_group_template(template_path)
            
            # 读取文件内容
            with open(template_path, 'rb') as f:
                response = HttpResponse(
                    f.read(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="分组信息导入模板.xlsx"'
                return response
                
        finally:
            # 清理临时文件
            if os.path.exists(template_path):
                os.unlink(template_path)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """获取分组中的学生列表"""
        group = self.get_object()
        serializer = GroupStudentListSerializer(group)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """获取分组统计信息"""
        queryset = self.get_queryset()
        
        # 分组统计
        total_groups = queryset.count()
        groups_with_students = queryset.annotate(
            student_count=Count('student_assignments', filter=Q(student_assignments__is_active=True))
        )
        
        # 教师统计
        teachers = queryset.values('group_teacher').distinct().count()
        
        # 学生分布统计
        group_student_stats = []
        for group in groups_with_students:
            group_student_stats.append({
                'group_name': group.group_name,
                'group_teacher': group.group_teacher,
                'student_count': group.student_count,
                'report_location': group.report_location
            })
        
        return Response({
            'total_groups': total_groups,
            'total_teachers': teachers,
            'total_assigned_students': StudentGroupAssignment.objects.filter(is_active=True).count(),
            'group_details': group_student_stats
        })
    
    @action(detail=True, methods=['post'])
    def assign_student(self, request, pk=None):
        """为分组分配学生"""
        group = self.get_object()
        student_id = request.data.get('student_id')
        remarks = request.data.get('remarks', '')
        
        if not student_id:
            return Response(
                {'error': '请提供学生ID'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from core.models import Student
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'error': '学生不存在'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 检查是否已经分配
        if StudentGroupAssignment.objects.filter(
            student=student, 
            group_info=group, 
            is_active=True
        ).exists():
            return Response(
                {'error': '该学生已经分配到此分组'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 创建分配记录
        assignment = StudentGroupAssignment.objects.create(
            student=student,
            group_info=group,
            remarks=remarks
        )
        
        serializer = StudentGroupAssignmentSerializer(assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def remove_student(self, request, pk=None):
        """从分组中移除学生"""
        group = self.get_object()
        student_id = request.data.get('student_id')
        
        if not student_id:
            return Response(
                {'error': '请提供学生ID'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assignment = StudentGroupAssignment.objects.get(
                student_id=student_id,
                group_info=group,
                is_active=True
            )
            assignment.is_active = False
            assignment.save()
            
            return Response({'message': '学生已从分组中移除'})
        except StudentGroupAssignment.DoesNotExist:
            return Response(
                {'error': '学生分配记录不存在'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class StudentGroupAssignmentViewSet(viewsets.ModelViewSet):
    """学生分组分配API视图集"""
    
    queryset = StudentGroupAssignment.objects.all()
    serializer_class = StudentGroupAssignmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['group_info__group_name', 'is_active']
    search_fields = ['student__name', 'student__id_card_number', 'group_info__notification_number']
    ordering_fields = ['assigned_at']
    ordering = ['-assigned_at']
    
    def get_queryset(self):
        """优化查询，减少数据库访问"""
        return super().get_queryset().select_related('student', 'group_info')
    
    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        """批量分配学生到分组"""
        assignments_data = request.data
        
        if not isinstance(assignments_data, list):
            return Response(
                {'error': '请提供分配信息列表'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = StudentGroupAssignmentSerializer(data=assignments_data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
