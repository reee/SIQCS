from django.contrib import admin
from .models import GroupInfo, StudentGroupAssignment


@admin.register(GroupInfo)
class GroupInfoAdmin(admin.ModelAdmin):
    list_display = [
        'group_name', 'group_teacher', 
        'teacher_phone', 'report_location', 'student_count', 'created_at'
    ]
    list_filter = ['group_name', 'group_teacher', 'created_at']
    search_fields = ['group_name', 'group_teacher']
    readonly_fields = ['created_at', 'updated_at']
    
    def student_count(self, obj):
        return obj.student_assignments.filter(is_active=True).count()
    student_count.short_description = '学生数量'


@admin.register(StudentGroupAssignment)
class StudentGroupAssignmentAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'group_info', 'assigned_at', 'is_active'
    ]
    list_filter = ['group_info__group_name', 'is_active', 'assigned_at']
    search_fields = ['student__name', 'student__id_card_number', 'student__notification_number']
    readonly_fields = ['assigned_at']
    
    autocomplete_fields = ['student']  # 为学生字段添加自动完成功能
