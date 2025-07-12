from rest_framework import serializers
from .models import GroupInfo, StudentGroupAssignment
from core.serializers import StudentListSerializer


class GroupInfoSerializer(serializers.ModelSerializer):
    """分组信息序列化器"""
    
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupInfo
        fields = [
            'id', 'group_name', 'group_teacher',
            'teacher_phone', 'report_location', 'student_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_student_count(self, obj):
        """获取分组中的学生数量"""
        return obj.student_assignments.filter(is_active=True).count()
    
    def validate_teacher_phone(self, value):
        """验证教师手机号格式"""
        if not value.startswith('1') or len(value) != 11:
            raise serializers.ValidationError("请输入正确的手机号码")
        return value


class StudentGroupAssignmentSerializer(serializers.ModelSerializer):
    """学生分组分配序列化器"""
    
    student_info = StudentListSerializer(source='student', read_only=True)
    group_info_detail = GroupInfoSerializer(source='group_info', read_only=True)
    
    class Meta:
        model = StudentGroupAssignment
        fields = [
            'id', 'student', 'student_info', 'group_info', 'group_info_detail',
            'assigned_at', 'is_active', 'remarks'
        ]
        read_only_fields = ['assigned_at']
    
    def validate(self, data):
        """验证学生分组分配"""
        student = data.get('student')
        group_info = data.get('group_info')
        
        # 检查是否已经分配过
        if StudentGroupAssignment.objects.filter(
            student=student, 
            group_info=group_info,
            is_active=True
        ).exists():
            raise serializers.ValidationError("该学生已经分配到此分组")
        
        return data


class GroupStudentListSerializer(serializers.ModelSerializer):
    """分组学生列表序列化器"""
    
    students = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupInfo
        fields = [
            'id', 'group_name', 'group_teacher',
            'teacher_phone', 'report_location', 'students'
        ]
    
    def get_students(self, obj):
        """获取分组中的所有学生"""
        assignments = obj.student_assignments.filter(is_active=True).select_related('student')
        return [
            {
                'assignment_id': assignment.id,
                'student': StudentListSerializer(assignment.student).data,
                'assigned_at': assignment.assigned_at,
                'remarks': assignment.remarks
            }
            for assignment in assignments
        ]
