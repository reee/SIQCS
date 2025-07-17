from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.http import HttpResponse
from django.conf import settings
import os
import tempfile
from .models import Student
from .serializers import StudentSerializer, StudentListSerializer
from .services import StudentImportService, ExcelTemplateGenerator


class StudentViewSet(viewsets.ModelViewSet):
    """学生信息API视图集"""
    
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'residence_status', 'uniform_purchase', 'info_status']
    search_fields = ['name', 'id_card_number', 'interests_talents', 'import_batch']
    ordering_fields = ['name', 'created_at', 'height', 'weight', 'profile_completed_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'list':
            return StudentListSerializer
        return StudentSerializer
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_excel(self, request):
        """从Excel文件导入学生信息"""
        if 'file' not in request.FILES:
            return Response(
                {'error': '请上传Excel文件'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        batch_name = request.data.get('batch_name', '')
        
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
            import_service = StudentImportService()
            result = import_service.import_students_from_excel(temp_file_path, batch_name)
            
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
        """下载学生信息导入模板"""
        # 创建临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
            template_path = temp_file.name
        
        try:
            # 生成模板
            ExcelTemplateGenerator.generate_student_template(template_path)
            
            # 读取文件内容
            with open(template_path, 'rb') as f:
                response = HttpResponse(
                    f.read(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="学生信息导入模板.xlsx"'
                return response
                
        finally:
            # 清理临时文件
            if os.path.exists(template_path):
                os.unlink(template_path)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """获取学生统计信息"""
        queryset = self.get_queryset()
        
        # 基础统计
        total_count = queryset.count()
        male_count = queryset.filter(gender='M').count()
        female_count = queryset.filter(gender='F').count()
        resident_count = queryset.filter(residence_status='RESIDENT').count()
        uniform_count = queryset.filter(uniform_purchase=True).count()
        
        # 信息完整度统计
        status_stats = {}
        for status_choice in Student.INFO_STATUS_CHOICES:
            status_key = status_choice[0]
            status_stats[status_key] = queryset.filter(info_status=status_key).count()
        
        # 身高体重统计（排除空值）
        height_data = queryset.exclude(height__isnull=True).values_list('height', flat=True)
        weight_data = queryset.exclude(weight__isnull=True).values_list('weight', flat=True)
        
        avg_height = sum(height_data) / len(height_data) if height_data else 0
        avg_weight = sum(weight_data) / len(weight_data) if weight_data else 0
        
        # 导入批次统计
        batch_stats = queryset.exclude(import_batch='').values('import_batch').distinct().count()
        
        return Response({
            'total_students': total_count,
            'gender_distribution': {
                'male': male_count,
                'female': female_count
            },
            'residence_distribution': {
                'resident': resident_count,
                'non_resident': queryset.filter(residence_status='NON_RESIDENT').count(),
                'unknown': queryset.filter(residence_status='UNKNOWN').count()
            },
            'uniform_purchase': {
                'purchased': uniform_count,
                'not_purchased': queryset.filter(uniform_purchase=False).count(),
                'unknown': queryset.filter(uniform_purchase__isnull=True).count()
            },
            'info_completion': status_stats,
            'physical_stats': {
                'average_height': round(avg_height, 2),
                'average_weight': round(avg_weight, 2),
                'height_count': len(height_data),
                'weight_count': len(weight_data)
            },
            'import_batches': batch_stats
        })
    
    @action(detail=False, methods=['get'])
    def incomplete_profiles(self, request):
        """获取资料不完整的学生列表"""
        incomplete_students = self.get_queryset().exclude(info_status='COMPLETE')
        
        page = self.paginate_queryset(incomplete_students)
        if page is not None:
            serializer = StudentListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = StudentListSerializer(incomplete_students, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete_profile(self, request, pk=None):
        """学生完善个人资料"""
        student = self.get_object()
        
        # 允许更新的字段
        allowed_fields = [
            'residence_status', 'height', 'weight', 'uniform_purchase',
            'interests_talents', 'phone_number', 'email'
        ]
        
        update_data = {}
        for field in allowed_fields:
            if field in request.data:
                update_data[field] = request.data[field]
        
        # 更新学生信息
        for field, value in update_data.items():
            setattr(student, field, value)
        
        try:
            student.full_clean()
            student.save()
            
            serializer = StudentSerializer(student)
            return Response({
                'message': '资料更新成功',
                'completion_percentage': student.completion_percentage,
                'info_status': student.get_info_status_display(),
                'student': serializer.data
            })
            
        except Exception as e:
            return Response(
                {'error': f'更新失败: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """批量创建学生信息"""
        if not isinstance(request.data, list):
            return Response(
                {'error': '请提供学生信息列表'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = StudentSerializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def groups(self, request, pk=None):
        """获取学生的分组信息"""
        student = self.get_object()
        assignments = student.group_assignments.filter(is_active=True).select_related('group_info')
        
        groups_data = []
        for assignment in assignments:
            groups_data.append({
                'assignment_id': assignment.id,
                'group_info': {
                    'id': assignment.group_info.id,
                    'group_name': assignment.group_info.group_name,
                    'group_teacher': assignment.group_info.group_teacher,
                    'teacher_phone': assignment.group_info.teacher_phone,
                    'report_location': assignment.group_info.report_location,
                },
                'assigned_at': assignment.assigned_at,
                'remarks': assignment.remarks
            })
        
        return Response({
            'student': StudentListSerializer(student).data,
            'groups': groups_data
        })
    
    @action(detail=False, methods=['post'])
    def lookup_by_name_and_id_suffix(self, request):
        """通过姓名和身份证后6位查询学生信息"""
        name = request.data.get('name', '').strip()
        id_suffix = request.data.get('id_suffix', '').strip()
        
        if not name or not id_suffix:
            return Response(
                {'error': '请提供姓名和身份证后6位'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(id_suffix) != 6:
            return Response(
                {'error': '身份证后6位长度不正确'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 查找匹配的学生
            students = Student.objects.filter(
                name=name,
                id_card_number__endswith=id_suffix
            )
            
            if not students.exists():
                return Response(
                    {'error': '未找到匹配的学生信息，请检查姓名和身份证后6位是否正确'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if students.count() > 1:
                return Response(
                    {'error': '找到多个匹配的学生，请联系管理员'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            student = students.first()
            serializer = StudentListSerializer(student)
            
            # 生成安全访问token
            import hashlib
            import time
            import secrets
            
            # 创建包含学生ID、时间戳和随机数的token
            timestamp = str(int(time.time()))
            random_str = secrets.token_urlsafe(16)
            token_data = f"{student.id}:{timestamp}:{random_str}"
            
            # 使用学生身份证号作为密钥的一部分来加密token
            secret_key = f"{student.id_card_number}:{student.name}:SIQCS_SECRET"
            token = hashlib.sha256(f"{token_data}:{secret_key}".encode()).hexdigest()
            
            return Response({
                'message': '查询成功',
                'student': serializer.data,
                'access_token': f"{student.id}:{timestamp}:{random_str}:{token}"
            })
            
        except Exception as e:
            return Response(
                {'error': f'查询失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def verify_access(self, request):
        """验证访问token并返回学生信息"""
        token = request.query_params.get('token', '')
        
        if not token:
            return Response(
                {'error': '缺少访问token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 解析token
            parts = token.split(':')
            if len(parts) != 4:
                return Response(
                    {'error': '无效的访问token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            student_id, timestamp, random_str, provided_token = parts
            
            # 检查学生是否存在
            try:
                student = Student.objects.get(id=int(student_id))
            except (Student.DoesNotExist, ValueError):
                return Response(
                    {'error': '学生信息不存在'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # 验证token
            import hashlib
            import time
            
            token_data = f"{student_id}:{timestamp}:{random_str}"
            secret_key = f"{student.id_card_number}:{student.name}:SIQCS_SECRET"
            expected_token = hashlib.sha256(f"{token_data}:{secret_key}".encode()).hexdigest()
            
            if provided_token != expected_token:
                return Response(
                    {'error': '访问token无效'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 检查token是否过期（24小时有效期）
            current_time = int(time.time())
            token_time = int(timestamp)
            if current_time - token_time > 24 * 3600:  # 24小时
                return Response(
                    {'error': '访问token已过期，请重新查询'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 返回学生信息
            serializer = StudentSerializer(student)
            return Response({
                'student': serializer.data,
                'valid': True
            })
            
        except Exception as e:
            return Response(
                {'error': f'token验证失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """批量删除学生"""
        student_ids = request.data.get('student_ids', [])
        import_batch = request.data.get('import_batch', '')
        delete_all = request.data.get('delete_all', False)
        
        if delete_all:
            # 删除所有学生
            deleted_count = Student.objects.count()
            Student.objects.all().delete()
            return Response({
                'message': f'成功删除 {deleted_count} 名学生',
                'deleted_count': deleted_count
            })
        
        if import_batch:
            # 按批次删除
            deleted_count = Student.objects.filter(import_batch=import_batch).count()
            Student.objects.filter(import_batch=import_batch).delete()
            return Response({
                'message': f'成功删除批次 "{import_batch}" 的 {deleted_count} 名学生',
                'deleted_count': deleted_count
            })
        
        if student_ids:
            # 按ID列表删除
            if not isinstance(student_ids, list):
                return Response(
                    {'error': 'student_ids 必须是数组'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            deleted_count = Student.objects.filter(id__in=student_ids).count()
            Student.objects.filter(id__in=student_ids).delete()
            return Response({
                'message': f'成功删除 {deleted_count} 名学生',
                'deleted_count': deleted_count
            })
        
        return Response(
            {'error': '请提供要删除的学生ID列表、导入批次或设置删除全部'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def import_batches(self, request):
        """获取所有导入批次"""
        batches = Student.objects.exclude(
            Q(import_batch__isnull=True) | Q(import_batch='')
        ).values_list('import_batch', flat=True).distinct().order_by('import_batch')
        
        batch_stats = []
        for batch in batches:
            count = Student.objects.filter(import_batch=batch).count()
            batch_stats.append({
                'batch_name': batch,
                'student_count': count
            })
        
        return Response({
            'batches': batch_stats,
            'total_batches': len(batch_stats)
        })
