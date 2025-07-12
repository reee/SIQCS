from django.db import models
from django.core.validators import RegexValidator
from core.models import Student


class GroupInfo(models.Model):
    """分组信息表"""
    
    # 手机号验证器
    phone_validator = RegexValidator(
        regex=r'^1[3-9]\d{9}$',
        message='请输入正确的手机号码'
    )
    
    # 分组基础信息
    group_name = models.CharField('所属分组', max_length=100)
    group_teacher = models.CharField('分组教师', max_length=50)
    teacher_phone = models.CharField(
        '教师联系方式', 
        max_length=11, 
        validators=[phone_validator]
    )
    report_location = models.CharField('报到地点', max_length=200)
    
    # 系统字段
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        verbose_name = '分组信息'
        verbose_name_plural = '分组信息'
        ordering = ['group_name']
    
    def __str__(self):
        return f"{self.group_name}"


class StudentGroupAssignment(models.Model):
    """学生分组关联表"""
    
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        verbose_name='学生',
        related_name='group_assignments'
    )
    group_info = models.ForeignKey(
        GroupInfo, 
        on_delete=models.CASCADE, 
        verbose_name='分组信息',
        related_name='student_assignments'
    )
    
    # 分配信息
    assigned_at = models.DateTimeField('分配时间', auto_now_add=True)
    is_active = models.BooleanField('是否有效', default=True)
    remarks = models.TextField('备注', blank=True)
    
    class Meta:
        verbose_name = '学生分组分配'
        verbose_name_plural = '学生分组分配'
        unique_together = ['student', 'group_info']  # 同一学生不能重复分配到同一分组
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.student.name} -> {self.group_info.group_name}"
